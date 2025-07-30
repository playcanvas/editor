/** @import { Asset, AssetObserver } from '@playcanvas/editor-api' */

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

    editor.api.globals.assets.on('add', (/** @type {Asset} */ asset, /** @type {number} */ pos) => {
        editor.emit(`assets:add[${asset.get('id')}]`, asset.observer, pos);
        editor.emit('assets:add', asset.observer, pos);
    });

    editor.api.globals.assets.on('remove', (/** @type {Asset} */ asset) => {
        editor.emit('assets:remove', asset.observer);
        editor.emit(`assets:remove[${asset.get('id')}]`);
    });

    editor.api.globals.assets.on('clear', () => {
        editor.emit('assets:clear');
    });

    editor.api.globals.assets.on('move', (/** @type {Asset} */ asset, /** @type {number} */ pos) => {
        editor.emit('assets:move', asset, pos);
    });

    editor.api.globals.assets.on('load:progress', (progress) => {
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
    editor.method('assets:add', (/** @type {AssetObserver} */ asset) => {
        editor.api.globals.assets.add(asset.apiAsset);
    });

    // allow removing assets
    editor.method('assets:remove', (/** @type {AssetObserver} */ asset) => {
        editor.api.globals.assets.remove(asset.apiAsset);
    });

    // remove all assets
    editor.method('assets:clear', () => {
        editor.api.globals.assets.clear();
    });

    // get asset by id
    editor.method('assets:get', (id) => {
        const asset = editor.api.globals.assets.get(id);
        return asset ? asset.observer : null;
    });

    // get asset by unique id
    editor.method('assets:getUnique', (uniqueId) => {
        const asset = editor.api.globals.assets.getUnique(uniqueId);
        return asset ? asset.observer : null;
    });

    // find assets by function
    editor.method('assets:find', (fn) => {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', (fn) => {
        return assets.findOne(fn);
    });

    editor.method('assets:map', (fn) => {
        assets.map(fn);
    });

    editor.method('assets:list', () => {
        return assets.array();
    });

    editor.method('assets:isScript', (asset) => {
        return asset.get('type') === 'script';
    });

    editor.method('assets:isModule', (asset) => {
        return editor.call('assets:isScript', asset) &&
            asset.get('file.filename')?.endsWith('.mjs');
    });

    editor.method('assets:virtualPath', (asset) => {
        const pathSegments = asset.get('path').map(id => editor.call('assets:get', id).get('name'));
        return `/${[...pathSegments, asset.get('file').filename].join('/')}`;
    });

    editor.method('assets:realPath', (asset) => {
        return `/api/assets/${asset.get('id')}/file/${asset.get('name')}?branchId=${config.self.branch.id}`;
    });
});
