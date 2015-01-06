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


    // publish added asset
    assets.on('add', function(asset) {
        msg.emit('assets:add', asset);
    });

    // publish remove asset
    assets.on('remove', function(asset) {
        msg.emit('assets:remove', asset);
    });
})();
