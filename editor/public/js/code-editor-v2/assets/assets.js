editor.once('load', function() {
    'use strict';

    var assets = new ObserverList({
        index: 'id',
        sorted: function(a, b) {
            var f = (b._data['type'] === 'folder') - (a._data['type'] === 'folder');

            if (f !== 0)
                return f;

            if (a._data['name'].toLowerCase() > b._data['name'].toLowerCase()) {
                return 1;
            } else if (a._data['name'].toLowerCase() < b._data['name'].toLowerCase()) {
                return -1;
            } else {
                return 0;
            }
        }
    });


    // return assets ObserverList
    editor.method('assets:raw', function() {
        return assets;
    });

    // allow adding assets
    editor.method('assets:add', function(asset) {
        var pos = assets.add(asset);

        if (pos === null)
            return;

        asset.on('name:set', function(name, nameOld) {
            name = name.toLowerCase();
            nameOld = nameOld.toLowerCase();

            var ind = assets.data.indexOf(this);
            var pos = assets.positionNextClosest(this, function(a, b) {
                var f = (b._data['type'] === 'folder') - (a._data['type'] === 'folder');

                if (f !== 0)
                    return f;

                if ((a === b ? nameOld : a._data['name'].toLowerCase()) > name) {
                    return 1;
                } else if ((a === b ? nameOld : a._data['name'].toLowerCase()) < name) {
                    return -1;
                } else {
                    return 0;
                }
            });

            if (pos === -1 && (ind + 1) == assets.data.length)
                return;

            if (ind !== -1 && (ind + 1 === pos) || (ind === pos))
                return;

            if (ind < pos)
                pos--;

            assets.move(this, pos);
            editor.emit('assets:move', asset, pos);
        });

        // publish added asset
        editor.emit('assets:add[' + asset.get('id') + ']', asset, pos);
        editor.emit('assets:add', asset, pos);
    });

    // allow removing assets
    editor.method('assets:remove', function(asset) {
        assets.remove(asset);
        asset.destroy();
    });

    // remove all assets
    editor.method('assets:clear', function () {
        assets.clear();
        editor.emit('assets:clear');
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

    editor.method('assets:map', function (fn) {
        assets.map(fn);
    });

    editor.method('assets:list', function () {
        return assets.array();
    });

    // publish remove asset
    assets.on('remove', function(asset) {
        editor.emit('assets:remove', asset);
    });
});
