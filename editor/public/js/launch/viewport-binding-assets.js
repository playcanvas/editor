app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');
    var assetRegistry = framework.context.assets;

    // after all initial assets are loaded...
    app.on('assets:load', function () {
        // add assets to asset registry
        app.on('assets:add', function (asset) {
            // do only for target assets
            if (asset.get('source'))
                return;

            // raw json data
            var assetJson = asset.json();

            // engine data
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
                if (parts[0] in realtimeAsset) {

                    var raw = asset.json();

                    // this will trigger the 'update' event on the asset in the engine
                    // handling all resource loading automatically
                    realtimeAsset[parts[0]] = raw.data;
                }
            });
        });

        // remove assets from asset registry
        app.on('assets:remove', function (asset) {
            var realtimeAsset = assetRegistry.getAssetById(asset.get('id'));
            if (realtimeAsset) {
                assetRegistry.removeAsset(realtimeAsset);
            }
        });
    });

});
