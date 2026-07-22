import { config } from '@/editor/config';

import { mcp } from '../connection';

import { api, log, rest, entitySummary, paginate } from './shared';

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

// assets
mcp.method('assets:create', async (assets) => {
    try {
        const assetCreationPromises = assets.map(async ({ type, options }: any) => {
            if (options?.folder) {
                options.folder = api.assets.get(options.folder);
            }

            let createPromise;

            switch (type) {
                case 'css':
                    createPromise = api.assets.createCss(options);
                    break;
                case 'folder':
                    createPromise = api.assets.createFolder(options);
                    break;
                case 'html':
                    createPromise = api.assets.createHtml(options);
                    break;
                case 'material':
                    if (options?.data?.name) {
                        options.name = options.data.name;
                    }
                    createPromise = api.assets.createMaterial(options);
                    break;
                case 'script':
                    createPromise = api.assets.createScript(options);
                    break;
                case 'shader':
                    createPromise = api.assets.createShader(options);
                    break;
                case 'template':
                    if (options?.entity) {
                        options.entity = api.entities.get(options.entity);
                    }
                    createPromise = api.assets.createTemplate(options);
                    break;
                case 'text':
                    createPromise = api.assets.createText(options);
                    break;
                default:
                    throw new Error(`Invalid asset type: ${type}`);
            }

            const asset = await createPromise;
            if (!asset) {
                throw new Error(`Failed to create asset of type ${type}`);
            }

            // return the asset summary inline
            log(`Created asset(${asset.get('id')}) - Type: ${type}`);
            return assetSummary(asset);
        });

        const createdAssetsData = await Promise.all(assetCreationPromises);
        return { data: createdAssetsData };
    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during asset creation.';
        log(`Error creating assets: ${errorMessage}`);
        return { error: errorMessage };
    }
});
mcp.method('assets:delete', (ids) => {
    const assets = ids.map((id: number) => api.assets.get(id)).filter(Boolean);
    if (!assets.length) {
        return { error: 'No valid assets to delete. Call list_assets to obtain valid asset ids.' };
    }
    api.assets.delete(assets);
    log(`Deleted assets: ${ids.join(', ')}`);
    return { data: { deleted: assets.length } };
});
mcp.method('assets:list', (options: any = {}) => {
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
mcp.method('assets:instantiate', async (ids) => {
    const assets = ids.map((id: number) => api.assets.get(id)).filter(Boolean);
    if (!assets.length) {
        return {
            error: 'No valid assets found. Call list_assets with type="template" to obtain valid template asset ids.'
        };
    }
    if (assets.some((asset: any) => asset.get('type') !== 'template')) {
        return {
            error: 'One or more ids are not template assets. Only template assets can be instantiated; call list_assets with type="template".'
        };
    }
    const entities = await api.assets.instantiateTemplates(assets, api.entities.root);
    log(`Instantiated assets: ${ids.join(', ')}`);
    return { data: entities.map(entitySummary) };
});
mcp.method('assets:property:set', (id, prop, value) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return { error: `Asset not found: ${id}. Call list_assets to obtain a valid asset id.` };
    }
    asset.set(`data.${prop}`, value);
    log(`Set asset(${id}) property(${prop}) to: ${JSON.stringify(value)}`);
    return { data: { id, [prop]: value } };
});
mcp.method('assets:data:set', (id, props) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return { error: `Asset not found: ${id}. Call list_assets to obtain a valid asset id.` };
    }
    const keys = Object.keys(props || {});
    if (!keys.length) {
        return { error: 'No properties provided to set.' };
    }
    keys.forEach((key) => {
        asset.set(`data.${key}`, props[key]);
    });
    log(`Set asset(${id}) properties(${keys.join(', ')})`);
    return { data: assetSummary(asset) };
});
mcp.method('assets:script:text:set', async (id, text) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return {
            error: `Asset not found: ${id}. Call list_assets with type="script" to obtain a valid script asset id.`
        };
    }

    const form = new FormData();
    form.append('filename', asset.get('file.filename'));
    form.append('file', new Blob([text], { type: 'text/plain' }), asset.get('file.filename'));
    form.append('branchId', config.self.branch.id);

    try {
        const data = await rest('PUT', `assets/${id}`, form, true);
        if (data.error) {
            return { error: data.error };
        }
        log(`Set asset(${id}) script text`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
mcp.method('assets:file:text:get', async (id) => {
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
mcp.method('assets:script:parse', async (id) => {
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
