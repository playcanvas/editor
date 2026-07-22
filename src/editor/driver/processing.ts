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
    const baked = new Promise<void>((resolve) => editor.once('lightmapper:baked', resolve));
    editor.call('lightmapper:bake', targets);
    await baked;
    editor.call('entities:shadows:update');
    log('Baked lightmaps');
    return { data: { baked: targets.length, missingUv1: [...new Set(missing)] } };
});

driver.method('assets:model:unwrap', (id, options: { padding?: number } = {}) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'model' || !asset.has('file.filename')) {
        return { error: `Model asset not found or has no source file: ${id}.` };
    }
    return new Promise((resolve) => {
        editor.call('assets:model:unwrap', asset, options, (err, result) => {
            resolve(err ? { error: String(err) } : { data: summary(result || asset) });
        });
    });
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

driver.method('assets:texture:convert', (id, format) => {
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
    return new Promise((resolve) => {
        editor.call('assets:texture:convert', id, format, (err, data) => {
            const result = data?.asset ? api.assets.get(data.asset.id) : data?.id ? api.assets.get(data.id) : null;
            resolve(err ? { error: String(err) } : { data: result ? summary(result) : data || null });
        });
    });
});

driver.method('assets:texture:toAtlas', (id) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'texture' || asset.get('source')) {
        return { error: `Editable texture asset not found: ${id}.` };
    }
    return new Promise((resolve) => {
        editor.call('assets:textureToAtlas', asset, (err, atlasId) => {
            const atlas = atlasId ? api.assets.get(atlasId) : null;
            resolve(err ? { error: String(err) } : { data: atlas ? summary(atlas) : { id: atlasId } });
        });
    });
});

driver.method('assets:texture:toCubemap', (id) => {
    const permission = writable();
    if (permission !== true) {
        return permission;
    }
    const asset = api.assets.get(id);
    if (!asset || asset.get('type') !== 'texture' || asset.get('source')) {
        return { error: `Editable texture asset not found: ${id}.` };
    }
    return new Promise((resolve) => {
        editor.call('assets:textureToCubemap', asset, (err, cubemap) => {
            resolve(err ? { error: String(err) } : { data: summary(cubemap) });
        });
    });
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
