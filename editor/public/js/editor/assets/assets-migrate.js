editor.once('load', function() {
    'use strict';

    editor.on('assets:add', function(asset) {
        asset.history.enabled = false;

        if (asset.get('type') === 'material') {
            if (! asset.has('data.useFog'))
                asset.set('data.useFog', true);

            if (! asset.has('data.useLighting'))
                asset.set('data.useLighting', true);

            if (! asset.has('data.useSkybox'))
                asset.set('data.useSkybox', true);

            if (! asset.has('data.useGammaTonemap'))
                asset.set('data.useGammaTonemap', true);
        }

        asset.history.enabled = true;
    });
});
