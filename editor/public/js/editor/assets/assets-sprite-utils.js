editor.once('load', function() {
    'use strict';

    // Creates new texture atlas asset from texture asset
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

    // Creates new Sprite Asset from Texture Atlas Asset
    editor.method('assets:atlasToSprite', function (args) {
        var asset = args && args.asset;
        if (! asset || asset.get('type') !== 'textureatlas' || asset.get('source')) return;

        var sliced = args && args.sliced;

        // create a frame that covers the full atlas unless such a frame already exists
        var frames = asset.getRaw('data.frames')._data;
        var count = Object.keys(frames).length;
        var frame = null;

        var width = asset.get('meta.width') || 1;
        var height = asset.get('meta.height') || 1;

        if (count) {
            for (var key in frames) {
                // search for existing frame that covers the entire atlas
                if (frames[key]._data.rect[0] <= 0 &&
                    frames[key]._data.rect[1] <= 0 &&
                    frames[key]._data.rect[2] >= width &&
                    frames[key]._data.rect[3] >= height) {

                    frame = key;
                    break;
                }
            }
        }

        if (frame === null) {
            var maxKey = 1;
            for (var key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            frame = maxKey;

            // default border to 10% of dimensions if sliced otherwise set to 0
            var horBorder = sliced ? Math.floor(0.1 * Math.max(width, height)) || 0 : 0;
            var verBorder = sliced ? Math.floor(0.1 * Math.max(width, height)) || 0 : 0;

            var history = asset.history.enabled;
            asset.history.enabled = false;
            asset.set('data.frames.' + maxKey, {
                name: 'Frame ' + maxKey,
                rect: [0, 0, width, height],
                pivot: [0.5, 0.5],
                border: [horBorder,verBorder,horBorder,verBorder]
            });
            asset.history.enabled = history;
        }

        // rendermode: 1 - sliced, 0 - simple
        var renderMode = sliced ? 1 : 0;
        // default ppu to 1 if we're using sliced mode otherwise default to
        // 100 which is better for world-space sprites
        var ppu = sliced ? 1 : 100;

        // get atlas asset name without extension
        var name = asset.get('name');
        var lastDot = name.lastIndexOf('.');
        if (lastDot > 0) {
            name = name.substring(0, lastDot);
        }

        editor.call('assets:create:sprite', {
            name: name,
            pixelsPerUnit: ppu,
            renderMode: renderMode,
            frameKeys: [frame],
            textureAtlasAsset: asset.get('id'),
            fn: args && args.callback
        });
    });

});
