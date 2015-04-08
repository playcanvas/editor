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

            // map for material
            if (assetJson.type === 'material')
                assetJson.data = editor.call('material:mapToList', assetJson);

            // engine material data
            var data = {
                id: assetJson.id,
                name: assetJson.name,
                file: assetJson.file ? {
                    filename: assetJson.file.filename,
                    url: assetJson.file.url,
                    hash: assetJson.file.hash,
                    size: assetJson.file.size
                } : null,
                data: assetJson.data,
                type: assetJson.type
            };

            // add to registry
            assetRegistry.createAndAddAsset(assetJson.id, data);

            var timeout;
            var updatedFields = {};

            asset.on('*:set', function (path, value) {
                var parts = path.split('.');

                if (parts[0] !== 'data' && parts[0] !== 'file')
                    return;

                if (timeout)
                    clearTimeout(timeout);

                updatedFields[parts[0]] = true;

                // do this in a timeout to avoid multiple sets of the same
                // fields
                timeout = setTimeout(function () {
                    var realtimeAsset = assetRegistry.getAssetById(asset.get('id'));

                    for (var key in updatedFields) {
                        var data = asset.get(key);

                        if (asset.get('type') === 'material' && key === 'data')
                            data = editor.call('material:mapToList', { data: data });

                        // this will trigger the 'update' event on the asset in the engine
                        // handling all resource loading automatically
                        realtimeAsset[key] = data;

                        delete updatedFields[key];
                    }

                    timeout = null;

                });

            });

        });

        // remove assets from asset registry
        editor.on('assets:remove', function (asset) {
            var realtimeAsset = assetRegistry.getAssetById(asset.get('id'));
            if (realtimeAsset) {
                assetRegistry.removeAsset(realtimeAsset);
            }
        });
    });
});
