import { Vec3 } from 'playcanvas';

import { config } from '@/editor/config';

import { mcp } from './connection';

const api = editor.api.globals;

// reused scratch vector — camera:focus copies it synchronously, no listener retains it
const tmpVec3 = new Vec3();

const log = (msg: string) => console.log(`[MCP] ${msg}`);

/**
 * PlayCanvas REST API wrapper.
 *
 * @param method - The HTTP method to use.
 * @param path - The path to the API endpoint.
 * @param data - The data to send.
 * @param auth - Whether to send the access token.
 * @returns The parsed JSON response.
 */
const rest = (method: string, path: string, data?: FormData | object, auth = false) => {
    const headers: Record<string, string> = {};
    if (auth) {
        headers.Authorization = `Bearer ${api.accessToken}`;
    }
    const init: RequestInit = { method, headers };
    if (data instanceof FormData) {
        init.body = data;
    } else if (data) {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(data);
    }
    return fetch(`/api/${path}`, init).then((res) => res.json());
};

/**
 * @param obj - The object to iterate.
 * @param callback - Called with the dot path and value of each leaf.
 * @param currentPath - The current path prefix.
 */
const iterateObject = (obj: Record<string, any>, callback: (path: string, value: any) => void, currentPath = '') => {
    Object.entries(obj).forEach(([key, value]) => {
        const path = currentPath ? `${currentPath}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            iterateObject(value, callback, path);
        } else {
            callback(path, value);
        }
    });
};

/**
 * Build a human-readable hierarchy path for an entity (e.g. `Root/Player/Camera`).
 * This resolves the otherwise opaque UUID chain into semantic context.
 *
 * @param entity - The entity API instance.
 * @returns The slash-separated path from the root to the entity.
 */
const entityPath = (entity: any) => {
    const names = [];
    let current = entity;
    const seen = new Set();
    while (current && !seen.has(current.get('resource_id'))) {
        seen.add(current.get('resource_id'));
        names.unshift(current.get('name'));
        const parentId = current.get('parent');
        current = parentId ? api.entities.get(parentId) : null;
    }
    return names.join('/');
};

/**
 * Produce the compact, semantic summary returned by list/create/modify tools.
 * Returning this inline after mutations lets agents skip a follow-up
 * `list_entities` round-trip.
 *
 * @param entity - The entity API instance.
 * @returns The entity summary.
 */
const entitySummary = (entity: any) => {
    const components = entity.get('components') || {};
    return {
        resource_id: entity.get('resource_id'),
        name: entity.get('name'),
        path: entityPath(entity),
        parent: entity.get('parent'),
        enabled: entity.get('enabled'),
        tags: entity.get('tags') || [],
        components: Object.keys(components)
    };
};

// top-level entity properties that entities:modify may set directly. Anything
// else must be addressed under `components.<type>.…` (or is not settable).
const ENTITY_TOP_LEVEL_PATHS = ['name', 'enabled', 'position', 'rotation', 'scale', 'tags'];

/**
 * Validate an entities:modify path against an entity BEFORE writing, so an invalid path
 * fails fast with an actionable message instead of silently "succeeding". Only rejects
 * paths that are provably wrong (unknown top-level key, or a component path for a
 * component the entity does not have) — valid edits are never blocked.
 *
 * @param entity - The entity API instance.
 * @param path - The dot-notation path the caller wants to set.
 * @returns An actionable error string if the path is invalid, otherwise null.
 */
const validateEntityPath = (entity: any, path: string) => {
    const components = Object.keys(entity.get('components') || {});
    const componentList = components.length ? components.join(', ') : 'none';
    if (typeof path !== 'string' || !path.length) {
        return `Missing path. Valid top-level paths: ${ENTITY_TOP_LEVEL_PATHS.join(', ')}; or component paths like components.<type>.<prop>. This entity has components: [${componentList}].`;
    }
    if (path.startsWith('components.')) {
        const component = path.split('.')[1];
        if (!component) {
            return `Incomplete path '${path}'. Component paths look like components.<type>.<prop>, e.g. components.light.intensity. This entity has components: [${componentList}].`;
        }
        if (!entity.get(`components.${component}`)) {
            return `Entity ${entity.get('resource_id')} (${entity.get('name')}) has no '${component}' component, so '${path}' cannot be set. This entity has components: [${componentList}]. Add it first with add_components, or target an existing component.`;
        }
        return null;
    }
    const top = path.split('.')[0];
    if (!ENTITY_TOP_LEVEL_PATHS.includes(top)) {
        return `Unknown path '${path}'. Valid top-level paths: ${ENTITY_TOP_LEVEL_PATHS.join(', ')} (vectors are arrays e.g. position [0,1,0], euler rotation in degrees). For component properties use components.<type>.<prop>; this entity has components: [${componentList}].`;
    }
    return null;
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

/**
 * Apply limit/offset pagination to a list and return the page plus the pagination
 * metadata that belongs in the response envelope.
 *
 * @param items - The full result set.
 * @param options - Pagination options (`limit` default 50, `offset` default 0).
 * @returns The page and pagination meta.
 */
const paginate = <T>(items: T[], options: { limit?: number; offset?: number } = {}) => {
    const total = items.length;
    const limit = Number.isFinite(options.limit) ? Math.max(0, options.limit!) : 50;
    const offset = Number.isFinite(options.offset) ? Math.max(0, options.offset!) : 0;
    const page = limit > 0 ? items.slice(offset, offset + limit) : items.slice(offset);
    const end = offset + page.length;
    const hasMore = end < total;
    return {
        page,
        meta: {
            total,
            count: page.length,
            hasMore,
            nextCursor: hasMore ? String(end) : null
        }
    };
};

// remember a handle to the launched runtime window so we can stop it later
let runtimeWindow: Window | null = null;

// general
mcp.method('ping', () => ({ data: 'pong' }));

// viewport
mcp.method('viewport:capture', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return { error: 'Viewport app not found' };
    }

    const device = app.graphicsDevice;
    const gl = device.gl;
    if (!gl) {
        return { error: 'WebGL context not found' };
    }

    try {
        // force a render to ensure we have the latest frame
        editor.call('viewport:render');
        app.tick();

        const width = device.width;
        const height = device.height;

        // read pixels from the backbuffer
        const pixels = new Uint8Array(width * height * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // flip the image vertically (WebGL reads bottom-to-top)
        const flipped = new Uint8Array(width * height * 4);
        const rowSize = width * 4;
        for (let y = 0; y < height; y++) {
            flipped.set(pixels.subarray((height - 1 - y) * rowSize, (height - y) * rowSize), y * rowSize);
        }

        // create source canvas with full resolution
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = width;
        srcCanvas.height = height;
        const srcCtx = srcCanvas.getContext('2d')!;
        const imageData = new ImageData(new Uint8ClampedArray(flipped.buffer), width, height);
        srcCtx.putImageData(imageData, 0, 0);

        // scale down to max 800px width while maintaining aspect ratio
        const maxWidth = 800;
        let dstWidth = width;
        let dstHeight = height;
        if (width > maxWidth) {
            dstWidth = maxWidth;
            dstHeight = Math.round(height * (maxWidth / width));
        }

        // create destination canvas and draw scaled image
        const dstCanvas = document.createElement('canvas');
        dstCanvas.width = dstWidth;
        dstCanvas.height = dstHeight;
        const dstCtx = dstCanvas.getContext('2d')!;
        dstCtx.drawImage(srcCanvas, 0, 0, dstWidth, dstHeight);

        // convert to base64 WebP for smaller file size (falls back to PNG if unsupported)
        const dataUrl = dstCanvas.toDataURL('image/webp', 0.8);
        const base64 = dataUrl.split(',')[1];

        log(`Captured viewport screenshot (${dstWidth}x${dstHeight})`);
        return { data: base64, meta: { mimeType: 'image/webp', width: dstWidth, height: dstHeight } };
    } catch (e: any) {
        return {
            error: `Failed to capture viewport: ${e.message}. Ensure a scene is loaded and the viewport is visible, then retry.`
        };
    }
});
mcp.method('viewport:focus', (ids, options: any = {}) => {
    const entities = ids.map((id: string) => api.entities.get(id)).filter(Boolean);
    if (!entities.length) {
        return {
            error: 'No valid entities found. Call list_entities (or resolve_entities) to obtain valid resource_ids.'
        };
    }
    api.selection.set(entities, { history: true });

    // get camera and calculate target
    const camera = editor.call('camera:current');
    if (!camera) {
        return { error: 'Could not retrieve current camera. Ensure a scene is loaded in the editor and retry.' };
    }
    const aabb = editor.call('selection:aabb');
    if (!aabb) {
        return { error: 'Could not calculate selection bounds. The selected entities may have no renderable bounds.' };
    }

    // calculate distance based on bounding box and FOV
    let distance = Math.max(aabb.halfExtents.x, aabb.halfExtents.y, aabb.halfExtents.z);
    distance /= Math.tan((0.5 * camera.camera.fov * Math.PI) / 180.0);
    distance = distance * 1.1 + 1;

    // apply orientation if specified
    if (options.view) {
        const views: Record<string, [number, number]> = {
            top: [-90, 0],
            bottom: [90, 0],
            front: [0, 0],
            back: [0, 180],
            left: [0, -90],
            right: [0, 90],
            perspective: [-25, 45]
        };
        const angles = views[options.view];
        if (angles) {
            camera.setEulerAngles(angles[0], angles[1], 0);
        }
    } else if (options.yaw !== undefined || options.pitch !== undefined) {
        const yaw = options.yaw ?? 45;
        const pitch = options.pitch ?? -25;
        camera.setEulerAngles(pitch, yaw, 0);
    }

    // focus camera on target
    editor.call('camera:focus', aabb.center, distance);
    log(`Focused viewport on entities: ${ids.join(', ')}`);
    return { data: { focused: entities.length } };
});

// launch (runtime control)
mcp.method('launch:start', (options: any = {}) => {
    const sceneId = config.scene?.id;
    const base = config.url?.launch;
    if (!sceneId || !base) {
        return { error: 'No scene loaded, or launch URL unavailable. Load a scene in the editor and retry.' };
    }
    const params = new URLSearchParams();

    // debug=true makes the engine log warnings/errors to the console, which
    // read_runtime_logs relies on
    params.set('debug', 'true');
    if (options.device) {
        params.set('device', options.device);
    }

    // pass the MCP port so the launch page can connect back as the runtime peer
    // without any popup UI
    params.set('mcp_port', String(mcp.port));
    const url = `${base}${sceneId}?${params.toString()}`;

    if (runtimeWindow && !runtimeWindow.closed) {
        runtimeWindow.close();
    }
    runtimeWindow = window.open(url, '_blank');
    if (!runtimeWindow) {
        return {
            error: 'Could not open the launch window (popup blocked). Allow popups for the editor origin and retry.'
        };
    }
    log(`Launched runtime for scene(${sceneId})`);
    return { data: { url, sceneId } };
});
mcp.method('launch:stop', () => {
    const wasOpen = !!(runtimeWindow && !runtimeWindow.closed);
    if (runtimeWindow && !runtimeWindow.closed) {
        runtimeWindow.close();
    }
    runtimeWindow = null;
    log('Stopped runtime');
    return { data: { stopped: wasOpen } };
});

// entities
mcp.method('entities:create', (entityDataArray) => {
    const entities = [];
    for (const entityData of entityDataArray) {
        if (Object.hasOwn(entityData, 'parent')) {
            const parent = api.entities.get(entityData.parent);
            if (!parent) {
                return {
                    error: `Parent entity not found: ${entityData.parent}. Call list_entities (or resolve_entities) to obtain a valid parent resource_id, or omit 'parent' to create under the root.`
                };
            }
            entityData.entity.parent = parent;
        }

        const entity = api.entities.create(entityData.entity);
        if (!entity) {
            return {
                error: 'Failed to create entity. Verify the entity definition is valid (e.g. component data types) and retry.'
            };
        }
        entities.push(entity);

        log(`Created entity(${entity.get('resource_id')})`);
    }

    // return the resulting entity summaries inline so the agent gets the new
    // ids + hierarchy paths without a follow-up list_entities call
    return { data: entities.map(entitySummary) };
});
mcp.method('entities:modify', (edits) => {
    const modified = new Map();
    for (const { id, path, value } of edits) {
        const entity = api.entities.get(id);
        if (!entity) {
            return {
                error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
            };
        }

        // validate-on-write: reject a provably-invalid path up front so the agent gets
        // an actionable message and never mistakes a no-op for a successful edit
        const pathError = validateEntityPath(entity, path);
        if (pathError) {
            return { error: pathError };
        }
        entity.set(path, value);
        modified.set(id, entity);
        log(`Set property(${path}) of entity(${id}) to: ${JSON.stringify(value)}`);
    }

    // return the post-edit summaries of every touched entity
    return { data: Array.from(modified.values()).map(entitySummary) };
});
mcp.method('entities:duplicate', async (ids, options: any = {}) => {
    const entities = ids.map((id: string) => api.entities.get(id)).filter(Boolean);
    if (!entities.length) {
        return {
            error: 'No valid entities to duplicate. Call list_entities (or resolve_entities) to obtain valid resource_ids.'
        };
    }
    const res = await api.entities.duplicate(entities, options);
    log(`Duplicated entities: ${res.map((entity: any) => entity.get('resource_id')).join(', ')}`);
    return { data: res.map(entitySummary) };
});
mcp.method('entities:reparent', (options) => {
    const entity = api.entities.get(options.id);
    if (!entity) {
        return {
            error: `Entity not found: ${options.id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    const parent = api.entities.get(options.parent);
    if (!parent) {
        return {
            error: `Parent entity not found: ${options.parent}. Call list_entities (or resolve_entities) to obtain a valid parent resource_id.`
        };
    }
    entity.reparent(parent, options.index, {
        preserveTransform: options.preserveTransform
    });
    log(`Reparented entity(${options.id}) to entity(${options.parent})`);
    return { data: entitySummary(entity) };
});
mcp.method('entities:delete', async (ids) => {
    const entities = ids
        .map((id: string) => api.entities.get(id))
        .filter((entity: any) => entity && entity !== api.entities.root);
    if (!entities.length) {
        return {
            error: 'No deletable entities found (the root entity cannot be deleted). Call list_entities to obtain valid, non-root resource_ids.'
        };
    }
    await api.entities.delete(entities);
    log(`Deleted entities: ${ids.join(', ')}`);
    return { data: { deleted: entities.length } };
});
mcp.method('entities:resolve', (options: any = {}) => {
    const name = (options.name || '').toLowerCase();
    if (!name) {
        return { error: 'Provide a non-empty "name" to resolve.' };
    }
    const matches = api.entities.list().filter((entity) => {
        const entityName = (entity.get('name') || '').toLowerCase();
        return options.exact ? entityName === name : entityName.includes(name);
    });
    log(`Resolved entities by name(${options.name}): ${matches.length} match(es)`);

    // empty match is a valid result, not an error
    return { data: matches.map(entitySummary), meta: { total: matches.length, count: matches.length } };
});
mcp.method('entities:list', (options: any = {}) => {
    let entities = api.entities.list();

    // apply filters
    if (options.name) {
        const searchName = options.name.toLowerCase();
        entities = entities.filter((entity) => entity.get('name').toLowerCase().includes(searchName));
    }
    if (options.component) {
        entities = entities.filter((entity) => entity.get(`components.${options.component}`));
    }
    if (options.tag) {
        entities = entities.filter((entity) => entity.get('tags').includes(options.tag));
    }

    // an empty result is a valid success, not an error
    const { page, meta } = paginate(entities, options);

    log(`Listed entities (${meta.count}/${meta.total})`);

    // return full JSON or summary
    if (options.full) {
        return { data: page.map((entity) => entity.json()), meta };
    }

    // summary mode: compact, semantic data
    return { data: page.map(entitySummary), meta };
});
mcp.method('entities:components:add', (id, components) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    Object.entries(components).forEach(([name, data]) => {
        entity.addComponent(name, data);
    });
    log(`Added components(${Object.keys(components).join(', ')}) to entity(${id})`);
    return { data: entitySummary(entity) };
});
mcp.method('entities:components:remove', (id, components) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    components.forEach((component: string) => {
        entity.removeComponent(component);
    });
    log(`Removed components(${components.join(', ')}) from entity(${id})`);
    return { data: entitySummary(entity) };
});
mcp.method('entities:components:script:add', (id, scriptName) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }
    if (!entity.get('components.script')) {
        return {
            error: `Entity ${id} has no script component. Add one first via add_components { script: {} } or use attach_script which creates it automatically.`
        };
    }
    entity.addScript(scriptName);
    log(`Added script(${scriptName}) to component(script) of entity(${id})`);
    return { data: entitySummary(entity) };
});
mcp.method('entities:script:attach', (id, scriptName) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return {
            error: `Entity not found: ${id}. Call list_entities (or resolve_entities) to obtain a valid resource_id.`
        };
    }

    // consolidated flow: ensure the script component exists, then attach
    if (!entity.get('components.script')) {
        entity.addComponent('script', {});
    }
    entity.addScript(scriptName);
    log(`Attached script(${scriptName}) to entity(${id})`);
    return { data: entitySummary(entity) };
});

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

