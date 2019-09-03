editor.once('load', function () {
    'use strict';

    var uniqueIdToItemId = {};

    var assets = new ObserverList({
        index: 'id'
    });

    function createLatestFn(id) {
        // function to get latest version of asset observer
        return function () {
            return assets.get(id);
        };
    }

    // list assets
    editor.method('assets:list', function () {
        return assets.array();
    });

    // allow adding assets
    editor.method('assets:add', function (asset) {
        uniqueIdToItemId[asset.get('uniqueId')] = asset.get('id');

        // function to get latest version of asset observer
        asset.latestFn = createLatestFn(asset.get('id'));

        assets.add(asset);
    });

    // allow removing assets
    editor.method('assets:remove', function (asset) {
        assets.remove(asset);
        asset.destroy();
    });

    // remove all assets
    editor.method('assets:clear', function () {
        assets.clear();
        uniqueIdToItemId = {};
    });

    // get asset by item id
    editor.method('assets:get', function (id) {
        return assets.get(id);
    });

    // get asset by unique id
    editor.method('assets:getUnique', function (uniqueId) {
        var id = uniqueIdToItemId[uniqueId];
        return id ? assets.get(id) : null;
    });

    // find assets by function
    editor.method('assets:find', function (fn) {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', function (fn) {
        return assets.findOne(fn);
    });

    // publish added asset
    assets.on('add', function (asset) {
        editor.emit('assets:add[' + asset.get('id') + ']', asset);
        editor.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', function (asset) {
        editor.emit('assets:remove', asset);
        delete uniqueIdToItemId[asset.get('id')];
    });
});
