editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');

    var attachSetHandler = function (asset) {
        // do only for target assets
        if (asset.get('source'))
            return;

        var timeout;
        var updatedFields = { };

        var onChange = function(path, value) {
            var realtimeAsset = app.assets.get(asset.get('id'));
            var parts = path.split('.');

            updatedFields[parts[0]] = true;
            if (timeout)
                clearTimeout(timeout);

            // do the update in a timeout to avoid rapid
            // updates to the same fields
            timeout = setTimeout(function () {
                for (var key in updatedFields) {
                    var raw = asset.get(key);

                    // this will trigger the 'update' event on the asset in the engine
                    // handling all resource loading automatically
                    realtimeAsset[key] = raw;
                }

                timeout = null;
            });
        };

        // attach update handler
        asset.on('*:set', onChange);
        asset.on('*:unset', onChange);

        // tags add
        asset.on('tags:insert', function(tag) {
            app.assets.get(asset.get('id')).tags.add(tag);
        });
        // tags remove
        asset.on('tags:remove', function(tag) {
            app.assets.get(asset.get('id')).tags.remove(tag);
        });
    };

    // after all initial assets are loaded...
    editor.on('assets:load', function () {
        var assets = editor.call('assets:list');
        assets.forEach(attachSetHandler);

        // add assets to asset registry
        editor.on('assets:add', function (asset) {
            // do only for target assets
            if (asset.get('source'))
                return;

            // raw json data
            var assetJson = asset.json();

            // engine data
            var data = {
                id: parseInt(assetJson.id, 10),
                name: assetJson.name,
                tags: assetJson.tags,
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

            // create and add to registry
            var newAsset = new pc.Asset(data.name, data.type, data.file, data.data);
            newAsset.id = parseInt(assetJson.id, 10);
            app.assets.add(newAsset);
            // tags
            newAsset.tags.add(data.tags);

            attachSetHandler(asset);
        });

        // remove assets from asset registry
        editor.on('assets:remove', function (asset) {
            var realtimeAsset = app.assets.get(asset.get('id'));
            if (realtimeAsset)
                app.assets.remove(realtimeAsset);
        });
    });
});
