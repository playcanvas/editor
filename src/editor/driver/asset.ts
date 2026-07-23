import { config } from '@/editor/config';

import { driver } from './driver';
import { api, log, rest, entitySummary, paginate, validatePath, writeError } from './shared';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_CHUNK_BYTES = 1024 * 1024;
const MAX_TRANSFER_BYTES = 512 * 1024 * 1024;
const MAX_TRANSFERS = 1;
const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_BYTES / 3) * 4;
const TRANSFER_TIMEOUT = 60_000;
const TEXT_TYPES = ['css', 'html', 'json', 'script', 'shader', 'text'];
const MIME_TYPES: Record<string, string> = {
    css: 'text/css',
    html: 'text/html',
    json: 'application/json',
    script: 'text/javascript',
    shader: 'text/x-glsl',
    text: 'text/plain'
};
const CREATE_METHODS: Record<string, string> = {
    animstategraph: 'createAnimStateGraph',
    bundle: 'createBundle',
    css: 'createCss',
    cubemap: 'createCubemap',
    folder: 'createFolder',
    html: 'createHtml',
    i18n: 'createI18n',
    json: 'createJson',
    material: 'createMaterial',
    script: 'createScript',
    shader: 'createShader',
    sprite: 'createSprite',
    template: 'createTemplate',
    text: 'createText'
};
const transfers = new Map<string, any>();
let pendingDownload = false;

/**
 * Compact summary for an asset.
 *
 * @param asset - The asset API instance.
 * @returns The asset summary.
 */
const assetSummary = (asset: any) => {
    const path = asset.get('path') || [];
    return {
        id: asset.get('id'),
        name: asset.get('name'),
        type: asset.get('type'),
        folder: path.length > 0 ? path[path.length - 1] : null,
        tags: asset.get('tags') || []
    };
};

const getAsset = (id: number) => {
    const asset = api.assets.get(id);
    if (!asset) {
        throw new Error(`Asset not found: ${id}. Call list_assets to obtain a valid asset id.`);
    }
    return asset;
};

const waitForAsset = (id: number) => {
    const asset = api.assets.get(id);
    if (asset) {
        return Promise.resolve(asset);
    }
    return new Promise<any>((resolve) => api.assets.once(`add[${id}]`, resolve));
};

const uploadAsset = (data: any, settings: any = {}) =>
    new Promise<any>((resolve, reject) => {
        editor.call(
            'assets:uploadFile',
            {
                ...data,
                asset: data.id === undefined ? undefined : getAsset(data.id).observer,
                parent: data.folder?.observer,
                settings
            },
            (error: unknown, result: { id: number }) => {
                if (error) {
                    reject(error);
                    return;
                }
                waitForAsset(result.id).then(resolve, reject);
            }
        );
    });

const uploadFile = (item: any, file: File) => {
    if (!file.size) {
        throw new Error(`Cannot upload empty file: ${item.filename}.`);
    }
    const folder = item.folder === undefined || item.folder === null ? undefined : getAsset(item.folder);
    if (folder && folder.get('type') !== 'folder') {
        throw new Error(`Asset ${item.folder} is not a folder.`);
    }
    const asset = item.id === undefined ? null : getAsset(item.id);
    if (asset && asset.get('type') !== item.type) {
        throw new Error(`Asset ${item.id} is type ${asset.get('type')}, not ${item.type}.`);
    }
    return uploadAsset(
        {
            id: item.id,
            name: item.name,
            type: item.type,
            folder,
            filename: item.filename,
            file: new File([file], item.filename, { type: item.mime || 'application/octet-stream' }),
            tags: item.tags,
            data: item.data,
            preload: item.preload
        },
        item.settings
    );
};

const base64ToBytes = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

const bytesToBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
};

const dropTransfer = async (id: string) => {
    const transfer = transfers.get(id);
    if (!transfer) {
        return false;
    }
    clearTimeout(transfer.timer);
    transfers.delete(id);
    await transfer.writer?.abort().catch(() => false);
    await transfer.reader?.cancel().catch(() => false);
    await transfer.root?.removeEntry(id).catch(() => false);
    return true;
};

const touchTransfer = (transfer: any) => {
    clearTimeout(transfer.timer);
    transfer.timer = setTimeout(() => void dropTransfer(transfer.id), TRANSFER_TIMEOUT);
};

