import { mcp } from './connection';

const api = editor.api.globals;

const log = (msg: string) => console.log(`%c[MCP] ${msg}`, 'color:#f60');

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
        return { data: base64 };
    } catch (e: any) {
        return { error: `Failed to capture viewport: ${e.message}` };
    }
});
mcp.method('viewport:focus', (ids, options: any = {}) => {
    const entities = ids.map((id: string) => api.entities.get(id)).filter(Boolean);
    if (!entities.length) {
        return { error: 'No valid entities found' };
    }
    api.selection.set(entities, { history: true });

    // get camera and calculate target
    const camera = editor.call('camera:current');
    if (!camera) {
        return { error: 'Could not retrieve current camera' };
    }
    const aabb = editor.call('selection:aabb');
    if (!aabb) {
        return { error: 'Could not calculate selection bounds' };
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
    return { data: true };
});

// entities
mcp.method('entities:create', (entityDataArray) => {
    const entities = [];
    for (const entityData of entityDataArray) {
        if (Object.hasOwn(entityData, 'parent')) {
            const parent = api.entities.get(entityData.parent);
            if (!parent) {
                return { error: `Parent entity not found: ${entityData.parent}` };
            }
            entityData.entity.parent = parent;
        }

        const entity = api.entities.create(entityData.entity);
        if (!entity) {
            return { error: 'Failed to create entity' };
        }
        entities.push(entity);

        log(`Created entity(${entity.get('resource_id')})`);
    }
    return { data: entities.map((entity) => entity.get('resource_id')) };
});
mcp.method('entities:modify', (edits) => {
    for (const { id, path, value } of edits) {
        const entity = api.entities.get(id);
        if (!entity) {
            return { error: `Entity not found: ${id}` };
        }
        entity.set(path, value);
        log(`Set property(${path}) of entity(${id}) to: ${JSON.stringify(value)}`);
    }
    return { data: true };
});
mcp.method('entities:duplicate', async (ids, options: any = {}) => {
    const entities = ids.map((id: string) => api.entities.get(id));
    if (!entities.length) {
        return { error: 'Entities not found' };
    }
    const res = await api.entities.duplicate(entities, options);
    log(`Duplicated entities: ${res.map((entity: any) => entity.get('resource_id')).join(', ')}`);
    return { data: res.map((entity: any) => entity.get('resource_id')) };
});
mcp.method('entities:reparent', (options) => {
    const entity = api.entities.get(options.id);
    if (!entity) {
        return { error: 'Entity not found' };
    }
    const parent = api.entities.get(options.parent);
    if (!parent) {
        return { error: 'Parent entity not found' };
    }
    entity.reparent(parent, options.index, {
        preserveTransform: options.preserveTransform
    });
    log(`Reparented entity(${options.id}) to entity(${options.parent})`);
    return { data: true };
});
mcp.method('entities:delete', async (ids) => {
    const entities = ids
        .map((id: string) => api.entities.get(id))
        .filter((entity: any) => entity !== api.entities.root);
    if (!entities.length) {
        return { error: 'No entities to delete' };
    }
    await api.entities.delete(entities);
    log(`Deleted entities: ${ids.join(', ')}`);
    return { data: true };
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

    if (!entities.length) {
        return { error: 'No entities found' };
    }

    log('Listed entities');

    // return full JSON or summary
    if (options.full) {
        return { data: entities.map((entity) => entity.json()) };
    }

    // summary mode: return minimal data with component names
    return {
        data: entities.map((entity) => {
            const components = entity.get('components') || {};
            return {
                resource_id: entity.get('resource_id'),
                name: entity.get('name'),
                parent: entity.get('parent'),
                enabled: entity.get('enabled'),
                tags: entity.get('tags') || [],
                components: Object.keys(components)
            };
        })
    };
});
mcp.method('entities:components:add', (id, components) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return { error: 'Entity not found' };
    }
    Object.entries(components).forEach(([name, data]) => {
        entity.addComponent(name, data);
    });
    log(`Added components(${Object.keys(components).join(', ')}) to entity(${id})`);
    return { data: true };
});
mcp.method('entities:components:remove', (id, components) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return { error: 'Entity not found' };
    }
    components.forEach((component: string) => {
        entity.removeComponent(component);
    });
    log(`Removed components(${components.join(', ')}) from entity(${id})`);
    return { data: true };
});
mcp.method('entities:components:script:add', (id, scriptName) => {
    const entity = api.entities.get(id);
    if (!entity) {
        return { error: 'Entity not found' };
    }
    if (!entity.get('components.script')) {
        return { error: 'Script component not found' };
    }
    entity.addScript(scriptName);
    log(`Added script(${scriptName}) to component(script) of entity(${id})`);
    return { data: entity.get('components.script') };
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

            log(`Created asset(${asset.get('id')}) - Type: ${type}`);
            return asset.get('id');
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
    const assets = ids.map((id: number) => api.assets.get(id));
    if (!assets.length) {
        return { error: 'Assets not found' };
    }
    api.assets.delete(assets);
    log(`Deleted assets: ${ids.join(', ')}`);
    return { data: true };
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

    if (!assets.length) {
        return { error: 'No assets found' };
    }

    log('Listed assets');

    // return full JSON or summary
    if (options.full) {
        return { data: assets.map((asset) => asset.json()) };
    }

    // summary mode: return minimal data
    return {
        data: assets.map((asset) => {
            const path = asset.get('path') || [];
            return {
                id: asset.get('id'),
                name: asset.get('name'),
                type: asset.get('type'),
                folder: path.length > 0 ? path[path.length - 1] : null,
                tags: asset.get('tags') || []
            };
        })
    };
});
mcp.method('assets:instantiate', async (ids) => {
    const assets = ids.map((id: number) => api.assets.get(id));
    if (!assets.length) {
        return { error: 'Assets not found' };
    }
    if (assets.some((asset: any) => asset.get('type') !== 'template')) {
        return { error: 'Invalid template asset' };
    }
    const entities = await api.assets.instantiateTemplates(assets, api.entities.root);
    log(`Instantiated assets: ${ids.join(', ')}`);
    return { data: entities.map((entity: any) => entity.get('resource_id')) };
});
mcp.method('assets:property:set', (id, prop, value) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return { error: 'Asset not found' };
    }
    asset.set(`data.${prop}`, value);
    log(`Set asset(${id}) property(${prop}) to: ${JSON.stringify(value)}`);
    return { data: true };
});
mcp.method('assets:script:text:set', async (id, text) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return { error: 'Asset not found' };
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
mcp.method('assets:script:parse', async (id) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return { error: 'Asset not found' };
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
    return { data: true };
});
mcp.method('scene:settings:query', () => {
    const scene = api.settings.scene;
    log('Queried scene settings');
    return { data: scene.json() };
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
