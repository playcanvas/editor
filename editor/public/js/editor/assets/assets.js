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

editor.once('load', function () {
    'use strict';

    // hook into private assets observer list in API
    // (this should all be temporary as this file should eventually be removed)
    const assets = editor.assets._assets;

    editor.assets.on('add', (asset, pos) => {
        editor.emit(`assets:add[${asset.get('id')}]`, asset._observer, pos);
        editor.emit(`assets:add`, asset._observer, pos);
    });

    editor.assets.on('remove', (asset) => {
        editor.emit('assets:remove', asset._observer);
        editor.emit(`assets:remove[${asset.get('id')}]`);
    });

    editor.assets.on('clear', () => {
        editor.emit('assets:clear');
    });

    editor.assets.on('move', (asset, pos) => {
        editor.emit('assets:move', asset.apiAssets, pos);
    });

    editor.assets.on('load:progress', progress => {
        editor.call('assets:progress', progress);
    });

    editor.assets.on('load:all', () => {
        editor.emit('assets:load');
    });

    // return assets ObserverList
    editor.method('assets:raw', function () {
        return assets;
    });

    // allow adding assets
    editor.method('assets:add', function (asset) {
        editor.assets.add(asset.apiAsset);
    });

    // allow removing assets
    editor.method('assets:remove', function (asset) {
        editor.assets.remove(asset.apiAsset);
    });

    // remove all assets
    editor.method('assets:clear', function () {
        editor.assets.clear();
    });

    // get asset by id
    editor.method('assets:get', function (id) {
        const asset = editor.assets.get(id);
        return asset ? asset._observer : null;
    });

    // get asset by unique id
    editor.method('assets:getUnique', function (uniqueId) {
        const asset = editor.assets.getUnique(uniqueId);
        return asset ? asset._observer : null;
    });

    // find assets by function
    editor.method('assets:find', function (fn) {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', function (fn) {
        return assets.findOne(fn);
    });

    editor.method('assets:map', function (fn) {
        assets.map(fn);
    });

    editor.method('assets:list', function () {
        return assets.array();
    });
});