const addTransfer = (transfer: any) => {
    if (
        !Number.isInteger(transfer.size) ||
        transfer.size < 0 ||
        (transfer.direction === 'upload' && transfer.size === 0) ||
        transfer.size > MAX_TRANSFER_BYTES ||
        transfers.size >= MAX_TRANSFERS
    ) {
        throw new Error('Transfer exceeds the configured size or concurrency limit.');
    }
    transfer.id = crypto.randomUUID();
    transfer.offset = 0;
    transfers.set(transfer.id, transfer);
    touchTransfer(transfer);
    return transfer;
};

const openDownload = async (id: number) => {
    const asset = getAsset(id);
    const type = asset.get('type');
    let filename = asset.get('file.filename') || asset.get('name');
    if (type === 'animstategraph') {
        filename = `${filename}.json`;
        const file = new Blob([JSON.stringify(asset.get('data'), null, 4)], { type: 'application/json' });
        if (file.size > MAX_TRANSFER_BYTES) {
            throw new Error(`Asset download exceeds the ${MAX_TRANSFER_BYTES / 1024 / 1024} MiB limit.`);
        }
        return { id, filename, mime: file.type, size: file.size, stream: file.stream() };
    }
    const res = await fetch(`/api/assets/${id}/download?branchId=${config.self.branch.id}`);
    if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`Failed to download asset: ${res.status} ${res.statusText}`);
    }
    const header = res.headers.get('content-length');
    const size = header === null ? Number(asset.get('file.size')) : Number(header);
    if (!Number.isInteger(size) || size < 0) {
        await res.body?.cancel();
        throw new Error('Asset download size is unavailable.');
    }
    if (size > MAX_TRANSFER_BYTES) {
        await res.body?.cancel();
        throw new Error(`Asset download exceeds the ${MAX_TRANSFER_BYTES / 1024 / 1024} MiB limit.`);
    }
    if (!res.body) {
        throw new Error('Asset download body is unavailable.');
    }
    return {
        id,
        filename,
        mime: res.headers.get('content-type') || 'application/octet-stream',
        size,
        stream: res.body
    };
};

const readDownload = async (transfer: any, length: number) => {
    const size = Math.min(length, transfer.size - transfer.offset);
    const bytes = new Uint8Array(size);
    let offset = 0;
    while (offset < size) {
        let chunk = transfer.pending;
        if (!chunk?.length) {
            const result = await transfer.reader.read();
            if (result.done) {
                break;
            }
            chunk = result.value;
        }
        const count = Math.min(chunk.length, size - offset);
        bytes.set(chunk.subarray(0, count), offset);
        offset += count;
        transfer.pending = count < chunk.length ? chunk.subarray(count) : null;
    }
    if (offset !== size) {
        throw new Error(`Asset download ended at ${transfer.offset + offset} of ${transfer.size} bytes.`);
    }
    return bytes;
};

const prepareCreate = ({ type, options = {} }: any) => {
    const method = CREATE_METHODS[type];
    if (!method) {
        throw new Error(`Invalid asset type: ${type}`);
    }

    options = { ...options };
    if (options.folder !== undefined && options.folder !== null) {
        const folder = getAsset(options.folder);
        if (folder.get('type') !== 'folder') {
            throw new Error(`Asset ${options.folder} is not a folder.`);
        }
        options.folder = folder;
    }
    if (type === 'bundle') {
        options.assets = (options.assets || []).map(getAsset);
    } else if (type === 'cubemap') {
        options.textures = (options.textures || []).map((id: number | null) => (id === null ? null : getAsset(id)));
    } else if (type === 'sprite' && options.textureAtlas !== undefined && options.textureAtlas !== null) {
        options.textureAtlas = getAsset(options.textureAtlas);
    } else if (type === 'template') {
        const id = options.entity;
        options.entity = api.entities.get(id);
        if (!options.entity) {
            throw new Error(`Entity not found: ${id}. Call list_entities to obtain a valid resource_id.`);
        }
    }
    if (type === 'material' && options.data?.name) {
        options.name = options.data.name;
    }
    return { method, options, type };
};

