editor.once('load', function() {
    'use strict';

    editor.method('assets:textureToAtlas', function (asset, callback) {
        if (asset.get('type') !== 'texture' || asset.get('source')) return;

        Ajax({
            url: '/api/assets/' + asset.get('id') + '/duplicate',
            method: 'POST',
            auth: true,
            data: {
                type: 'textureatlas'
            },
            headers: {
                Accept: 'application/json'
            }
        })
        .on('load', function (status, res) {
            if (callback) {
                callback(null, res.id);
            }
        })
        .on('error', function (status, res) {
            if (callback) {
                callback(status);
            } else {
                console.error('error', status, res);
            }
        });
    });
});
