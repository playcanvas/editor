import { config } from '@/editor/config';

import { driver } from './driver';
import { api, log, rest, entitySummary, paginate, writeError } from './shared';

// ponytail: base64 keeps one transport; add streaming if 20 mib imports are common
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_BYTES / 3) * 4;
const OPERATION_TIMEOUT = 30_000;
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
    const prepared = edits.map((edit) => {
        const asset = getAsset(edit.id);
        const root = edit.path?.split('.')[0];
        if (!['name', 'tags', 'preload', 'data'].includes(root)) {
            throw new Error(`Invalid asset path: ${edit.path}. Use name, tags, preload, or data.*.`);
        }
        const op = edit.op || 'set';
        if (op !== 'set' && !edit.path.startsWith('data.')) {
            throw new Error(`Operation ${op} is only supported under data.*.`);
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
            const value = asset.get(edit.path);
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
        }
        return { asset, edit, op };
    });

    const modified = new Map();
    for (const { asset, edit, op } of prepared) {
        if (op === 'set') {
            if (edit.path === 'name') {
                const error = await new Promise((resolve) =>
                    editor.call('assets:rename', asset.observer, edit.value, resolve)
                );
                if (error) {
                    return { error: String(error) };
                }
            } else {
                asset.set(edit.path, edit.value);
            }
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
        const binary = atob(item.base64);
        if (!binary.length) {
            throw new Error(`Cannot upload empty file: ${item.filename}.`);
        }
        if (binary.length > MAX_FILE_BYTES) {
            throw new Error(`Asset upload exceeds the ${MAX_FILE_BYTES / 1024 / 1024} MiB limit.`);
        }
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const folder = item.folder === undefined || item.folder === null ? undefined : getAsset(item.folder);
        if (folder && folder.get('type') !== 'folder') {
            throw new Error(`Asset ${item.folder} is not a folder.`);
        }
        return {
            data: {
                name: item.name,
                type: item.type,
                folder,
                filename: item.filename,
                file: new Blob([bytes], { type: item.mime || 'application/octet-stream' }),
                tags: item.tags,
                data: item.data,
                preload: item.preload
            },
            settings: item.settings
        };
    });
    const results = await Promise.all(
        prepared.map(({ data, settings }, index) =>
            Promise.resolve()
                .then(() => api.assets.upload(data, settings))
                .then(
                    (asset) => ({ result: { index, asset: assetSummary(asset) } }),
                    (error) => ({
                        error: {
                            index,
                            filename: data.filename,
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
        clearTimeout(timer);
        events.forEach((event: any) => event.unbind());
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
    const timer = setTimeout(() => finish('Timed out waiting for moved assets to update.'), OPERATION_TIMEOUT);
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
    editor.call(
        'assets:fs:duplicate',
        assets.map((asset: any) => asset.observer)
    );
    return { data: { accepted: ids } };
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
    ids.forEach(getAsset);
    const results = await Promise.all(
        ids.map(
            (id: number) =>
                new Promise((resolve) => {
                    api.rest.assets
                        .assetReimport(String(id), settings)
                        .on('load', (_status: number, result: unknown) => resolve({ result: { id, result } }))
                        .on('error', (_status: number, error: unknown) =>
                            resolve({
                                error: { id, message: error instanceof Error ? error.message : String(error) }
                            })
                        );
                })
        )
    );
    const succeeded = results.flatMap((item: any) => (item.result ? [item.result] : []));
    const failed = results.flatMap((item: any) => (item.error ? [item.error] : []));
    return { data: { succeeded, failed }, meta: { partial: failed.length > 0 } };
});
driver.method('assets:delete', async (ids) => {
    const denied = writeError('delete assets');
    if (denied) {
        return denied;
    }
    const assets = ids.map((id: number) => api.assets.get(id)).filter(Boolean);
    if (!assets.length) {
        return { error: 'No valid assets to delete. Call list_assets to obtain valid asset ids.' };
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
    const asset = getAsset(id);
    const type = asset.get('type');
    let blob;
    let filename = asset.get('file.filename') || asset.get('name');
    if (type === 'animstategraph') {
        filename = `${filename}.json`;
        blob = new Blob([JSON.stringify(asset.get('data'), null, 4)], { type: 'application/json' });
    } else {
        const res = await fetch(`/api/assets/${id}/download?branchId=${config.self.branch.id}`);
        if (!res.ok) {
            return { error: `Failed to download asset: ${res.status} ${res.statusText}` };
        }
        const length = Number(res.headers.get('content-length'));
        if (length > MAX_FILE_BYTES) {
            return { error: `Asset download exceeds the ${MAX_FILE_BYTES / 1024 / 1024} MiB limit.` };
        }
        blob = await res.blob();
    }
    if (blob.size > MAX_FILE_BYTES) {
        return { error: `Asset download exceeds the ${MAX_FILE_BYTES / 1024 / 1024} MiB limit.` };
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return { data: { id, filename, mime: blob.type || 'application/octet-stream', base64: btoa(binary) } };
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
        return { error: err };
    }
    if (Object.keys(data.scripts).length === 0) {
        return { error: 'Failed to parse script' };
    }
    log(`Parsed asset(${id}) script`);
    return { data };
});