const modifyAssets = async (edits: any[]) => {
    const denied = writeError('modify assets');
    if (denied) {
        return denied;
    }
    const arrays = new Map<string, any[]>();
    const prepared = edits.map((edit) => {
        const asset = getAsset(edit.id);
        const root = edit.path?.split('.')[0];
        validatePath(edit.path);
        if (!['name', 'tags', 'preload', 'exclude', 'i18n', 'data', 'meta'].includes(root)) {
            throw new Error(
                `Invalid asset path: ${edit.path}. Use name, tags, preload, exclude, i18n.*, data.*, meta.compress.*, or meta.invert.`
            );
        }
        const resolved = root === 'data' ? api.schema.assets.resolvePath(asset.get('type'), edit.path.slice(5)) : null;
        if (root === 'data' && !resolved) {
            throw new Error(`Unknown ${asset.get('type')} asset path: ${edit.path}.`);
        }
        if (
            (root === 'i18n' && !edit.path.startsWith('i18n.')) ||
            (root === 'meta' && edit.path !== 'meta.invert' && !edit.path.startsWith('meta.compress.'))
        ) {
            throw new Error(`Invalid asset path: ${edit.path}.`);
        }
        const op = edit.op || 'set';
        if (!['set', 'unset', 'insert', 'remove', 'move'].includes(op)) {
            throw new Error(`Invalid asset operation: ${op}.`);
        }
        if (['insert', 'remove', 'move'].includes(op) && !edit.path.startsWith('data.')) {
            throw new Error(`Operation ${op} is only supported under data.*.`);
        }
        if (op === 'unset' && ['name', 'tags', 'preload', 'exclude'].includes(root)) {
            throw new Error(`Asset path ${edit.path} cannot be unset.`);
        }
        if (op === 'unset' && root === 'data' && !resolved.hasDefault && !resolved.open) {
            throw new Error(`Asset path ${edit.path} cannot be unset.`);
        }
        if (asset.get('type') === 'animstategraph' && edit.path.startsWith('data.')) {
            throw new Error(
                'Anim state graph data requires modify_anim_state_graph. Generic leaf writes can be ignored by the editor.'
            );
        }
        if (asset.get('type') === 'animation' && edit.path.startsWith('data.events')) {
            throw new Error(
                'Animation events require modify_animation_events. Generic leaf writes can be ignored by the editor.'
            );
        }
        if (op === 'set') {
            if (!Object.hasOwn(edit, 'value')) {
                throw new Error(`Missing value for asset ${edit.id} path ${edit.path}.`);
            }
            if (root === 'name' && typeof edit.value !== 'string') {
                throw new Error('Asset name must be a string.');
            }
            if (root === 'name') {
                const error = editor.call('assets:rename:validate', asset.observer, edit.value);
                if (error) {
                    throw new Error(error);
                }
            }
            if (root === 'tags' && !Array.isArray(edit.value)) {
                throw new Error('Asset tags must be an array.');
            }
            if (root === 'preload' && typeof edit.value !== 'boolean') {
                throw new Error('Asset preload must be a boolean.');
            }
        } else if (op !== 'unset') {
            const key = `${edit.id}:${edit.path}`;
            const value = arrays.get(key) || structuredClone(asset.get(edit.path));
            if (!Array.isArray(value)) {
                throw new Error(`Asset path ${edit.path} is not an array.`);
            }
            if (
                edit.index !== undefined &&
                (!Number.isInteger(edit.index) || edit.index < 0 || edit.index > value.length)
            ) {
                throw new Error(`Invalid index ${edit.index} for asset path ${edit.path}.`);
            }
            if (op !== 'insert' && edit.index >= value.length) {
                throw new Error(`Invalid index ${edit.index} for asset path ${edit.path}.`);
            }
            if (op === 'move' && (!Number.isInteger(edit.to) || edit.to < 0 || edit.to >= value.length)) {
                throw new Error(`Invalid destination index ${edit.to} for asset path ${edit.path}.`);
            }
            arrays.set(key, value);
            if (op === 'insert') {
                value.splice(edit.index ?? value.length, 0, structuredClone(edit.value));
            } else if (op === 'remove') {
                value.splice(edit.index, 1);
            } else {
                value.splice(edit.to, 0, value.splice(edit.index, 1)[0]);
            }
        }
        const nextOp = op === 'unset' && resolved?.hasDefault ? 'set' : op;
        const value = op === 'unset' && resolved?.hasDefault ? resolved.default : edit.value;
        if (nextOp === 'set' && Array.isArray(value)) {
            arrays.set(`${edit.id}:${edit.path}`, structuredClone(value));
        } else if (nextOp === 'unset') {
            arrays.delete(`${edit.id}:${edit.path}`);
        }
        return {
            asset,
            edit,
            op: nextOp,
            value
        };
    });

    const modified = new Map();
    const renamed = [];
    for (let i = 0; i < prepared.length; i++) {
        const { asset, edit, op } = prepared[i];
        if (op !== 'set' || edit.path !== 'name') {
            continue;
        }
        const error = await new Promise((resolve) => editor.call('assets:rename', asset.observer, edit.value, resolve));
        if (error) {
            return {
                error: String(error),
                meta: {
                    partial: renamed.length > 0,
                    succeeded: renamed,
                    failed: [{ id: edit.id, path: edit.path, message: String(error) }]
                }
            };
        }
        renamed.push({ id: edit.id, path: edit.path });
        modified.set(edit.id, asset);
    }
    for (let i = 0; i < prepared.length; i++) {
        const { asset, edit, op, value } = prepared[i];
        if (edit.path === 'name') {
            continue;
        }
        if (op === 'set') {
            asset.set(edit.path, value);
        } else if (op === 'unset') {
            asset.unset(edit.path);
        } else if (op === 'insert') {
            asset.insert(edit.path, edit.value, edit.index);
        } else if (op === 'remove') {
            asset.observer.remove(edit.path, edit.index);
        } else if (op === 'move') {
            asset.observer.move(edit.path, edit.index, edit.to);
        }
        modified.set(edit.id, asset);
    }
    return { data: Array.from(modified.values()).map(assetSummary) };
};

