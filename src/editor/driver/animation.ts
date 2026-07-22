import { modifyAnimationEvents } from '../animstategraph/events-data';

import { driver } from './driver';
import { api, log } from './shared';

const asset = (id: number) => {
    const value = api.assets.get(id);
    return value?.get('type') === 'animation' && value.get('file.filename')?.match(/\.glb$/i) ? value : null;
};

const write = (value: any, data: any) => {
    const asset = value.latest();
    if (!asset) {
        return;
    }
    const enabled = asset.history.enabled;
    asset.history.enabled = false;
    asset.set('data', structuredClone(data));
    asset.history.enabled = enabled;
};

driver.method('animation:events:get', (assetId) => {
    const value = asset(assetId);
    if (!value) {
        return {
            error: `GLB animation asset not found: ${assetId}. Call list_assets with type="animation" to obtain a valid asset id.`
        };
    }
    return { data: { assetId, events: structuredClone(value.get('data.events') || {}) } };
});

driver.method('animation:events:modify', async (assetId, operations) => {
    if (!editor.call('permissions:write')) {
        return { error: 'Write permission is required to modify animation events.' };
    }
    const value = asset(assetId);
    if (!value) {
        return {
            error: `GLB animation asset not found: ${assetId}. Call list_assets with type="animation" to obtain a valid asset id.`
        };
    }

    const [err, result] = await Promise.resolve()
        .then(() => modifyAnimationEvents(value.get('data.events') || {}, operations))
        .then(
            (data) => [null, data] as const,
            (error) => [error, null] as const
        );
    if (err) {
        return { error: err instanceof Error ? err.message : String(err) };
    }

    const prev = structuredClone(value.get('data') || {});
    const next = { ...prev, events: result.events };
    await api.history.addAndExecute({
        name: `modify animation events ${assetId}`,
        combine: false,
        redo: () => write(value, next),
        undo: () => write(value, prev)
    });
    log(`Modified animation asset(${assetId}) events with ${operations.length} operation(s)`);
    return { data: { assetId, events: result.events, ids: result.ids } };
});
