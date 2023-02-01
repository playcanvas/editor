editor.once('load', function () {
    'use strict';

    const uniqueIdToItemId = {};

    const assets = new ObserverList({
        index: 'id',
        sorted: function (a, b) {
            const f = (b._data.type === 'folder') - (a._data.type === 'folder');

            if (f !== 0)
                return f;

            if (a._data.name.toLowerCase() > b._data.name.toLowerCase()) {
                return 1;
            } else if (a._data.name.toLowerCase() < b._data.name.toLowerCase()) {
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
        uniqueIdToItemId[asset.get('uniqueId')] = asset.get('id');

        // function to get latest version of asset observer
        asset.latestFn = createLatestFn(asset.get('id'));

        const pos = assets.add(asset);

        if (pos === null)
            return;

        asset.on('name:set', function (name, nameOld) {
            name = name.toLowerCase();
            nameOld = nameOld.toLowerCase();

            const ind = assets.data.indexOf(this);
            let pos = assets.positionNextClosest(this, function (a, b) {
                const f = (b._data.type === 'folder') - (a._data.type === 'folder');

                if (f !== 0)
                    return f;

                if ((a === b ? nameOld : a._data.name.toLowerCase()) > name) {
                    return 1;
                } else if ((a === b ? nameOld : a._data.name.toLowerCase()) < name) {
                    return -1;
                }
                return 0;
            });

            if (pos === -1 && (ind + 1) === assets.data.length)
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
    });

    // get asset by id
    editor.method('assets:get', function (id) {
        return assets.get(id);
    });

    // get asset by unique id
    editor.method('assets:getUnique', function (uniqueId) {
        const id = uniqueIdToItemId[uniqueId];
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
        delete uniqueIdToItemId[asset.get('uniqueId')];
    });
});
