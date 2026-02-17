import type { Asset, AssetObserver } from '@/editor-api';

// NAMESPACE
//     asset
//
// METHODS
//     add
//     remove
//     get
//     find
//     findOne
//
// EVENTS
//     add
//     remove

editor.once('load', () => {
    // hook into private assets observer list in API
    // (this should all be temporary as this file should eventually be removed)
    const assets = editor.api.globals.assets.raw;

    editor.api.globals.assets.on('add', (asset: Asset, pos: number) => {
        editor.emit(`assets:add[${asset.get('id')}]`, asset.observer, pos);
        editor.emit('assets:add', asset.observer, pos);
    });

    editor.api.globals.assets.on('remove', (asset: Asset) => {
        editor.emit('assets:remove', asset.observer);
        editor.emit(`assets:remove[${asset.get('id')}]`);
    });

    editor.api.globals.assets.on('clear', () => {
        editor.emit('assets:clear');
    });

    editor.api.globals.assets.on('move', (asset: Asset, pos: number) => {
        editor.emit('assets:move', asset, pos);
    });

    editor.api.globals.assets.on('load:progress', (progress: number) => {
        editor.call('assets:progress', progress);
    });

    editor.api.globals.assets.on('load:all', () => {
        editor.emit('assets:load');
    });

    // return assets ObserverList
    editor.method('assets:raw', () => {
        return assets;
    });

    // allow adding assets
    editor.method('assets:add', (asset: AssetObserver) => {
        editor.api.globals.assets.add(asset.apiAsset);
    });

    // allow removing assets
    editor.method('assets:remove', (asset: AssetObserver) => {
        editor.api.globals.assets.remove(asset.apiAsset);
    });

    // remove all assets
    editor.method('assets:clear', () => {
        editor.api.globals.assets.clear();
    });

    // get asset by id
    editor.method('assets:get', (id: string | number) => {
        const asset = editor.api.globals.assets.get(id);
        return asset ? asset.observer : null;
    });

    // get asset by unique id
    editor.method('assets:getUnique', (uniqueId: string) => {
        const asset = editor.api.globals.assets.getUnique(uniqueId);
        return asset ? asset.observer : null;
    });

    // find assets by function
    editor.method('assets:find', (fn: (asset: Asset) => boolean) => {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', (fn: (asset: Asset) => boolean) => {
        return assets.findOne(fn);
    });

    editor.method('assets:map', (fn: (asset: Asset) => void) => {
        assets.map(fn);
    });

    editor.method('assets:list', () => {
        return assets.array();
    });

    editor.method('assets:isScript', (asset: AssetObserver) => {
        return asset.get('type') === 'script';
    });

    editor.method('assets:isModule', (asset: AssetObserver) => {
        return editor.call('assets:isScript', asset) &&
            asset.get('file.filename')?.endsWith('.mjs');
    });

    editor.method('assets:virtualPath', (asset: AssetObserver) => {
        const pathSegments = asset.get('path').map(id => editor.call('assets:get', id).get('name'));
        return `/${[...pathSegments, asset.get('file').filename].join('/')}`;
    });

    editor.method('assets:realPath', (asset: AssetObserver) => {
        return `/api/assets/${asset.get('id')}/file/${asset.get('name')}?branchId=${config.self.branch.id}`;
    });
});
