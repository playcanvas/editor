import { TextureCompressor } from '@/editor/assets/assets-textures-compress';
import type { Asset } from '@/editor-api';

import { driver } from './driver';
import { api, log } from './shared';

type Frame = { name: string; rect: number[]; pivot: number[]; border: number[] };
type SpriteProps = {
    pixelsPerUnit?: number;
    renderMode?: number;
    frameKeys?: (string | number)[];
    textureAtlasAsset?: number;
    frames?: Record<string, Frame>;
};
const VARIANTS = ['basis', 'dxt', 'etc1', 'etc2', 'pvr'];

const summary = (asset: Asset) => ({
    id: asset.get('id'),
    name: asset.get('name'),
    type: asset.get('type')
});

const setData = (id: number, data: Record<string, unknown>) => {
    const asset = api.assets.get(id);
    if (!asset) {
        return;
    }
    const history = asset.history.enabled;
    asset.history.enabled = false;
    asset.set('data', structuredClone(data));
    asset.history.enabled = history;
};

const writable = () =>
    editor.call('permissions:write') || { error: 'Write permission is required for asset processing.' };

const bounded = (start: (done: (error?: unknown, data?: any) => void) => void, cleanup?: () => void) =>
    new Promise<any[]>((resolve) => {
        let active = true;
        const finish = (error?: unknown, data?: any) => {
            if (!active) {
                return;
            }
            active = false;
            cleanup?.();
            resolve([error, data]);
        };
        Promise.resolve()
            .then(() => start(finish))
            .catch(finish);
    });

const waitAsset = async (id: number) => {
    const current = api.assets.get(id);
    if (current) {
        return [null, current];
    }
    let event: any;
    return bounded(
        (done) => {
            event = api.assets.once(`add[${id}]`, (asset: Asset) => {
                done(null, asset);
            });
        },
        () => event?.unbind()
    );
};

const waitTask = (asset: any, start: () => boolean | void) =>
    new Promise<any[]>((resolve) => {
        let active = true;
        let running = asset.get('task') !== null;
        const finish = (error?: unknown) => {
            if (!active) {
                return;
            }
            active = false;
            event.unbind();
            resolve([error]);
        };
        const event = asset.on('task:set', (value: unknown) => {
            running ||= value !== null;
            if (running && value === null) {
                finish();
            }
        });
        Promise.resolve()
            .then(start)
            .then((scheduled) => {
                if (scheduled === false) {
                    finish();
                }
            })
            .catch(finish);
    });

driver.method('lightmapper:bake', async (ids?: string[]) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const entities = ids?.map((id) => api.entities.get(id));
    if (entities?.some((entity) => !entity)) {
        return { error: 'One or more entities were not found. Call list_entities to obtain valid resource_ids.' };
    }
    const targets = entities || api.entities.list().filter((entity) => entity.get('components.model.lightmapped'));
    const missing = targets
        .map((entity) => entity.get('components.model.asset'))
        .filter((id) => id && !api.assets.get(id)?.has('meta.attributes.texCoord1'));
    let event: any;
    const [error] = await bounded(
        (done) => {
            event = editor.once('lightmapper:baked', () => {
                done();
            });
            editor.call('lightmapper:bake', targets);
        },
        () => event?.unbind()
    );
    if (error) {
        return { error: error.message };
    }
    editor.call('entities:shadows:update');
    log('Baked lightmaps');
    return { data: { baked: targets.length, missingUv1: [...new Set(missing)] } };
});

driver.method('assets:model:unwrap', async (id, options: { padding?: number } = {}) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'model' || !asset.has('file.filename')) {
        return { error: `Model asset not found or has no source file: ${id}.` };
    }
    const [error, result] = await bounded((done) => editor.call('assets:model:unwrap', asset, options, done));
    return error ? { error: String(error) } : { data: summary(result || asset) };
});

driver.method('assets:model:unwrap:cancel', (id) => {
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'model') {
        return { error: `Model asset not found: ${id}.` };
    }
    return editor.call('assets:model:unwrap:cancel', asset)
        ? { data: { cancelled: id } }
        : { error: `Model asset ${id} is not being unwrapped.` };
});

driver.method('assets:texture:convert', async (id, format) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'texture' || !asset.has('file.filename')) {
        return { error: `Texture asset not found or has no source file: ${id}.` };
    }
    if (!['avif', 'jpeg', 'png', 'webp'].includes(format)) {
        return { error: `Unsupported texture format: ${format}.` };
    }
    const [error, data] = await bounded((done) => editor.call('assets:texture:convert', id, format, done));
    if (error) {
        return { error: String(error) };
    }
    const createdId = data?.asset?.id || data?.id;
    const [settleError, result] = createdId ? await waitAsset(createdId) : [null, null];
    return settleError ? { error: String(settleError) } : { data: result ? summary(result) : data || null };
});

