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

            if (! asset.has('data.alphaToCoverage'))
                asset.set('data.alphaToCoverage', false);

            if (! asset.has('data.opacityFadesSpecular'))
                asset.set('data.opacityFadesSpecular', true);

            if (! asset.has('data.enableGGXSpecular'))
                asset.set('data.enableGGXSpecular', false);

            if (! asset.has('data.clearCoat'))
                asset.set('data.clearCoat', 0.0);                
        }

        if ((asset.get('type') === 'texture' || asset.get('type') === 'textureatlas') && ! asset.get('source')) {
            if (asset.get('meta')) {
                if (! asset.has('meta.compress')) {
                    var alpha = asset.get('meta.alpha');
                    if (!alpha) {
                        var metaType = asset.get('meta.type');
                        if ((metaType && metaType.toLowerCase() || '') === 'truecoloralpha') {
                            alpha = true;
                        }
                    }

                    asset.set('meta.compress', {
                        alpha: alpha || false,
                        normals: false,
                        dxt: false,
                        pvr: false,
                        pvrBpp: 4,
                        etc1: false,
                        etc2: false,
                        basis: false,
                        quality: 128,
                        compressionMode: 'etc'
                    });
                } else {
                    if (! asset.has('meta.compress.normals'))
                        asset.set('meta.compress.normals', false);

                    if (! asset.has('meta.compress.pvr'))
                        asset.set('meta.compress.pvr', false);

                    if (! asset.has('meta.compress.pvrBpp'))
                        asset.set('meta.compress.pvrBpp', 4);

                    if (! asset.has('meta.compress.etc1'))
                        asset.set('meta.compress.etc1', false);

                    if (! asset.has('meta.compress.etc2'))
                        asset.set('meta.compress.etc2', false);

                    if (! asset.has('meta.compress.basis'))
                        asset.set('meta.compress.basis', false);

                    if (! asset.has('meta.compress.quality'))
                        asset.set('meta.compress.quality', 128);

                    if (! asset.has('meta.compress.compressionMode'))
                        asset.set('meta.compress.compressionMode', 'etc');
                }
            }
            if (asset.get('data')) {
                if (! asset.has('data.mipmaps'))
                    asset.set('data.mipmaps', true);
            }
        }

        if (asset.get('type') === 'font' && !asset.get('source')) {
            if (asset.get('data') && !asset.has('data.intensity')) {
                asset.set('data.intensity', 0.0);
            }
        }

        if (!asset.has('i18n')) {
            asset.set('i18n', {});
        }

        if (asset.get('type') === 'script') {
            if (asset.get('data') && !asset.has('data.loadingType')) {
                asset.set('data.loadingType', LOAD_SCRIPT_AS_ASSET);
            }
        }

        asset.history.enabled = true;
    };

    editor.on('assets:add', migrateAsset);
    editor.call('assets:list').forEach(migrateAsset);
});
