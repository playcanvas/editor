import { animStateKeys, modifyAnimStateGraph } from '../animstategraph/data';

import { driver } from './driver';
import { api, log } from './shared';

const mappings = (assetId: number, prev: any, next: any) => {
    const before = animStateKeys(prev);
    const after = animStateKeys(next);
    const changes = Array.from(before).flatMap(([id, key]) =>
        after.has(id) && after.get(id) !== key ? [[key, after.get(id)]] : []
    );
    if (!changes.length) {
        return [];
    }
    return api.entities.list().flatMap((entity: any) => {
        if (entity.get('components.anim.stateGraphAsset') !== assetId) {
            return [];
        }
        const oldMap = structuredClone(entity.get('components.anim.animationAssets') || {});
        const newMap = structuredClone(oldMap);
        changes.forEach(([key]) => delete newMap[key]);
        changes.forEach(([key, newKey]) => (newMap[newKey] = oldMap[key] ?? { asset: null }));
        return [{ id: entity.get('resource_id'), before: oldMap, after: newMap }];
    });
};

const write = (asset: any, data: any, maps: any[], side: 'before' | 'after') => {
    const current = asset.latest();
    if (!current) {
        return;
    }
    const history = current.history.enabled;
    current.history.enabled = false;
    current.set('data', structuredClone(data));
    current.history.enabled = history;
    maps.forEach((map) => {
        const entity = api.entities.get(map.id);
        if (!entity) {
            return;
        }
        const enabled = entity.history.enabled;
        entity.history.enabled = false;
        entity.set('components.anim.animationAssets', structuredClone(map[side]));
        entity.history.enabled = enabled;
    });
};

driver.method('animstategraph:get', (assetId) => {
    const asset = api.assets.get(assetId);
    if (!asset || asset.get('type') !== 'animstategraph') {
        return {
            error: `Anim state graph asset not found: ${assetId}. Call list_assets with type="animstategraph" to obtain a valid asset id.`
        };
    }
    return { data: { assetId, graph: structuredClone(asset.get('data')) } };
});

driver.method('animstategraph:modify', async (assetId, operations) => {
    if (!editor.call('permissions:write')) {
        return { error: 'Write permission is required to modify an anim state graph.' };
    }
    const asset = api.assets.get(assetId);
    if (!asset || asset.get('type') !== 'animstategraph') {
        return {
            error: `Anim state graph asset not found: ${assetId}. Call list_assets with type="animstategraph" to obtain a valid asset id.`
        };
    }

    const [err, result] = await Promise.resolve()
        .then(() => modifyAnimStateGraph(asset.get('data'), operations))
        .then((value) => [null, value] as const, (error) => [error, null] as const);
    if (err) {
        return { error: err instanceof Error ? err.message : String(err) };
    }

    const prev = structuredClone(asset.get('data'));
    const maps = mappings(assetId, prev, result.data);
    await api.history.addAndExecute({
        name: `modify anim state graph ${assetId}`,
        combine: false,
        redo: () => write(asset, result.data, maps, 'after'),
        undo: () => write(asset, prev, maps, 'before')
    });
    log(`Modified anim state graph asset(${assetId}) with ${operations.length} operation(s)`);
    return { data: { assetId, graph: result.data, ids: result.ids } };
});
