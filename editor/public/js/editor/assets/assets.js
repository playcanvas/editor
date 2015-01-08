/*

NAMESPACE
    asset

METHODS
    add
    remove
    get
    find
    findOne

EVENTS
    add
    remove

*/

editor.once('load', function() {
    'use strict';

    var assets = new ObserverList();
    assets.index = 'id';


    // allow adding assets
    editor.hook('assets:add', function(asset) {
        assets.add(asset);
    });

    // allow removing assets
    editor.hook('assets:remove', function(asset) {
        assets.remove(asset);
        asset.destroy();
    });


    // get asset by id
    editor.hook('assets:get', function(id) {
        return assets.get(id);
    });

    // find assets by function
    editor.hook('assets:find', function(fn) {
        return assets.find(fn);
    });

    // find one asset by function
    editor.hook('assets:findOne', function(fn) {
        return assets.findOne(fn);
    });


    // publish added asset
    assets.on('add', function(asset) {
        editor.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', function(asset) {
        editor.emit('assets:remove', asset);
    });
});