const setText = async (id: number, text: string) => {
    const denied = writeError('modify asset text');
    if (denied) {
        return denied;
    }
    const asset = getAsset(id);
    const type = asset.get('type');
    if (!TEXT_TYPES.includes(type)) {
        return { error: `Asset ${id} is type "${type}"; only ${TEXT_TYPES.join(', ')} assets can be written as text.` };
    }

    const filename = asset.get('file.filename');
    if (!filename) {
        return { error: `Asset ${id} has no source filename.` };
    }
    const form = new FormData();
    form.append('filename', filename);
    form.append('file', new Blob([text], { type: MIME_TYPES[type] }), filename);
    form.append('branchId', config.self.branch.id);
    const data = await rest('PUT', `assets/${id}`, form, true);
    if (data.error) {
        return { error: data.error };
    }
    log(`Set asset(${id}) text`);
    return { data };
};

const instantiateTemplates = async ({ assetIds, parentId, index, ignoreMissing }: any) => {
    const denied = writeError('instantiate templates');
    if (denied) {
        return denied;
    }
    const assets = ignoreMissing
        ? assetIds.map((id: number) => api.assets.get(id)).filter(Boolean)
        : assetIds.map(getAsset);
    if (!assets.length) {
        return {
            error: 'No valid assets found. Call list_assets with type="template" to obtain valid template asset ids.'
        };
    }
    if (assets.some((asset: any) => asset.get('type') !== 'template')) {
        return { error: 'One or more ids are not template assets.' };
    }
    const parent = parentId ? api.entities.get(parentId) : api.entities.root;
    if (!parent) {
        return { error: `Parent entity not found: ${parentId}.` };
    }
    const entities = await api.assets.instantiateTemplates(assets, parent, { index });
    log(`Instantiated assets: ${assetIds.join(', ')}`);
    return { data: entities.map(entitySummary) };
};

