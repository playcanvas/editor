(function() {
    'use strict';

    var assets = new ObserverList();
    assets.index = 'id';


    // allow adding assets
    msg.hook('assets:add', function(asset) {
        assets.add(asset);
    });

    // allow removing assets
    msg.hook('assets:remove', function(asset) {
        assets.remove(asset);
        asset.destroy();
    });


    // get asset by id
    msg.hook('assets:get', function(id) {
        return assets.get(id);
    });

    // find one asset by function
    msg.hook('assets:findOne', function(fn) {
        return assets.findOne(fn);
    });


    // publish added asset
    assets.on('add', function(asset) {
        msg.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', function(asset) {
        msg.emit('assets:remove', asset);
    });
})();