driver.method('assets:texture:toAtlas', async (id) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'texture' || asset.get('source')) {
        return { error: `Editable texture asset not found: ${id}.` };
    }
    const [error, atlasId] = await bounded((done) => editor.call('assets:textureToAtlas', asset, done));
    if (error) {
        return { error: String(error) };
    }
    const [settleError, atlas] = await waitAsset(atlasId);
    return settleError ? { error: String(settleError) } : { data: summary(atlas) };
});

driver.method('assets:texture:toCubemap', async (id) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'texture' || asset.get('source')) {
        return { error: `Editable texture asset not found: ${id}.` };
    }
    const [error, cubemap] = await bounded((done) => editor.call('assets:textureToCubemap', asset, done));
    return error ? { error: String(error) } : { data: summary(cubemap) };
});

driver.method('assets:font:process', async (id, options: { characters: string; invert?: boolean }) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    const source = asset && api.assets.get(asset.get('source_asset_id'));
    if (!asset || asset.get('type') !== 'font' || !source) {
        return { error: `Font asset or source not found: ${id}.` };
    }
    const characters = [...new Set(Array.from(options.characters || ''))].join('');
    asset.set('meta.chars', characters);
    if (options.invert !== undefined) {
        asset.set('meta.invert', options.invert);
    }
    const [error] = await waitTask(asset, () => {
        editor.call('realtime:send', 'pipeline', {
            name: 'convert',
            data: {
                source: Number(source.get('uniqueId')),
                target: Number(asset.get('uniqueId')),
                chars: characters,
                invert: !!asset.get('meta.invert')
            }
        });
    });
    return error ? { error: error.message } : { data: summary(asset) };
});

driver.method('assets:texture:metadata', async (id) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'texture') {
        return { error: `Texture asset not found: ${id}.` };
    }
    if (asset.get('meta')) {
        return { data: summary(asset) };
    }
    let event: any;
    const [error] = await bounded(
        (done) => {
            event = asset.once('meta:set', () => {
                done();
            });
            editor.call('realtime:send', 'pipeline', { name: 'meta', id: asset.get('uniqueId') });
        },
        () => event?.unbind()
    );
    return error ? { error: error.message } : { data: summary(asset) };
});

driver.method(
    'assets:texture:variants',
    async (id, options: { formats: string[]; remove?: boolean; force?: boolean }) => {
        const permission = writable();
        if (permission !== true) {
            return permission;
        }
        const asset = api.assets.get(id);
        if (!asset || asset.get('type') !== 'texture' || !asset.get('file')) {
            return { error: `Texture asset not found or has no file: ${id}.` };
        }
        const formats = [...new Set(options.formats || [])];
        const invalid = formats.filter((format) => !VARIANTS.includes(format));
        if (!formats.length || invalid.length) {
            return { error: `Texture formats must be one or more of: ${VARIANTS.join(', ')}.` };
        }
        for (let i = 0; i < formats.length; i++) {
            asset.set(`meta.compress.${formats[i]}`, !options.remove);
        }
        const [error] = await waitTask(asset, () =>
            TextureCompressor.compress([asset.observer], formats, !!options.force)
        );
        return error
            ? { error: error.message }
            : { data: { ...summary(asset), variants: asset.get('file.variants') || {} } };
    }
);

driver.method('assets:cubemap:prefilter', async (id, legacy = false) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'cubemap') {
        return { error: `Cubemap asset not found: ${id}.` };
    }
    const [error] = await bounded((done) => editor.call('assets:cubemaps:prefilter', asset.observer, legacy, done));
    if (error) {
        return { error: String(error) };
    }
    if (!asset.get('file')) {
        let event: any;
        const [settleError] = await bounded(
            (done) => {
                event = asset.on('file:set', (file: unknown) => {
                    if (file) {
                        done();
                    }
                });
            },
            () => event?.unbind()
        );
        if (settleError) {
            return { error: String(settleError) };
        }
    }
    return { data: summary(asset) };
});