// assets
driver.method('assets:create', async (assets) => {
    const denied = writeError('create assets');
    if (denied) {
        return denied;
    }
    const prepared = assets.map(prepareCreate);
    const results = await Promise.all(
        prepared.map(({ method, options, type }, index) =>
            Promise.resolve()
                .then(async () => {
                    const asset = await api.assets[method](options);
                    if (!asset) {
                        throw new Error(`Failed to create asset of type ${type}`);
                    }
                    log(`Created asset(${asset.get('id')}) - Type: ${type}`);
                    return { index, type, asset: assetSummary(asset) };
                })
                .then(
                    (result) => ({ result }),
                    (error) => ({
                        error: { index, type, message: error instanceof Error ? error.message : String(error) }
                    })
                )
        )
    );
    const succeeded = results.flatMap((item) => ('result' in item ? [item.result] : []));
    const failed = results.flatMap((item) => ('error' in item ? [item.error] : []));
    return failed.length
        ? { error: failed[0].message, meta: { succeeded, failed, partial: true } }
        : { data: succeeded.map(({ asset }) => asset) };
});
driver.method('assets:upload', async (items) => {
    const denied = writeError('upload assets');
    if (denied) {
        return denied;
    }
    const prepared = items.map((item: any) => {
        if (typeof item.base64 !== 'string' || item.base64.length > MAX_BASE64_LENGTH) {
            throw new Error(`Asset upload exceeds the ${MAX_FILE_BYTES / 1024 / 1024} MiB limit.`);
        }
        const bytes = base64ToBytes(item.base64);
        if (bytes.length > MAX_FILE_BYTES) {
            throw new Error(`Asset upload exceeds the ${MAX_FILE_BYTES / 1024 / 1024} MiB limit.`);
        }
        return { item, bytes };
    });
    const results = await Promise.all(
        prepared.map(({ item, bytes }, index) =>
            Promise.resolve()
                .then(() =>
                    uploadFile(
                        item,
                        new File([bytes], item.filename, { type: item.mime || 'application/octet-stream' })
                    )
                )
                .then(
                    (asset) => ({ result: { index, asset: assetSummary(asset) } }),
                    (error) => ({
                        error: {
                            index,
                            filename: item.filename,
                            message: error instanceof Error ? error.message : String(error)
                        }
                    })
                )
        )
    );
    const succeeded = results.flatMap((item) => ('result' in item ? [item.result] : []));
    const failed = results.flatMap((item) => ('error' in item ? [item.error] : []));
    return { data: { succeeded, failed }, meta: { partial: failed.length > 0 } };
});
driver.method('assets:modify', modifyAssets);
driver.method('assets:move', async (ids, folderId) => {
    const denied = writeError('move assets');
    if (denied) {
        return denied;
    }
    const assets = ids.map(getAsset);
    const folder = folderId === undefined || folderId === null ? null : getAsset(folderId);
    if (folder && folder.get('type') !== 'folder') {
        return { error: `Asset ${folderId} is not a folder.` };
    }
    let finish: (error: string | null) => void;
    const events = assets.map((asset: any) => asset.on('path:set', check));
    const cleanup = () => {
        for (let i = 0; i < events.length; i++) {
            events[i].unbind();
        }
    };
    const complete = new Promise<string | null>((resolve) => {
        finish = (error) => {
            cleanup();
            resolve(error);
        };
    });
    function check() {
        if (assets.every((asset: any) => ((asset.get('path') || []).at(-1) ?? null) === (folderId ?? null))) {
            finish?.(null);
        }
    }
    const error = editor.call(
        'assets:fs:move',
        assets.map((asset: any) => asset.observer),
        folder?.observer || null
    );
    if (error) {
        cleanup();
        return { error };
    }
    check();
    const failure = await complete;
    return failure ? { error: failure } : { data: assets.map(assetSummary) };
});
driver.method('assets:duplicate', (ids) => {
    const denied = writeError('duplicate assets');
    if (denied) {
        return denied;
    }
    const assets = ids.map(getAsset);
    return Promise.all(
        assets.map((asset: any) =>
            new Promise<number>((resolve, reject) => {
                api.rest.assets
                    .assetDuplicate(String(asset.get('id')), {
                        type: asset.get('type'),
                        branchId: config.self.branch.id
                    })
                    .on('load', (_status: number, result: { id: number }) => resolve(result.id))
                    .on('error', (_status: number, error: unknown) => reject(error));
            }).then(waitForAsset)
        )
    ).then((created) => ({ data: created.map(assetSummary) }));
});
driver.method('assets:replace', (id, replacementId) => {
    const denied = writeError('replace asset references');
    if (denied) {
        return denied;
    }
    const asset = getAsset(id);
    const replacement = getAsset(replacementId);
    asset.replace(replacement);
    return { data: { id, replacementId } };
});
driver.method('assets:reimport', async (ids, settings = {}) => {
    const denied = writeError('reimport assets');
    if (denied) {
        return denied;
    }
    for (let i = 0; i < ids.length; i++) {
        getAsset(ids[i]);
    }
    const results = await Promise.all(
        ids.map((id: number) => {
            const asset = getAsset(id);
            return new Promise((resolve) => {
                editor.call('assets:reimport', id, asset.get('type'), settings, (error: unknown, result: unknown) =>
                    resolve(
                        error
                            ? { error: { id, message: error instanceof Error ? error.message : String(error) } }
                            : { result: { id, result } }
                    )
                );
            });
        })
    );
    const succeeded = results.flatMap((item: any) => (item.result ? [item.result] : []));
    const failed = results.flatMap((item: any) => (item.error ? [item.error] : []));
    return { data: { succeeded, failed }, meta: { partial: failed.length > 0 } };
});
driver.method('assets:delete', async (ids, options: any = {}) => {
    const denied = writeError('delete assets');
    if (denied) {
        return denied;
    }
    const assets = ids.map(getAsset);
    if (options.rejectReferenced) {
        const index = editor.call('assets:used:index') || {};
        const referenced = ids.filter((id: number) => index[id]?.count);
        if (referenced.length) {
            throw new Error(`Referenced assets cannot be deleted: ${referenced.join(', ')}.`);
        }
    }
    await api.assets.delete(assets);
    log(`Deleted assets: ${ids.join(', ')}`);
    return { data: { deleted: assets.length } };
});
driver.method('assets:list', (options: any = {}) => {
    let assets = api.assets.list();

    // apply filters
    if (options.type) {
        assets = assets.filter((asset) => asset.get('type') === options.type);
    }
    if (options.name) {
        const searchName = options.name.toLowerCase();
        assets = assets.filter((asset) => asset.get('name').toLowerCase().includes(searchName));
    }
    if (options.tag) {
        assets = assets.filter((asset) => (asset.get('tags') || []).includes(options.tag));
    }

    // an empty result is a valid success, not an error
    const { page, meta } = paginate(assets, options);

    log(`Listed assets (${meta.count}/${meta.total})`);

    // return full JSON or summary
    if (options.full) {
        return { data: page.map((asset) => asset.json()), meta };
    }

    // summary mode: return minimal data
    return { data: page.map(assetSummary), meta };
});
driver.method('assets:get', (id) => ({ data: getAsset(id).json() }));
driver.method('assets:references:get', (id) => {
    getAsset(id);
    const ref = editor.call('assets:used:index')?.[id]?.ref || {};
    return {
        data: {
            id,
            references: Object.entries(ref).map(([resourceId, value]: any) => ({
                type: value.type,
                id: resourceId
            }))
        }
    };
});
driver.method('templates:instantiate', instantiateTemplates);
driver.method('assets:instantiate', (ids) => instantiateTemplates({ assetIds: ids, ignoreMissing: true }));
driver.method('assets:property:set', async (id, prop, value) => {
    const result = await modifyAssets([{ id, path: `data.${prop}`, value }]);
    return 'error' in result ? result : { data: { id, [prop]: value } };
});
driver.method('assets:data:set', async (id, props) => {
    const keys = Object.keys(props || {});
    if (!keys.length) {
        return { error: 'No properties provided to set.' };
    }
    const result = await modifyAssets(keys.map((key) => ({ id, path: `data.${key}`, value: props[key] })));
    return 'error' in result ? result : { data: result.data[0] };
});
driver.method('assets:text:set', setText);
driver.method('assets:script:text:set', setText);
driver.method('assets:file:text:get', async (id) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return { error: `Asset not found: ${id}. Call list_assets to obtain a valid asset id.` };
    }

    const type = asset.get('type');
    if (!['css', 'html', 'json', 'script', 'shader', 'text'].includes(type)) {
        return {
            error: `Asset ${id} is type "${type}"; only text-based assets (css, html, json, script, shader, text) can be read as text.`
        };
    }

    const url = asset.get('file.url');
    if (!url) {
        return { error: `Asset ${id} has no source file.` };
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return { error: `Failed to fetch asset text: ${res.status} ${res.statusText}` };
        }
        const text = await res.text();
        log(`Got asset(${id}) text`);
        return { data: { id, type, filename: asset.get('file.filename'), text } };
    } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
});
driver.method('assets:file:get', async (id) => {
    const data = await openDownload(id);
    if (data.size > MAX_FILE_BYTES) {
        await data.stream.cancel();
        return { error: `Asset download exceeds the ${MAX_FILE_BYTES / 1024 / 1024} MiB limit.` };
    }
    const bytes = new Uint8Array(await new Response(data.stream).arrayBuffer());
    if (bytes.length !== data.size) {
        throw new Error(`Asset download ended at ${bytes.length} of ${data.size} bytes.`);
    }
    return { data: { id, filename: data.filename, mime: data.mime, base64: bytesToBase64(bytes) } };
});