// scenes
mcp.method('scene:settings:modify', (settings) => {
    const scene = api.settings.scene;
    iterateObject(settings, (path, value) => {
        scene.set(path, value);
    });
    log('Modified scene settings');

    // return the resulting settings snapshot inline
    return { data: scene.json() };
});
mcp.method('scene:settings:query', () => {
    const scene = api.settings.scene;
    log('Queried scene settings');
    return { data: scene.json() };
});

// project settings
mcp.method('project:settings:modify', (settings) => {
    const project = editor.call('settings:project');
    iterateObject(settings, (path, value) => {
        project.set(path, value);
    });
    log('Modified project settings');

    // return the resulting settings snapshot inline
    return { data: project.json() };
});
mcp.method('project:settings:query', () => {
    const project = editor.call('settings:project');
    log('Queried project settings');
    return { data: project.json() };
});

// scene management
mcp.method('scenes:list', async () => {
    const data = await new Promise((resolve) => {
        editor.call('scenes:list', (result: unknown) => resolve(result));
    });
    log('Listed scenes');
    return { data };
});
mcp.method('scenes:get', async (id) => {
    const [err, data] = await new Promise<unknown[]>((resolve) => {
        editor.call('scenes:get', String(id), (e: unknown, d: unknown) => resolve([e, d]));
    });
    if (err) {
        return { error: `Scene not found: ${id}. Call list_scenes to obtain a valid scene id.` };
    }
    log(`Got scene(${id})`);
    return { data };
});
mcp.method('scenes:new', async (name) => {
    const data = await new Promise((resolve) => {
        editor.call('scenes:new', name, (d: unknown) => resolve(d));
    });
    log(`Created scene: ${name ?? '(unnamed)'}`);
    return { data };
});
mcp.method('scenes:duplicate', async (id, name) => {
    const data = await new Promise((resolve) => {
        editor.call('scenes:duplicate', String(id), name, (d: unknown) => resolve(d));
    });
    log(`Duplicated scene(${id})`);
    return { data };
});
mcp.method('scenes:delete', async (id) => {
    await new Promise<void>((resolve) => {
        editor.call('scenes:delete', String(id), () => resolve());
    });
    log(`Deleted scene(${id})`);
    return { data: { deleted: id } };
});
mcp.method('scene:load', (uniqueId) => {
    // scene:load defers until realtime is authenticated, so this returns before
    // the switch completes; the editor loads the scene asynchronously.
    editor.call('scene:load', uniqueId);
    log(`Loading scene(${uniqueId})`);
    return { data: { loading: uniqueId } };
});

