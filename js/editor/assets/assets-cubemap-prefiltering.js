editor.once('load', function () {

    var app = null;

    editor.once('viewport:load', function () {
        app = editor.call('viewport:app');
    });

    function generatePrefilteredLighting(cubemap, legacyPhong) {
        var device = cubemap.device;

        // read the pixel data of the given texture face
        var readPixels = function (texture, face) {
            var rt = new pc.RenderTarget({
                name: 'ReadPrefilteredCubemapRT',
                colorBuffer: texture,
                depth: false,
                face: face
            });
            var data = new Uint8ClampedArray(texture.width * texture.height * 4);
            var device = texture.device;
            device.setFramebuffer(rt.impl._glFrameBuffer);
            device.initRenderTarget(rt);
            device.gl.readPixels(0, 0, texture.width, texture.height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, data);
            return data;
        };

        // generate a 128x128 cubemap with mipmaps to act as lighting source
        var lightingSource = pc.EnvLighting.generateLightingSource(cubemap);

        // generate prefiltered lighting data
        var specPower = [undefined, 512, 128, 32, 8, 2, 1, 1];
        var levels = [];
        for (var i = 0; i < specPower.length; ++i) {
            var level = new pc.Texture(device, {
                cubemap: true,
                name: 'skyboxPrefilter' + i,
                width: 128 >> i,
                height: 128 >> i,
                type: cubemap.type,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                fixCubemapSeams: true,
                mipmaps: false
            });

            pc.reprojectTexture(lightingSource, level, {
                distribution: i === 0 ? 'none' : (legacyPhong ? 'phong' : 'ggx'),
                specularPower: specPower[i],
                numSamples: i === 0 ? 1 : (legacyPhong ? 8192 : 2048)
            });

            // download level from GPU
            levels[i] = [];
            for (var face = 0; face < 6; ++face) {
                levels[i].push(readPixels(level, face));
            }

            level.destroy();
        }

        lightingSource.destroy();

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

    editor.method('assets:cubemaps:prefilter', function (assetCubeMap, legacyPhong, callback) {
        if (!app) {
            // webgl not available
            callback(new Error('webgl not available'));
            return;
        }

        var onLoad = function (cubemap) {
            var blob = new Blob([generatePrefilteredLighting(cubemap, legacyPhong).getDds()], { type: 'image/dds' });

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

            assetCubeMap.set('data.rgbm', cubemap.type === pc.TEXTURETYPE_RGBM);
        };

        var asset = app.assets.get(parseInt(assetCubeMap.get('id'), 10));
        if (asset) {
            if (asset.resource) {
                onLoad(asset.resource);
            } else {
                asset.once('load', function (asset) {
                    onLoad(asset.resource);
                });
                app.assets.load(asset);
            }
        }
    });

    // invalidate prefiltering data on cubemaps
    // when one of face textures file is changed
    editor.on('assets:add', function (asset) {
        if (asset.get('type') !== 'cubemap')
            return;

        asset._textures = [];

        var invalidate = function () {
            if (!asset.get('file'))
                return;

            // TODO: do not set the file here but use the asset server
            asset.set('file', null);
        };

        var watchTexture = function (ind, id) {
            if (asset._textures[ind])
                asset._textures[ind].unbind();

            asset._textures[ind] = null;

            if (!id)
                return;

            var texture = editor.call('assets:get', id);
            if (texture) {
                const fileSet = texture.get('file');
                asset._textures[ind] = texture.on('file.hash:set', () => {
                    // react only to file changes
                    if (fileSet) {
                        invalidate();
                    }
                });
            }
        };

        var watchFace = function (ind) {
            // update watching on face change
            asset.on('data.textures.' + ind + ':set', function (id) {
                watchTexture(ind, id);
            });
            // start watching
            watchTexture(ind, asset.get('data.textures.' + ind));
        };

        for (let i = 0; i < 6; i++)
            watchFace(i);
    });
});