driver.method('files:upload:start', async (item, size) => {
    const denied = writeError('upload assets');
    if (denied) {
        return denied;
    }
    if (transfers.size || pendingDownload) {
        throw new Error('Finish or cancel the active file transfer before starting another.');
    }
    if (!item?.filename || !item?.type) {
        throw new Error('Upload transfer requires filename and type.');
    }
    if (item.folder !== undefined && item.folder !== null && getAsset(item.folder).get('type') !== 'folder') {
        throw new Error(`Asset ${item.folder} is not a folder.`);
    }
    if (item.id !== undefined && getAsset(item.id).get('type') !== item.type) {
        throw new Error(`Asset ${item.id} does not match upload type ${item.type}.`);
    }
    const transfer = addTransfer({ direction: 'upload', size, item });
    const [error, data] = await navigator.storage
        .getDirectory()
        .then(async (root) => {
            const file = await root.getFileHandle(transfer.id, { create: true });
            return { root, file, writer: await file.createWritable() };
        })
        .then(
            (value) => [null, value],
            (value) => [value, null]
        );
    if (error) {
        await dropTransfer(transfer.id);
        throw error;
    }
    Object.assign(transfer, data);
    return { data: { transferId: transfer.id, size, chunkSize: MAX_CHUNK_BYTES } };
});

