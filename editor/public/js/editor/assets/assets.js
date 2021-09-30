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

    var uniqueIdToItemId = {};

    var assets = new ObserverList({
        index: 'id',
        sorted: function (a, b) {
            var f = (b._data.type === 'folder') - (a._data.type === 'folder');

            if (f !== 0)
                return f;

            let aName = a._data.name;
            if (aName) {
                aName = aName.toLowerCase();
            }

            let bName = b._data.name;
            if (bName) {
                bName = bName.toLowerCase();
            }

            if (aName > bName) {
                return 1;
            } else if (aName < bName) {
                return -1;
            }
            return 0;
        }
    });

    function createLatestFn(id) {
        // function to get latest version of asset observer
        return function () {
            return assets.get(id);
        };
    }

    // return assets ObserverList
    editor.method('assets:raw', function () {
        return assets;
    });

    // allow adding assets
    editor.method('assets:add', function (asset) {
        var id = asset.get('id');
        uniqueIdToItemId[asset.get('uniqueId')] = id;

        asset.latestFn = createLatestFn(id);

        var pos = assets.add(asset);

        if (pos === null)
            return;

        asset.on('name:set', function (name, nameOld) {
            name = (name || '').toLowerCase();
            nameOld = (nameOld || '').toLowerCase();

            var ind = assets.data.indexOf(this);
            var pos = assets.positionNextClosest(this, function (a, b) {
                var f = (b._data.type === 'folder') - (a._data.type === 'folder');

                if (f !== 0)
                    return f;

                if ((a === b ? nameOld : (a._data.name || '').toLowerCase()) > name) {
                    return 1;
                } else if ((a === b ? nameOld : (a._data.name || '').toLowerCase()) < name) {
                    return -1;
                }
                return 0;

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
    editor.method('assets:remove', function (asset) {
        assets.remove(asset);
    });

    // remove all assets
    editor.method('assets:clear', function () {
        assets.clear();
        editor.emit('assets:clear');

        uniqueIdToItemId = {};
    });

    // get asset by id
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

    editor.method('assets:map', function (fn) {
        assets.map(fn);
    });

    editor.method('assets:list', function () {
        return assets.array();
    });

    // publish remove asset
    assets.on('remove', function (asset) {
        asset.destroy();
        editor.emit('assets:remove', asset);
        editor.emit('assets:remove[' + asset.get('id') + ']');

        delete uniqueIdToItemId[asset.get('uniqueId')];
    });
});
