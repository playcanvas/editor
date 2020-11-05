editor.once('load', function () {

    var app = null;

    editor.once('viewport:load', function() {
        app = editor.call('viewport:app');
    });

    function generatePrefilteredLighting(cubemap) {
        var device = cubemap.device;

        // read the pixel data of the given texture face
        var readPixels = function (texture, face) {
            var rt = new pc.RenderTarget({ colorBuffer: texture, depth: false, face: face });
            var data = new Uint8ClampedArray(texture.width * texture.height * 4);
            var device = texture.device;
            device.setFramebuffer(rt._glFrameBuffer);
            device.initRenderTarget(rt);
            device.gl.readPixels(0, 0, texture.width, texture.height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, data);
            return data;
        };

        var i;
        var cubemaps = [];

        cubemap.minFilter = pc.FILTER_LINEAR;
        cubemap.magFilter = pc.FILTER_LINEAR;

        // generate prefiltered lighting data
        var sizes = [128, 64, 32, 16, 8, 4, 2, 1];
        var specPower = [undefined, 512, 128, 32, 8, 2, 1, 1];
        for (i = 0; i < sizes.length; ++i) {
            var level = new pc.Texture(device, {
                cubemap: true,
                name: 'skyboxPrefilter' + i,
                width: sizes[i],
                height: sizes[i],
                type: cubemap.type,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                fixCubemapSeams: true,
                mipmaps: false
            });
            pc.reprojectTexture(device, cubemaps[0] || cubemap, level, specPower[i], 8192);
            cubemaps.push(level);
        }

        // download texture from GPU
        var levels = [];
        for (i = 0; i < cubemaps.length; ++i) {
            levels[i] = [];
            for (var face = 0; face < 6; ++face) {
                levels[i].push(readPixels(cubemaps[i], face));
            }
        }

        return new pc.Texture(device, {
            cubemap: true,
            name: 'filteredCubemap',
            width: 128,
            height: 128,
            type: cubemap.type,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE,
            addressV: pc.ADDRESS_CLAMP_TO_EDGE,
            fixCubemapSeams: true,
            levels: levels
        });
    }

    editor.method('assets:cubemaps:prefilter', function (assetCubeMap, callback) {
        if (!app) {
            // webgl not available
            callback(new Error('webgl not available'));
            return;
        }

        var onLoad = function(cubemap) {
            var blob = new Blob([ generatePrefilteredLighting(cubemap).getDds() ], { type: 'image/dds' });

            // upload blob as dds
            editor.call('assets:uploadFile', {
                file: blob,
                name: assetCubeMap.get('name') + '.dds',
                asset: assetCubeMap,
                type: 'cubemap'
            }, function (err, data) {
                if (callback)
                    callback(err, data);
            });

            assetCubeMap.set('data.rgbm', cubemap.type === pc.TEXTURETYPE_RGBM ? true : false);
        };

        var asset = app.assets.get(parseInt(assetCubeMap.get('id'), 10));
        if (asset) {
            if (asset.resource) {
                onLoad(asset.resource);
            } else {
                asset.once('load', function(asset) {
                    onLoad(asset.resource);
                });
                app.assets.load(asset);
            }
        }
    });

    // invalidate prefiltering data on cubemaps
    // when one of face textures file is changed
    editor.on('assets:add', function(asset) {
        if (asset.get('type') !== 'cubemap')
            return;

        asset._textures = [ ];

        var invalidate = function() {
            if (! asset.get('file'))
                return;

            // TODO: do not set the file here but use the asset server
            asset.set('file', null);
        };

        var watchTexture = function(ind, id) {
            if (asset._textures[ind])
                asset._textures[ind].unbind();

            asset._textures[ind] = null;

            if (! id)
                return;

            var texture = editor.call('assets:get', id);
            if (texture)
                asset._textures[ind] = texture.on('file.hash:set', invalidate);
        };

        var watchFace = function(ind) {
            // update watching on face change
            asset.on('data.textures.' + ind + ':set', function(id) {
                watchTexture(ind, id);
            });
            // start watching
            watchTexture(ind, asset.get('data.textures.' + ind));
        };

        for(var i = 0; i < 6; i++)
            watchFace(i);
    });
});