driver.method('assets:cubemap:prefilter:clear', async (id) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'cubemap') {
        return { error: `Cubemap asset not found: ${id}.` };
    }
    if (!asset.get('file')) {
        return { data: summary(asset) };
    }
    let event: any;
    const [error] = await bounded(
        (done) => {
            event = asset.on('file:set', (file: unknown) => {
                if (file === null) {
                    done();
                }
            });
            editor.call('realtime:send', 'cubemap:clear:', Number(asset.get('uniqueId')));
        },
        () => event?.unbind()
    );
    if (error) {
        return { error: String(error) };
    }
    return { data: summary(asset) };
});

driver.method('assets:sprite:modify', (id, props: SpriteProps) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || !['sprite', 'textureatlas'].includes(asset.get('type'))) {
        return { error: `Sprite or texture atlas asset not found: ${id}.` };
    }
    const allowed =
        asset.get('type') === 'sprite' ? ['pixelsPerUnit', 'renderMode', 'frameKeys', 'textureAtlasAsset'] : ['frames'];
    const invalid = Object.keys(props).filter((key) => !allowed.includes(key));
    if (invalid.length) {
        return { error: `Unsupported ${asset.get('type')} properties: ${invalid.join(', ')}.` };
    }
    const before = structuredClone(asset.get('data'));
    const after = { ...before, ...structuredClone(props) };
    if (asset.get('type') === 'sprite') {
        if (
            !Array.isArray(after.frameKeys) ||
            !Number.isFinite(after.pixelsPerUnit) ||
            after.pixelsPerUnit <= 0 ||
            ![0, 1, 2].includes(after.renderMode)
        ) {
            return { error: 'Sprite data requires frameKeys, pixelsPerUnit > 0, and renderMode 0, 1, or 2.' };
        }
        const atlas = api.assets.get(after.textureAtlasAsset);
        if (!atlas || atlas.get('type') !== 'textureatlas') {
            return { error: `Texture atlas asset not found: ${after.textureAtlasAsset}.` };
        }
        const frames = atlas.get('data.frames') || {};
        const missing = (after.frameKeys || []).filter((key: string) => !frames[key]);
        if (missing.length) {
            return { error: `Texture atlas frames not found: ${missing.join(', ')}.` };
        }
    } else {
        const frames =
            after.frames && typeof after.frames === 'object' && !Array.isArray(after.frames)
                ? Object.values(after.frames)
                : null;
        if (
            !frames ||
            frames.some(
                (frame: Frame) =>
                    typeof frame?.name !== 'string' ||
                    ![frame.rect, frame.pivot, frame.border].every(
                        (value, index) =>
                            Array.isArray(value) && value.length === [4, 2, 4][index] && value.every(Number.isFinite)
                    )
            )
        ) {
            return { error: 'frames must contain valid name, rect, pivot, and border values.' };
        }
    }
    setData(id, after);
    api.history.add({
        name: `asset.${id}.data`,
        combine: false,
        undo: () => setData(id, before),
        redo: () => setData(id, after)
    });
    log(`Modified ${asset.get('type')} asset(${id})`);
    return { data: { ...summary(asset), data: asset.get('data') } };
});

driver.method('assets:bundle:modify', (id, options: { add?: number[]; remove?: number[] } = {}) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const bundle = api.assets.get(id);
    if (!bundle || bundle.get('type') !== 'bundle') {
        return { error: `Bundle asset not found: ${id}.` };
    }
    const addIds = [...new Set(options.add || [])] as number[];
    const removeIds = [...new Set(options.remove || [])] as number[];
    if (addIds.some((assetId) => removeIds.includes(assetId))) {
        return { error: 'The same asset cannot be added and removed in one operation.' };
    }
    const existing = bundle.get('data.assets') || [];
    const added = addIds.filter((assetId) => {
        const asset = api.assets.get(assetId);
        return asset && editor.call('assets:bundles:canAssetBeAddedToBundle', asset, bundle);
    });
    const removed = removeIds.filter((assetId) => api.assets.get(assetId) && existing.includes(assetId));
    if (added.length) {
        editor.call(
            'assets:bundles:addAssets',
            added.map((assetId) => api.assets.get(assetId)),
            bundle
        );
    }
    if (removed.length) {
        editor.call(
            'assets:bundles:removeAssets',
            removed.map((assetId) => api.assets.get(assetId)),
            bundle
        );
    }
    log(`Modified bundle asset(${id})`);
    return {
        data: {
            id,
            assets: bundle.get('data.assets') || [],
            added,
            removed,
            rejected: {
                add: addIds.filter((assetId) => !added.includes(assetId)),
                remove: removeIds.filter((assetId) => !removed.includes(assetId))
            }
        }
    };
});
