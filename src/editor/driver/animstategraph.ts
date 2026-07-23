import { animStateKeys, modifyAnimStateGraph, remapAnimStateAssets } from '../animstategraph/data';

import { driver } from './driver';
import { api, log } from './shared';

const mappings = (assetId: number, prev: any, next: any) => {
    const before = animStateKeys(prev);
    const after = animStateKeys(next);
    const changes = [];
    const targets = new Set<string>();
    for (const [id, key] of before) {
        const next = after.get(id);
        if (next !== key) {
            changes.push({ key, next, drop: !targets.has(key) });
            if (next) {
                targets.add(next);
            }
        }
    }
    if (!changes.length) {
        return [];
    }
    const refs = editor.call('assets:used:index')?.[assetId]?.ref || {};
    const ids = Object.keys(refs);
    const maps = [];
    for (let i = 0; i < ids.length; i++) {
        if (refs[ids[i]].type !== 'entity') {
            continue;
        }
        const entity = api.entities.get(ids[i]);
        if (!entity || entity.get('components.anim.stateGraphAsset') !== assetId) {
            continue;
        }
        const oldMap = structuredClone(entity.get('components.anim.animationAssets') || {});
        maps.push({
            id: ids[i],
            before: oldMap,
            after: remapAnimStateAssets(oldMap, changes)
        });
    }
    return maps;
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
    for (let i = 0; i < maps.length; i++) {
        const entity = api.entities.get(maps[i].id);
        if (!entity) {
            continue;
        }
        const enabled = entity.history.enabled;
        entity.history.enabled = false;
        entity.set('components.anim.animationAssets', structuredClone(maps[i][side]));
        entity.history.enabled = enabled;
    }
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
        .then(
            (value) => [null, value] as const,
            (error) => [error, null] as const
        );
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
