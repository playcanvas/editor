import type { Observer } from '@playcanvas/observer';
import { ObserverList } from '@playcanvas/observer';

editor.once('load', () => {
    let uniqueIdToItemId: Record<string | number, number> = {};

    const assets = new ObserverList({
        index: 'id'
    });

    function createLatestFn(id: string) {
        // function to get latest version of asset observer
        return function () {
            return assets.get(id);
        };
    }

    // list assets
    editor.method('assets:list', () => {
        return assets.array();
    });

    // allow adding assets
    editor.method('assets:add', (asset) => {
        uniqueIdToItemId[asset.get('uniqueId')] = asset.get('id');

        // function to get latest version of asset observer
        asset.latestFn = createLatestFn(asset.get('id'));

        assets.add(asset);
    });

    // allow removing assets
    editor.method('assets:remove', (asset) => {
        assets.remove(asset);
        asset.destroy();
    });

    // remove all assets
    editor.method('assets:clear', () => {
        assets.clear();
        uniqueIdToItemId = {};
    });

    // get asset by item id
    editor.method('assets:get', (id) => {
        return assets.get(id);
    });

    // get asset by unique id
    editor.method('assets:getUnique', (uniqueId) => {
        const id = uniqueIdToItemId[uniqueId];
        return id ? assets.get(id) : null;
    });

    // find assets by function
    editor.method('assets:find', (fn: (asset: Observer) => boolean) => {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', (fn: (asset: Observer) => boolean) => {
        return assets.findOne(fn);
    });

    // publish added asset
    assets.on('add', (asset: Observer) => {
        editor.emit(`assets:add[${asset.get('id')}]`, asset);
        editor.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', (asset: Observer) => {
        editor.emit('assets:remove', asset);
        delete uniqueIdToItemId[asset.get('id')];
    });

    // check if asset is a script
    editor.method('assets:isScript', (asset: Observer) => {
        return asset.get('type') === 'script';
    });

    // check if asset is a module
    editor.method('assets:isModule', (asset: Observer) => {
        return editor.call('assets:isScript', asset) &&
            asset.get('file.filename')?.endsWith('.mjs');
    });
});
