app.once('load', function() {
    'use strict';

    var assets = new ObserverList({
        index: 'id'
    });

    // list assets
    app.method('assets:list', function () {
        return assets.array();
    });

    // allow adding assets
    app.method('assets:add', function(asset) {
        assets.add(asset);
    });

    // allow removing assets
    app.method('assets:remove', function(asset) {
        assets.remove(asset);
        asset.destroy();
    });

    // remove all assets
    app.method('assets:clear', function () {
        assets.clear();
    });

    // get asset by id
    app.method('assets:get', function(id) {
        return assets.get(id);
    });

    // find assets by function
    app.method('assets:find', function(fn) {
        return assets.find(fn);
    });

    // find one asset by function
    app.method('assets:findOne', function(fn) {
        return assets.findOne(fn);
    });

    // publish added asset
    assets.on('add', function(asset) {
        app.emit('assets:add[' + asset.get('id') + ']', asset);
        app.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', function(asset) {
        app.emit('assets:remove', asset);
    });
});