// selection
mcp.method('selection:get', () => {
    const items = api.selection.items || [];
    const type = editor.call('selector:type');
    const ids = items.map((it) => (type === 'asset' ? it.get('id') : it.get('resource_id')));
    log('Queried selection');
    return { data: { type, ids } };
});
mcp.method('selection:set', (type, ids) => {
    const items = (ids || [])
        .map((id) => (type === 'asset' ? api.assets.get(id) : api.entities.get(id)))
        .filter(Boolean);
    api.selection.set(items);
    log(`Set ${type} selection (${items.length})`);
    return { data: { type, ids: items.map((it) => (type === 'asset' ? it.get('id') : it.get('resource_id'))) } };
});
mcp.method('selection:clear', () => {
    api.selection.clear();
    log('Cleared selection');
    return { data: { type: null, ids: [] } };
});

// history (undo/redo)
mcp.method('history:undo', () => {
    const undone = api.history.canUndo;
    if (undone) {
        api.history.undo();
    }
    log(undone ? 'Undo' : 'Undo (nothing to undo)');
    return { data: { undone, canUndo: api.history.canUndo, canRedo: api.history.canRedo } };
});
mcp.method('history:redo', () => {
    const redone = api.history.canRedo;
    if (redone) {
        api.history.redo();
    }
    log(redone ? 'Redo' : 'Redo (nothing to redo)');
    return { data: { redone, canUndo: api.history.canUndo, canRedo: api.history.canRedo } };
});

