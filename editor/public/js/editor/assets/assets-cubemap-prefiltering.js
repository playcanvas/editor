editor.once('load', function () {

    var device = editor.call('preview:device');
    var assets = editor.call('preview:assetRegistry');

    var getTextureAssets = function (cubemapAsset) {
        var result = [];
        var textures = cubemapAsset.get('data.textures');
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

    var prefilterHdrCubemap = function (cubemapAsset, cubemap, callback) {
        try {
            var textureAssets = getTextureAssets(cubemapAsset);
            if (textureAssets) {

                var l = textureAssets.length;
                var count = l;
                var textures = [];

                var onLoad = function () {
                    editor.call('status:job', 'prefilter');

                    cubemap = new pc.Texture(device, {
                        cubemap: true,
                        rgbm: false,
                        fixCubemapSeams: true,
                        format: textures[0].format,
                        width: textures[0].width,
                        height: textures[0].height
                    });

                    cubemap._levels[0] = [ textures[0]._levels[0],
                                           textures[1]._levels[0],
                                           textures[2]._levels[0],
                                           textures[3]._levels[0],
                                           textures[4]._levels[0],
                                           textures[5]._levels[0] ];

                    // prefilter cubemap
                    var options = {
                        device: device,
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
                    editor.call('assets:uploadFile', blob, cubemapAsset.get('name') + '.dds', cubemapAsset, function (err, data) {
                        if (!err) {
                            callback();
                        } else {
                            editor.call('status:job', 'prefilter');

                            // HACK: (remove this with new resource loader)
                            // If there is an error the dds requests are kept in the
                            // resource loader cache so manually remove them.
                            // requests.forEach(function (r) {
                            //     delete assets.loader._requests[r.canonical];
                            // });

                            callback(err);
                        }
                    });
                };

                textureAssets.forEach(function (asset, index) {
                    editor.call('status:job', 'prefilter', index);

                    var url = asset.get('file.url').replace(/.png$/, '.dds');

                    assets._loader.load(url, "texture", function (err, resource) {
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
                // var requests = textureAssets.map(function (asset) {
                //     var url = asset.get('file.url').replace(/.png$/, '.dds');
                //     return new pc.resources.TextureRequest(url);
                // });

                // editor.call('status:job', 'prefilter', 1);

                // assets.loader.request(requests).then(function (resources) {
                //     editor.call('status:job', 'prefilter');

                //     cubemap = new pc.Texture(device, {
                //         cubemap: true,
                //         rgbm: false,
                //         fixCubemapSeams: true,
                //         format: resources[0].format,
                //         width: resources[0].width,
                //         height: resources[0].height
                //     });

                //     cubemap._levels[0] = [ resources[0]._levels[0],
                //                            resources[1]._levels[0],
                //                            resources[2]._levels[0],
                //                            resources[3]._levels[0],
                //                            resources[4]._levels[0],
                //                            resources[5]._levels[0] ];

                //     // prefilter cubemap
                //     var options = {
                //         device: device,
                //         sourceCubemap: cubemap,
                //         method: 1,
                //         samples: 4096,
                //         cpuSync: true,
                //         filteredFixed: [],
                //         filteredFixedRgbm: [],
                //         singleFilteredFixedRgbm: true
                //     };

                //     pc.prefilterCubemap(options);

                //     // get dds and create blob
                //     var dds = options.singleFilteredFixedRgbm.getDds();
                //     var blob = new Blob([dds], {type: 'image/dds'});

                //     // upload blob as dds
                //     editor.call('assets:uploadFile', blob, cubemapAsset.get('name') + '.dds', cubemapAsset, function (err, data) {
                //         if (!err) {
                //             callback();
                //         } else {
                //             editor.call('status:job', 'prefilter');

                //             // HACK: (remove this with new resource loader)
                //             // If there is an error the dds requests are kept in the
                //             // resource loader cache so manually remove them.
                //             requests.forEach(function (r) {
                //                 delete assets.loader._requests[r.canonical];
                //             });

                //             callback(err);
                //         }
                //     });
                // });
            }
        }
        catch (ex) {
            callback(ex);
        }
    };

    var prefilterCubemap = function (cubemapAsset, cubemap, callback) {
        try {
            var options = {
                device: device,
                sourceCubemap: cubemap,
                method: 1,
                samples: 4096,
                cpuSync: true,
                filteredFixed: [],
                singleFilteredFixed: true
            };

            pc.prefilterCubemap(options);

            // get dds and create blob
            var dds = options.singleFilteredFixed.getDds();
            var blob = new Blob([dds], {type: 'image/dds'});

            // upload blob as dds
            editor.call('assets:uploadFile', blob, cubemapAsset.get('name') + '.dds', cubemapAsset, function (err, data) {
                if (callback) {
                    callback(null);
                }
            });
        } catch (ex) {
            if (callback) {
                callback(ex);
            }
        }
    };

    editor.method('assets:cubemaps:prefilter', function (cubemapAsset, callback) {
        var realtimeAsset = assets.get(cubemapAsset.get('id'));
        if (!realtimeAsset) return;

        // load cubemap asset
        var cubemap;

        realtimeAsset.ready(function (asset) {
            cubemap = asset.resources[0];
            onLoad();
        });
        assets.load(realtimeAsset);

        // if (!realtimeAsset.resource) {
        //     assets.load(realtimeAsset).then(function (resources) {
        //         cubemap = resources[0][0];
        //         onLoad();
        //     }, function (error) {
        //         error('Could not load cubemap');
        //     });
        // } else {
        //     cubemap = realtimeAsset.resource;
        //     onLoad();
        // }

        function onLoad() {
            if (device.extTextureFloatRenderable && cubemapAsset.get('data.rgbm')) {
                prefilterHdrCubemap(cubemapAsset, cubemap, callback);
            } else {
                prefilterCubemap(cubemapAsset, cubemap, callback);
            }
        }

    });

});
