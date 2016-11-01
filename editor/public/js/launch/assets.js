editor.once('load', function() {
    'use strict';

    var assets = new ObserverList({
        index: 'id'
    });

    // list assets
    editor.method('assets:list', function () {
        return assets.array();
    });

    // allow adding assets
    editor.method('assets:add', function(asset) {
        assets.add(asset);
    });

    // allow removing assets
    editor.method('assets:remove', function(asset) {
        assets.remove(asset);
        asset.destroy();
    });

    // remove all assets
    editor.method('assets:clear', function () {
        assets.clear();
    });

    // get asset by id
    editor.method('assets:get', function(id) {
        return assets.get(id);
    });

    // find assets by function
    editor.method('assets:find', function(fn) {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', function(fn) {
        return assets.findOne(fn);
    });

    // publish added asset
    assets.on('add', function(asset) {
        editor.emit('assets:add[' + asset.get('id') + ']', asset);
        editor.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', function(asset) {
        editor.emit('assets:remove', asset);
    });
});
