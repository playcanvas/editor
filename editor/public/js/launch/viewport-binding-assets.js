editor.once('load', function() {
    'use strict';

    editor.on('tools:viewport:ready', function() {

        var app = editor.call('viewport:app');
        if (! app) return; // webgl not available

        var regexFrameUpdate = /^data\.frames\.(\d+)/;
        var regexFrameRemove = /^data\.frames\.(\d+)$/;
        var regexI18n = /^i18n\.[^\.]+?$/;

        var attachSetHandler = function (asset) {
            // do only for target assets
            if (asset.get('source'))
                return;

            var timeout;
            var updatedFields = { };

            var onChange = function(path, value) {
                var realtimeAsset = app.assets.get(asset.get('id'));
                var parts = path.split('.');

                updatedFields[parts[0]] = true;
                if (timeout)
                    clearTimeout(timeout);

                // do the update in a timeout to avoid rapid
                // updates to the same fields
                timeout = setTimeout(function () {
                    for (var key in updatedFields) {
                        var raw = asset.get(key);

                        // do not hot-reload script if it has no `swap` methods already defined
                        if (key === 'file' && asset.get('type') === 'script' && realtimeAsset.data && realtimeAsset.data.scripts) {
                            var swappable = false;

                            for(var script in realtimeAsset.data.scripts) {
                                var scriptType = app.scripts.get(script);
                                if (scriptType && scriptType.prototype.hasOwnProperty('swap')) {
                                    swappable = true;
                                    break;
                                }
                            }

                            if (! swappable)
                                continue;
                        }

                        // this will trigger the 'update' event on the asset in the engine
                        // handling all resource loading automatically
                        realtimeAsset[key] = raw;
                    }

                    timeout = null;
                });
            };

            // attach update handler
            asset.on('*:set', function (path, value) {
                // handle i18n changes
                if (regexI18n.test(path)) {
                    var parts = path.split('.');
                    var realtimeAsset = app.assets.get(asset.get('id'));
                    if (realtimeAsset) {
                        realtimeAsset.addLocalizedAssetId(parts[1], value);
                    }
                } else if (asset.get('type') === 'textureatlas') {
                    // handle texture atlases specifically for better performance
                    var realtimeAsset = app.assets.get(asset.get('id'));
                    if (! realtimeAsset) return;

                    var match = path.match(regexFrameUpdate);
                    if (match) {
                        var frameKey = match[1];
                        var frame = asset.get('data.frames.' + frameKey);
                        if (realtimeAsset.resource) {
                            if (frame) {
                                realtimeAsset.resource.setFrame(frameKey, {
                                    rect: new pc.Vec4(frame.rect),
                                    pivot: new pc.Vec2(frame.pivot),
                                    border: new pc.Vec4(frame.border)
                                });
                            }
                        }

                        if (! realtimeAsset.data.frames) {
                            realtimeAsset.data.frames = {};
                        }

                        realtimeAsset.data.frames[frameKey] = frame;
                    }
                } else {
                    // everything else
                    onChange(path, value);
                }
            });
            asset.on('*:unset', function (path, value) {
                // handle deleting i18n
                if (regexI18n.test(path)) {
                    var realtimeAsset = app.assets.get(asset.get('id'));
                    if (realtimeAsset) {
                        var parts = path.split('.');
                        realtimeAsset.removeLocalizedAssetId(parts[1]);
                    }

                } else if (asset.get('type') === 'textureatlas') {
                    // handle deleting frames from texture atlas
                    var realtimeAsset = app.assets.get(asset.get('id'));
                    if (! realtimeAsset) return;

                    var match = path.match(regexFrameRemove);
                    if (match) {
                        var frameKey = match[1];
                        if (realtimeAsset.resource) {
                            realtimeAsset.resource.removeFrame(frameKey);
                        }

                        if (realtimeAsset.data.frames && realtimeAsset.data.frames[frameKey]) {
                            delete realtimeAsset.data.frames[frameKey];
                        }

                        editor.call('viewport:render');
                    }
                } else {
                    // everything else
                    onChange(path, value);
                }

            });

            // handle changing sprite frame keys
            if (asset.get('type') === 'sprite') {
                var onFrameKeys = function () {
                    var realtimeAsset = app.assets.get(asset.get('id'));
                    if (realtimeAsset) {
                        if (realtimeAsset.resource) {
                            realtimeAsset.resource.frameKeys = asset.get('data.frameKeys');
                        }

                        realtimeAsset.data.frameKeys = asset.get('data.frameKeys');
                    }
                };

                asset.on('data.frameKeys:set', onFrameKeys);
                asset.on('data.frameKeys:insert', onFrameKeys);
                asset.on('data.frameKeys:remove', onFrameKeys);
                asset.on('data.frameKeys:move', onFrameKeys);
            }

            // tags add
            asset.on('tags:insert', function(tag) {
                app.assets.get(asset.get('id')).tags.add(tag);
            });
            // tags remove
            asset.on('tags:remove', function(tag) {
                app.assets.get(asset.get('id')).tags.remove(tag);
            });
        };

        // after all initial assets are loaded...
        editor.on('assets:load', function () {
            var assets = editor.call('assets:list');
            assets.forEach(attachSetHandler);

            // add assets to asset registry
            editor.on('assets:add', function (asset) {
                // do only for target assets
                if (asset.get('source'))
                    return;

                // raw json data
                var assetJson = asset.json();

                // engine data
                var data = {
                    id: parseInt(assetJson.id, 10),
                    name: assetJson.name,
                    tags: assetJson.tags,
                    file: assetJson.file ? {
                        filename: assetJson.file.filename,
                        url: assetJson.file.url,
                        hash: assetJson.file.hash,
                        size: assetJson.file.size,
                        variants: assetJson.file.variants || null
                    } : null,
                    data: assetJson.data,
                    type: assetJson.type
                };

                // create and add to registry
                var newAsset = new pc.Asset(data.name, data.type, data.file, data.data);
                newAsset.id = parseInt(assetJson.id, 10);
                app.assets.add(newAsset);

                // tags
                newAsset.tags.add(data.tags);

                // i18n
                if (assetJson.i18n) {
                    for (var locale in assetJson.i18n) {
                        newAsset.addLocalizedAssetId(locale, assetJson.i18n[locale]);
                    }
                }

                attachSetHandler(asset);
            });

            // remove assets from asset registry
            editor.on('assets:remove', function (asset) {
                var realtimeAsset = app.assets.get(asset.get('id'));
                if (realtimeAsset)
                    app.assets.remove(realtimeAsset);
            });
        });
    });
});
