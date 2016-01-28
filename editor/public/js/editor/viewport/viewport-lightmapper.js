editor.once('load', function() {
    'use strict';

    if (! config.owner.superUser)
        return;

    var app = editor.call('viewport:framework');
    var uv1MissingAssets = { };


    // bake
    editor.method('lightmapper:bake', function() {
        var entities = editor.call('entities:list').filter(function(e) {
            return e.get('components.model.lightmapped');
        });

        uv1MissingAssets = { };
        var areaJobs = { };
        var jobs = 0;

        var readyForBake = function() {
            app.lightmapper.bake();
            editor.call('viewport:render');
        };

        // validate lightmapped entities
        for(var i = 0; i < entities.length; i++) {
            var obj = entities[i];

            // might be primitive
            if (obj.get('components.model.type') !== 'asset')
                continue;

            // might have no model asset attached
            var assetId = obj.get('components.model.asset');
            if (! assetId)
                continue;

            // model asset might be missing
            var asset = editor.call('assets:get', assetId);
            if (! asset)
                continue;

            // check if asset has uv1
            var uv1 = asset.has('meta.attributes.texCoord1');
            if (! uv1) {
                // uv1 might be missing
                if (! uv1MissingAssets[assetId])
                    uv1MissingAssets[assetId] = asset;
                continue;
            }

            // check if asset has area
            var area = asset.get('data.area');
            if (! area && ! areaJobs[assetId]) {
                // if area not available
                // recalculate area
                areaJobs[assetId] = asset;
                jobs++;
                editor.call('assets:model:area', asset, function() {
                    jobs--;

                    if (jobs === 0)
                        readyForBake();
                });
            }
        }

        editor.call('lightmapper:uv1missing', uv1MissingAssets);

        if (jobs === 0)
            readyForBake();
    });
});
