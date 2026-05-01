import { getUniqueName } from '@/editor-api/assets/unique-name';

const TEXT_CREATE_METHOD: Record<string, 'createCss' | 'createHtml' | 'createJson' | 'createText' | 'createShader'> = {
    css: 'createCss',
    html: 'createHtml',
    json: 'createJson',
    text: 'createText',
    shader: 'createShader'
};

editor.once('load', () => {
    editor.method('assets:duplicate', (asset: any) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const type = asset.get('type');
        const path = asset.get('path');
        const parentId = path && path.length ? path[path.length - 1] : null;
        const parentObserver = parentId ? editor.call('assets:get', parentId) : null;
        const parentApi = parentObserver?.apiAsset ?? undefined;

        // collect sibling names for unique-name lookup
        const siblings = new Set<string>();
        editor.call('assets:list').forEach((a: any) => {
            const p = a.get('path');
            const par = p && p.length ? p[p.length - 1] : null;
            if ((par ?? null) === (parentId ?? null)) {
                siblings.add(a.get('name'));
            }
        });

        // material / sprite — duplicate via assets:create with cloned data
        if (type === 'material' || type === 'sprite') {
            const newName = getUniqueName(asset.get('name'), siblings);
            const raw = {
                type,
                name: newName,
                tags: asset.get('tags'),
                source: false,
                data: asset.get('data'),
                preload: asset.get('preload'),
                parent: parentObserver,
                scope: {
                    type: 'project',
                    id: config.project.id
                }
            };
            editor.call('assets:create', raw);
            return;
        }

        // text-based file types — fetch source content, then call createX
        if (TEXT_CREATE_METHOD[type]) {
            const filename = asset.get('file.filename');
            if (!filename) {
                return;
            }
            editor.api.globals.rest.assets.assetGetFile(
                asset.get('id'),
                filename,
                { branchId: config.self.branch.id }
            )
            .on('load', (_status: number, data: unknown) => {
                const text = typeof data === 'string' ? data.replace(/\r\n?/g, '\n') : '';
                const sourceName = asset.get('name');
                if (type === 'json') {
                    let parsed: object;
                    try {
                        parsed = text ? JSON.parse(text) : {};
                    } catch (e) {
                        parsed = {};
                    }
                    editor.api.globals.assets.createJson({
                        name: sourceName,
                        json: parsed,
                        folder: parentApi
                    }).catch((err: unknown) => editor.call('status:error', err));
                    return;
                }
                editor.api.globals.assets[TEXT_CREATE_METHOD[type]]({
                    name: sourceName,
                    text,
                    folder: parentApi
                }).catch((err: unknown) => editor.call('status:error', err));
            })
            .on('error', (_status: number, errData: unknown) => {
                editor.call('status:error', errData ?? `Could not duplicate ${type} asset`);
            });
            return;
        }

        // script — open the picker so user types a unique filename, then create
        if (type === 'script') {
            const sourceFilename = asset.get('file.filename');
            if (!sourceFilename) {
                return;
            }
            editor.api.globals.rest.assets.assetGetFile(
                asset.get('id'),
                sourceFilename,
                { branchId: config.self.branch.id }
            )
            .on('load', (_status: number, data: unknown) => {
                const text = typeof data === 'string' ? data.replace(/\r\n?/g, '\n') : '';
                const validate = (name: string) => editor.call('assets:script:checkCollision', name, parentObserver);
                editor.call('picker:script-create', (newFilename: string) => {
                    editor.call('assets:create:script', {
                        filename: newFilename,
                        parent: parentObserver,
                        text
                    });
                }, sourceFilename, validate);
            })
            .on('error', (_status: number, errData: unknown) => {
                editor.call('status:error', errData ?? 'Could not duplicate script asset');
            });
        }
    });
});