driver.method('files:upload:append', async (id, offset, base64) => {
    const transfer = transfers.get(id);
    if (!transfer || transfer.direction !== 'upload') {
        throw new Error(`Upload transfer not found: ${id}.`);
    }
    if (
        offset !== transfer.offset ||
        typeof base64 !== 'string' ||
        base64.length > Math.ceil(MAX_CHUNK_BYTES / 3) * 4
    ) {
        throw new Error(`Invalid upload offset or chunk for transfer ${id}.`);
    }
    const bytes = base64ToBytes(base64);
    if (!bytes.length || bytes.length > MAX_CHUNK_BYTES || transfer.offset + bytes.length > transfer.size) {
        throw new Error(`Invalid upload chunk length for transfer ${id}.`);
    }
    await transfer.writer.write(bytes);
    transfer.offset += bytes.length;
    touchTransfer(transfer);
    return { data: { transferId: id, offset: transfer.offset } };
});

driver.method('files:upload:finish', async (id) => {
    const transfer = transfers.get(id);
    if (!transfer || transfer.direction !== 'upload' || transfer.offset !== transfer.size) {
        throw new Error(`Incomplete upload transfer: ${id}.`);
    }
    clearTimeout(transfer.timer);
    transfer.direction = 'finishing';
    const [error, asset] = await Promise.resolve()
        .then(async () => {
            await transfer.writer.close();
            transfer.writer = null;
            return uploadFile(transfer.item, await transfer.file.getFile());
        })
        .then(
            (value) => [null, value],
            (value) => [value, null]
        );
    await dropTransfer(id);
    if (error) {
        throw error;
    }
    return { data: assetSummary(asset) };
});

driver.method('files:download:start', async (id, inlineLimit = 0) => {
    if (transfers.size || pendingDownload) {
        throw new Error('Finish or cancel the active file transfer before starting another.');
    }
    pendingDownload = true;
    const [error, result] = await Promise.resolve()
        .then(async () => {
            const data = await openDownload(id);
            if (data.size <= Math.min(inlineLimit, MAX_FILE_BYTES)) {
                const bytes = new Uint8Array(await new Response(data.stream).arrayBuffer());
                if (bytes.length !== data.size) {
                    throw new Error(`Asset download ended at ${bytes.length} of ${data.size} bytes.`);
                }
                return {
                    data: {
                        size: data.size,
                        filename: data.filename,
                        mime: data.mime,
                        base64: bytesToBase64(bytes)
                    }
                };
            }
            const transfer = addTransfer({
                direction: 'download',
                size: data.size,
                reader: data.stream.getReader(),
                pending: null
            });
            return {
                data: {
                    transferId: transfer.id,
                    size: transfer.size,
                    chunkSize: MAX_CHUNK_BYTES,
                    filename: data.filename,
                    mime: data.mime
                }
            };
        })
        .then(
            (value) => {
                pendingDownload = false;
                return [null, value];
            },
            (value) => {
                pendingDownload = false;
                return [value, null];
            }
        );
    if (error) {
        throw error;
    }
    return result;
});

