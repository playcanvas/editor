editor.once('load', function() {
    'use strict';

    var migrateAsset = function(asset) {
        asset.history.enabled = false;

        if (asset.get('type') === 'material' && asset.get('data')) {
            if (! asset.has('data.useFog'))
                asset.set('data.useFog', true);

            if (! asset.has('data.useLighting'))
                asset.set('data.useLighting', true);

            if (! asset.has('data.useSkybox'))
                asset.set('data.useSkybox', true);

            if (! asset.has('data.useGammaTonemap'))
                asset.set('data.useGammaTonemap', true);

            if (! asset.get('data.cubeMapProjectionBox'))
                asset.set('data.cubeMapProjectionBox', { center: [ 0, 0, 0 ], halfExtents: [ 0.5, 0.5, 0.5 ] });
        }

        if (asset.get('type') === 'texture' && asset.get('meta') && ! asset.get('source')) {
            if (! asset.has('meta.compress')) {
                var alpha = asset.get('meta.alpha') || (asset.get('meta.type').toLowerCase() || '') === 'truecoloralpha' || false;

                asset.set('meta.compress', {
                    alpha: alpha,
                    dxt: false,
                    pvr: false,
                    pvrBpp: 4
                });
            } else {
                if (! asset.has('meta.compress.pvr'))
                    asset.set('meta.compress.pvr', false);

                if (! asset.has('meta.compress.pvrBpp'))
                    asset.set('meta.compress.pvrBpp', 4);
            }
        }

        asset.history.enabled = true;
    };

    editor.on('assets:add', migrateAsset);
    editor.call('assets:list').forEach(migrateAsset);
});
