editor.once('load', function() {
    'use strict';

    editor.method('assets:registry:bind', function (assetRegistry) {
        // add assets to asset registry
        editor.on('assets:add', function (asset) {
            // do only for target assets
            if (asset.get('source'))
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

            // attach update handler
            asset.on('*:set', function (path, value) {
                var realtimeAsset = assetRegistry.getAssetById(asset.get('id'));
                var parts = path.split('.');

                var raw = asset.get(parts[0]);
                if (asset.get('type') === 'material' && parts[0] === 'data')
                    raw = editor.call('material:mapToList', { data: raw });

                // this will trigger the 'update' event on the asset in the engine
                // handling all resource loading automatically
                realtimeAsset[parts[0]] = raw;

                editor.call('viewport:render');
            });

            // render
            editor.call('viewport:render');
        });

        // remove assets from asset registry
        editor.on('assets:remove', function (asset) {
            var realtimeAsset = assetRegistry.getAssetById(asset.get('id'));
            if (realtimeAsset) {
                assetRegistry.removeAsset(realtimeAsset);

                // re-render
                editor.call('viewport:render');
            }
        });
    });
});
