editor.once('load', function () {

    var app = null;

    editor.once('viewport:load', function() {
        app = editor.call('viewport:framework');
    });

    // var device = editor.call('preview:device');
    // var assets = editor.call('preview:assetRegistry');

    var getTextureAssets = function (assetCubeMap) {
        var result = [];
        var textures = assetCubeMap.get('data.textures');
        for (var i = 0; i < textures.length; i++) {
            var id = textures[i];
            if (parseInt(id) >= 0) {
                var texture = editor.call('assets:get', id);
                if (!texture) {
                    return null;
                }

                result.push(texture);
            } else {
                return null;
            }
        }

        return result;
    };

    var prefilterHdrCubemap = function (assetCubeMap, cubemap, callback) {
        try {
            var textureAssets = getTextureAssets(assetCubeMap);
            if (textureAssets) {
                var l = textureAssets.length;
                var count = l;
                var textures = [];

                var onLoad = function () {
                    editor.call('status:job', 'prefilter');

                    cubemap = new pc.Texture(app.graphicsDevice, {
                        cubemap: true,
                        rgbm: false,
                        fixCubemapSeams: true,
                        format: textures[0].format,
                        width: textures[0].width,
                        height: textures[0].height
                    });

                    cubemap.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
                    cubemap.addressV = pc.ADDRESS_CLAMP_TO_EDGE;

                    cubemap._levels[0] = [ textures[0]._levels[0],
                                           textures[1]._levels[0],
                                           textures[2]._levels[0],
                                           textures[3]._levels[0],
                                           textures[4]._levels[0],
                                           textures[5]._levels[0] ];

                    // prefilter cubemap
                    var options = {
                        device: app.graphicsDevice,
                        sourceCubemap: cubemap,
                        method: 1,
                        samples: 4096,
                        cpuSync: true,
                        filteredFixed: [],
                        filteredFixedRgbm: [],
                        singleFilteredFixedRgbm: true
                    };

                    pc.prefilterCubemap(options);

                    // get dds and create blob
                    var dds = options.singleFilteredFixedRgbm.getDds();
                    var blob = new Blob([dds], {type: 'image/dds'});

                    // upload blob as dds
                    editor.call('assets:uploadFile', {
                        file: blob,
                        name: assetCubeMap.get('name') + '.dds',
                        asset: assetCubeMap,
                        type: 'cubemap'
                    }, function (err, data) {
                        if (!err) {
                            callback();
                        } else {
                            editor.call('status:job', 'prefilter');
                            callback(err);
                        }
                    });
                };

                textureAssets.forEach(function (asset, index) {
                    editor.call('status:job', 'prefilter', index);

                    var url = asset.get('file.url').replace(/.png$/, '.dds');

                    app.assets._loader.load(url, "texture", function (err, resource) {
                        if (!err) {
                            textures[index] = resource;
                        } else {
                            console.warn(err);
                        }

                        count--;
                        if (count === 0) {
                            onLoad();
                        }
                    });
                });
            }
        }
        catch (ex) {
            callback(ex);
        }
    };

    var prefilterCubemap = function (assetCubeMap, cubemap, callback) {
        try {
            var count = 0;
            var textures = [ ];
            var texturesAssets = [ ];
            var textureIds = assetCubeMap.get('data.textures');

            for(var i = 0; i < 6; i++) {
                // missing texture
                if (! textureIds[i])
                    return;

                texturesAssets[i] = editor.call('assets:get', textureIds[i]);

                // texture is not in registry
                if (! texturesAssets[i])
                    return;
            }

            var texturesReady = function() {
                editor.call('status:job', 'prefilter');

                var options = {
                    device: app.graphicsDevice,
                    sourceCubemap: cubemap,
                    method: 1,
                    samples: 4096,
                    cpuSync: true,
                    filteredFixed: [ ],
                    singleFilteredFixed: true
                };

                pc.prefilterCubemap(options);

                var dds = options.singleFilteredFixed.getDds();
                var blob = new Blob([ dds ], { type: 'image/dds' });

                // upload blob as dds
                editor.call('assets:uploadFile', {
                    file: blob,
                    name: assetCubeMap.get('name') + '.dds',
                    asset: assetCubeMap,
                    type: 'cubemap'
                }, function (err, data) {
                    if (callback)
                        callback(null);
                });
            };

            var textureLoad = function(ind, url) {
                editor.call('status:job', 'prefilter', ind);

                app.assets._loader.load(url, 'texture', function (err, resource) {
                    if (err)
                        console.warn(err);

                    textures[ind] = resource;

                    count++;
                    if (count === 6)
                        texturesReady();
                });
            };

            for(var i = 0; i < 6; i++)
                textureLoad(i, texturesAssets[i].get('file.url'))
        } catch (ex) {
            if (callback)
                callback(ex);
        }
    };

    editor.method('assets:cubemaps:prefilter', function (assetCubeMap, callback) {
        var asset = app.assets.get(parseInt(assetCubeMap.get('id'), 10));
        if (! asset)
            return;

        var cubemap;
        var onLoad = function() {
            if (app.graphicsDevice.extTextureFloatRenderable && cubemap.rgbm) {
                prefilterHdrCubemap(assetCubeMap, cubemap, callback);
            } else {
                prefilterCubemap(assetCubeMap, cubemap, callback);
            }
        };

        if (asset.resource) {
            cubemap = asset.resource;
            onLoad();
        } else {
            asset.once('load', function(asset) {
                cubemap = asset.resource;
                onLoad();
            });
            app.assets.load(asset);
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
