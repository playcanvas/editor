editor.once('load', function() {
    'use strict';

    if (! config.owner.superUser)
        return;

    var app = editor.call('viewport:framework');


    // track entities model assets loading state to re-bake
    var entityAssetLoading = { };
    var rebakeEntity = function(entity) {
        var receive = entity.get('components.model.lightmapped');
        if (! receive)
            return;

        var assetId = entity.get('components.model.asset');
        if (! assetId)
            return;

        var asset = app.assets.get(parseInt(assetId, 10));
        if (! asset || ! asset.resource) {
            var loading = entityAssetLoading[entity.get('resource_id')];
            if (loading) {
                if (loading.assetId === assetId)
                    return;

                app.assets.off('load:' + loading.assetId, loading.fn);
                delete entityAssetLoading[entity.get('resource_id')];
            }

            loading = {
                assetId: assetId,
                fn: function(asset) {
                    delete entityAssetLoading[entity.get('resource_id')];

                    if (asset.id !== parseInt(entity.get('components.model.asset'), 10))
                        return;

                    rebakeEntity(entity);
                }
            };
            app.assets.once('load:' + assetId, loading.fn);
            return;
        }

        setTimeout(function() {
            // TODO
            // trigger entity re-baking
            console.log("rebake");
        }, 0);
    };

    editor.once('viewport:load', function() {
        app = editor.call('viewport:framework');

        // bake once all assets are loaded on first time-load
        var loadingAssets = { };
        var onLoadStart = function(asset) {
            loadingAssets[asset.id] = true;
            asset.once('load', function() {
                delete loadingAssets[asset.id];

                if (Object.keys(loadingAssets).length === 0) {
                    app.assets.off('load:start', onLoadStart);
                    editor.once('viewport:update', function() {
                        // TODO
                        //editor.call('lightmapper:bake');
                    });
                }
            });
        };
        app.assets.on('load:start', onLoadStart);

        // re-bake on scene switches
        editor.on('scene:load', function() {
            // needs to wait 3 frames
            // before it is safe to re-bake
            // don't ask why :D
            editor.once('viewport:update', function() {
                editor.once('viewport:update', function() {
                    editor.once('viewport:update', function() {
                        // TODO
                        //editor.call('lightmapper:bake');
                    });
                });
            });
        });
    });

    editor.on('entities:add', function(entity) {
        var fields = [ 'type', 'asset', 'lightmapped', 'castShadowsLightmap', 'receiveShadows', 'lightmapSizeMultiplier' ];
        var rabake = function() { rebakeEntity(entity); };

        for(var i = 0; i < fields.length; i++)
            entity.on('components.model.' + fields[i] + ':set', rabake);
    });
});
