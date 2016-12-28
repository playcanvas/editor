editor.once('load', function() {
    'use strict';

    editor.method('assets:registry:bind', function (assetRegistry, assetTypes) {
        // add assets to asset registry
        editor.on('assets:add', function (asset) {
            // do only for target assets
            if (asset.get('source'))
                return;

            if (assetTypes && assetTypes.indexOf(asset.get('type')) === -1)
                return;

            // raw json data
            var assetJson = asset.json();

            // engine material data
            var data = {
                id: parseInt(assetJson.id, 10),
                name: assetJson.name,
                file: assetJson.file ? {
                    filename: assetJson.file.filename,
                    url: assetJson.file.url,
                    hash: assetJson.file.hash,
                    size: assetJson.file.size,
                    variants: assetJson.file.variants || null
                } : null,
                data: assetJson.data,
                type: assetJson.type
            };

            // add to registry
            // assetRegistry.createAndAddAsset(assetJson.id, data);

            var newAsset = new pc.Asset(data.name, data.type, data.file, data.data);
            newAsset.id = parseInt(assetJson.id, 10);
            assetRegistry.add(newAsset);

            var timeout;
            var updatedFields = { };

            var onUpdate = function(path, value) {
                var parts = path.split('.');

                if (parts[0] !== 'data' && parts[0] !== 'file')
                    return;

                if (timeout)
                    clearTimeout(timeout);

                updatedFields[parts[0]] = true;

                // do this in a timeout to avoid multiple sets of the same
                // fields
                timeout = setTimeout(function () {
                    var realtimeAsset = assetRegistry.get(asset.get('id'));

                    for (var key in updatedFields) {
                        var data = asset.get(key);

                        // this will trigger the 'update' event on the asset in the engine
                        // handling all resource loading automatically
                        realtimeAsset[key] = data;

                        delete updatedFields[key];
                    }

                    timeout = null;
                });
            };

            asset.on('*:set', onUpdate);
            asset.on('*:unset', onUpdate);
        });

        // remove assets from asset registry
        editor.on('assets:remove', function (asset) {
            var item = assetRegistry.get(asset.get('id'));
            if (item) {
                item.unload();
                assetRegistry.remove(item);
            }
        });
    });
});