// transform gizmo
mcp.method('gizmo:state:set', (state) => {
    const s = state || {};
    if (s.mode !== undefined) {
        editor.call('gizmo:type', s.mode);
    }
    if (s.space !== undefined) {
        editor.call('gizmo:coordSystem', s.space);
    }
    if (s.snap !== undefined) {
        editor.call('gizmo:snap', s.snap);
    }
    log('Set gizmo state');
    return { data: { mode: editor.call('gizmo:type'), space: editor.call('gizmo:coordSystem') } };
});

// camera framing
mcp.method('camera:focus:point', (point, distance) => {
    if (!Array.isArray(point) || point.length !== 3) {
        return { error: 'point must be an array [x, y, z].' };
    }
    editor.call('camera:focus', tmpVec3.set(point[0], point[1], point[2]), distance);
    log(`Focused camera on [${point.join(', ')}] at distance ${distance}`);
    return { data: { point, distance } };
});

// entity search
mcp.method('entities:search', (query, limit) => {
    let results = editor.call('entities:fuzzy-search', query) || [];
    if (typeof limit === 'number') {
        results = results.slice(0, limit);
    }
    log(`Searched entities for "${query}" (${results.length})`);
    return { data: results.map(entitySummary) };
});
mcp.method('entities:byScript', (script) => {
    const results = editor.call('entities:list:byScript', script) || [];
    log(`Listed entities by script "${script}" (${results.length})`);
    return { data: results.map(entitySummary) };
});