driver.method('files:download:read', async (id, offset, length = MAX_CHUNK_BYTES) => {
    const transfer = transfers.get(id);
    if (!transfer || transfer.direction !== 'download') {
        throw new Error(`Download transfer not found: ${id}.`);
    }
    if (offset !== transfer.offset || !Number.isInteger(length) || length <= 0 || length > MAX_CHUNK_BYTES) {
        throw new Error(`Invalid download offset or chunk length for transfer ${id}.`);
    }
    const bytes = await readDownload(transfer, length);
    transfer.offset += bytes.length;
    touchTransfer(transfer);
    return {
        data: {
            transferId: id,
            offset: transfer.offset,
            base64: bytesToBase64(bytes),
            done: transfer.offset === transfer.size
        }
    };
});

driver.method('files:transfer:finish', async (id) => {
    const transfer = transfers.get(id);
    if (!transfer || transfer.offset !== transfer.size) {
        throw new Error(`Incomplete transfer: ${id}.`);
    }
    await dropTransfer(id);
    return { data: { transferId: id, size: transfer.size } };
});

driver.method('files:transfer:cancel', async (id) => {
    const cancelled = transfers.get(id)?.direction === 'finishing' ? false : await dropTransfer(id);
    return { data: { transferId: id, cancelled } };
});
driver.method('files:transfer:clear', async () => {
    const ids = [...transfers.keys()];
    for (let i = 0; i < ids.length; i++) {
        await dropTransfer(ids[i]);
    }
    return { data: { cleared: true } };
});
driver.method('templates:apply', async ({ entityId, overrides }: any) => {
    const denied = writeError('apply template overrides');
    if (denied) {
        return denied;
    }
    const entity = api.entities.get(entityId);
    if (!entity) {
        return { error: `Entity not found: ${entityId}.` };
    }
    const apply = (name: string, ...args: any[]) =>
        new Promise((resolve) => {
            const accepted = editor.call(name, ...args, resolve);
            if (!accepted) {
                resolve(false);
            }
        });
    const results = [];
    if (overrides?.length) {
        for (const override of overrides) {
            results.push(await apply('templates:applyOverride', entity.observer, override));
        }
    } else {
        results.push(await apply('templates:apply', entity.observer));
    }
    if (results.some((result) => result === false)) {
        return { error: `Template overrides could not be applied for entity ${entityId}.` };
    }
    return { data: entitySummary(entity) };
});
driver.method('templates:overrides:get', ({ entityId }: any) => {
    const entity = api.entities.get(entityId);
    if (!entity) {
        return { error: `Entity not found: ${entityId}.` };
    }
    return { data: editor.call('templates:computeFilteredOverrides', entity.observer) };
});
driver.method('templates:revert', async ({ entityId, overrides }: any) => {
    const denied = writeError('revert template overrides');
    if (denied) {
        return denied;
    }
    const entity = api.entities.get(entityId);
    if (!entity) {
        return { error: `Entity not found: ${entityId}.` };
    }
    if (overrides?.length) {
        const entities = editor.call('entities:raw');
        overrides.forEach((override: any) => editor.call('templates:revertOverride', override, entities));
    } else {
        const reverted = await new Promise((resolve) => {
            const accepted = editor.call('templates:revertAll', entity.observer, resolve);
            if (!accepted) {
                resolve(false);
            }
        });
        if (!reverted) {
            return { error: `Entity ${entityId} is not a valid template instance.` };
        }
    }
    return { data: entitySummary(entity) };
});
driver.method('templates:unlink', ({ entityIds }: any) => {
    const denied = writeError('unlink template instances');
    if (denied) {
        return denied;
    }
    const entities = entityIds.map((id: string) => {
        const entity = api.entities.get(id);
        if (!entity) {
            throw new Error(`Entity not found: ${id}.`);
        }
        return entity;
    });
    editor.call(
        'templates:unlink',
        entities.map((entity: any) => entity.observer)
    );
    return { data: entities.map(entitySummary) };
});
driver.method('assets:script:parse', async (id) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return {
            error: `Asset not found: ${id}. Call list_assets with type="script" to obtain a valid script asset id.`
        };
    }

    // FIXME: hacky way to get the parsed script data. Expose a proper API for this.
    const [err, data] = await new Promise<any[]>((resolve) => {
        editor.call('scripts:parse', (asset as any).observer, (...d: any[]) => resolve(d));
    });
    if (err) {
        return { error: err?.message || err?.error || String(err) };
    }
    if (!data?.scripts || Object.keys(data.scripts).length === 0) {
        return { error: `Script parser returned no declarations for asset ${id}.` };
    }
    log(`Parsed asset(${id}) script`);
    return { data };
});
