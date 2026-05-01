import { getUniqueName } from '@/editor-api/assets/unique-name';

const TEXT_TYPES = new Set(['css', 'html', 'json', 'text', 'shader']);
// types we can recreate client-side without re-uploading file blobs
const CLIENT_PASTE_TYPES = new Set([...TEXT_TYPES, 'folder']);

editor.once('load', () => {
    // get direct children of a folder (or root when folderId === null)
    const childrenOf = (folderId: string | number | null) => {
        return editor.call('assets:list').filter((a: any) => {
            const p = a.get('path');
            const par = p && p.length ? p[p.length - 1] : null;
            return (par ?? null) === (folderId ?? null);
        });
    };

    // build the set of names already in use within a folder (sans optional self)
    const takenIn = (folderId: string | number | null, exceptId?: string | number) => {
        const taken = new Set<string>();
        for (const a of childrenOf(folderId)) {
            if (exceptId !== undefined && a.get('id') === exceptId) {
                continue;
            }
            taken.add(a.get('name'));
        }
        return taken;
    };

    // fetch a text asset's file contents via REST
    const fetchTextContent = (asset: any) => new Promise<string>((resolve, reject) => {
        const filename = asset.get('file.filename');
        if (!filename) {
            resolve('');
            return;
        }
        editor.api.globals.rest.assets.assetGetFile(
            asset.get('id'),
            filename,
            { branchId: config.self.branch.id }
        )
        .on('load', (_status: number, data: unknown) => {
            resolve(typeof data === 'string' ? data.replace(/\r\n?/g, '\n') : '');
        })
        .on('error', (_status: number, err: unknown) => reject(err));
    });

    // create one asset under targetFolder mirroring source. returns the newly
    // created Asset (editor-api object) so callers can recurse into folders.
    const pasteOne = async (source: any, targetFolderApi: any, targetFolderId: string | number | null): Promise<any> => {
        const type = source.get('type');
        const desired = source.get('name');
        const taken = takenIn(targetFolderId);
        const uniqueName = getUniqueName(desired, taken);

        if (TEXT_TYPES.has(type)) {
            const text = await fetchTextContent(source);
            if (type === 'json') {
                let parsed: object;
                try {
                    parsed = text ? JSON.parse(text) : {};
                } catch (_) {
                    parsed = {};
                }
                return editor.api.globals.assets.createJson({
                    name: uniqueName,
                    json: parsed,
                    folder: targetFolderApi
                });
            }
            const method = `create${type[0].toUpperCase()}${type.slice(1)}` as
                'createCss' | 'createHtml' | 'createText' | 'createShader';
            return editor.api.globals.assets[method]({
                name: uniqueName,
                text,
                folder: targetFolderApi
            });
        }

        if (type === 'folder') {
            return editor.api.globals.assets.createFolder({
                name: uniqueName,
                folder: targetFolderApi
            });
        }

        return null;
    };

    // recursively paste a folder's children into the new folder. siblings
    // share a target folder, so resolve them sequentially — otherwise two
    // children with identical names could both win the same getUniqueName slot.
    const pasteFolderChildren = async (sourceFolder: any, newFolder: any) => {
        const sourceId = sourceFolder.get('id');
        const newFolderId = newFolder.get('id');
        const newFolderObserver = editor.call('assets:get', newFolderId);
        const newFolderApi = newFolderObserver?.apiAsset ?? newFolder;

        for (const child of childrenOf(sourceId)) {
            if (!CLIENT_PASTE_TYPES.has(child.get('type'))) {
                continue;
            }
            // eslint-disable-next-line no-await-in-loop
            const created = await pasteOne(child, newFolderApi, newFolderId);
            if (created && child.get('type') === 'folder') {
                // eslint-disable-next-line no-await-in-loop
                await pasteFolderChildren(child, created);
            }
        }
    };

    // wait for the asset to land in the local registry, then suffix its name (and
    // file.filename for text-based files) if a sibling already uses it. used as
    // a fallback when we delegate to the server-side REST paste (cross-project,
    // binary types, etc.)
    const ensureUniqueOnPaste = (assetId: string, targetFolderId: string | number | null) => {
        const apply = () => {
            const asset = editor.call('assets:get', assetId);
            if (!asset) {
                return;
            }
            const path = asset.get('path');
            const parentId = path && path.length ? path[path.length - 1] : null;
            if ((parentId ?? null) !== (targetFolderId ?? null)) {
                return;
            }
            const type = asset.get('type');
            const enforce = TEXT_TYPES.has(type) || type === 'folder' || type === 'script';
            if (!enforce) {
                return;
            }

            const taken = takenIn(targetFolderId, assetId);
            const currentName = asset.get('name');
            if (!taken.has(currentName)) {
                return;
            }
            const newName = getUniqueName(currentName, taken);
            const update: { name: string; filename?: string } = { name: newName };
            if (asset.get('file.filename')) {
                update.filename = newName;
            }
            editor.api.globals.rest.assets.assetUpdate(assetId, update)
            .on('error', (_status: number, errData: unknown) => {
                console.warn(`paste rename error: ${errData}`);
            });
        };

        if (editor.call('assets:get', assetId)) {
            apply();
        } else {
            editor.once(`assets:add[${assetId}]`, apply);
        }
    };

    editor.method('assets:paste', (parentFolder, keepFolderStructure, callback) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const clipboard = editor.call('clipboard');
        const value = clipboard.value;
        if (!value || value.type !== 'asset') {
            return;
        }

        const targetFolderObserver = parentFolder ?? null;
        const targetFolderId = targetFolderObserver ? targetFolderObserver.get('id') : null;
        const targetFolderApi = targetFolderObserver?.apiAsset ?? undefined;
        const sameProject = value.projectId === config.project.id &&
                            value.branchId === config.self.branch.id;

        // partition source asset IDs into client-side and server-side groups
        const clientIds: string[] = [];
        const serverIds: string[] = [];

        if (sameProject) {
            for (const id of value.assets) {
                const source = editor.call('assets:get', id);
                if (source && CLIENT_PASTE_TYPES.has(source.get('type'))) {
                    clientIds.push(id);
                } else {
                    serverIds.push(id);
                }
            }
        } else {
            serverIds.push(...value.assets);
        }

        const now = Date.now();
        editor.call('status:text', 'Pasting assets...');
        editor.call('status:job', `asset-paste:${now}`, 1);

        const finishJob = () => editor.call('status:job', `asset-paste:${now}`);

        const runClientSide = async () => {
            for (const id of clientIds) {
                const source = editor.call('assets:get', id);
                if (!source) {
                    continue;
                }
                // eslint-disable-next-line no-await-in-loop
                const created = await pasteOne(source, targetFolderApi, targetFolderId);
                if (created && source.get('type') === 'folder' && keepFolderStructure !== false) {
                    // eslint-disable-next-line no-await-in-loop
                    await pasteFolderChildren(source, created);
                }
            }
        };

        const runServerSide = () => new Promise<any>((resolve, reject) => {
            if (serverIds.length === 0) {
                resolve(null);
                return;
            }
            const data: any = {
                projectId: value.projectId,
                branchId: value.branchId,
                targetProjectId: config.project.id,
                targetBranchId: config.self.branch.id,
                keepFolderStructure: !!keepFolderStructure,
                assets: serverIds.slice()
            };
            if (parentFolder) {
                data.targetFolderId = parentFolder.get('id');
            }
            editor.api.globals.rest.assets.assetPaste(data)
            .on('load', (status: number, response: any) => {
                if (status === 201 && Array.isArray(response.result)) {
                    for (const item of response.result) {
                        const id = item?.id ?? item;
                        if (id !== undefined && id !== null) {
                            ensureUniqueOnPaste(String(id), targetFolderId);
                        }
                    }
                }
                resolve(response);
            })
            .on('error', (_status: number, err: unknown) => reject(err));
        });

        runClientSide()
        .then(() => runServerSide())
        .then((response) => {
            const total = clientIds.length + (response?.result?.length ?? 0);
            if (total > 0) {
                editor.call('status:text', `${total} asset${total > 1 ? 's' : ''} created`);
            } else {
                editor.call('status:clear');
            }
            finishJob();
            if (callback) {
                callback(null, response);
            }
        })
        .catch((err) => {
            editor.call('status:error', err ?? 'Error while pasting assets');
            finishJob();
            if (callback) {
                callback(err);
            }
        });
    });

});