// store - playcanvas
mcp.method('store:playcanvas:list', async (options: any = {}) => {
    const params = [];
    if (options.search) {
        params.push(`search=${options.search}`);
    }
    params.push('regexp=true');
    if (options.order) {
        params.push(`order=${options.order}`);
    }
    if (options.skip) {
        params.push(`skip=${options.skip}`);
    }
    if (options.limit) {
        params.push(`limit=${options.limit}`);
    }

    try {
        const data = await rest('GET', `store?${params.join('&')}`);
        if (data.error) {
            return { error: data.error };
        }
        log(`Searched store: ${JSON.stringify(options)}`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
mcp.method('store:playcanvas:get', async (id) => {
    try {
        const data = await rest('GET', `store/${id}`);
        if (data.error) {
            return { error: data.error };
        }
        log(`Got store item(${id})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
mcp.method('store:playcanvas:clone', async (id, name, license) => {
    try {
        const data = await rest('POST', `store/${id}/clone`, {
            scope: {
                type: 'project',
                id: config.project.id
            },
            name,
            store: 'playcanvas',
            targetFolderId: null,
            license
        });
        if (data.error) {
            return { error: data.error };
        }
        log(`Cloned store item(${id})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});

// store - sketchfab
mcp.method('store:sketchfab:list', async (options: any = {}) => {
    const params = ['restricted=0', 'type=models', 'downloadable=true'];
    if (options.search) {
        params.push(`q=${options.search}`);
    }
    if (options.order) {
        params.push(`sort_by=${options.order}`);
    }
    if (options.skip) {
        params.push(`cursor=${options.skip}`);
    }
    if (options.limit) {
        params.push(`count=${Math.min(options.limit ?? 0, 24)}`);
    }

    try {
        const res = await fetch(`https://api.sketchfab.com/v3/search?${params.join('&')}`);
        const data = await res.json();
        if (data.error) {
            return { error: data.error };
        }
        log(`Searched Sketchfab: ${JSON.stringify(options)}`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
mcp.method('store:sketchfab:get', async (uid) => {
    try {
        const res = await fetch(`https://api.sketchfab.com/v3/models/${uid}`);
        const data = await res.json();
        if (data.error) {
            return { error: data.error };
        }
        log(`Got Sketchfab model(${uid})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
mcp.method('store:sketchfab:clone', async (uid, name, license) => {
    try {
        const data = await rest('POST', `store/${uid}/clone`, {
            scope: {
                type: 'project',
                id: config.project.id
            },
            name,
            store: 'sketchfab',
            targetFolderId: null,
            license
        });
        if (data.error) {
            return { error: data.error };
        }
        log(`Cloned sketchfab item(${uid})`);
        return { data };
    } catch (e: any) {
        return { error: e.message };
    }
});
