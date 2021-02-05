editor.once('load', function () {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var watching = { };

    var subscribe = function (watch) {
        var onChange = function () {
            trigger(watch);
        };

        var currentAtlas = null;

        var watchAtlas = function () {
            var atlas = watch.asset.get('data.textureAtlasAsset');
            currentAtlas = atlas;
            if (! atlas) return;

            var atlasAsset = editor.call('assets:get', atlas);
            if (atlasAsset) {
                var engineAtlas = app.assets.get(atlas);
                engineAtlas.on('change', onChange);
                watch.events.onAtlasChange = onChange;

                var onAtlasLoad = function () {
                    if (engineAtlas.resource) {
                        engineAtlas.resource.off('set:frame', onChange);
                        engineAtlas.resource.on('set:frame', onChange);

                        engineAtlas.resource.off('set:frames', onChange);
                        engineAtlas.resource.on('set:frames', onChange);
                    }

                    onChange();
                };

                engineAtlas.on('load', onAtlasLoad);
                watch.events.onAtlasLoad = onAtlasLoad;

                watch.events.onAtlasRemove = atlasAsset.once('destroy', function () {
                    unwatchAtlas(watch, currentAtlas);
                    onChange();
                });

                if (! engineAtlas.resource) {
                    app.assets.load(engineAtlas);
                }

            } else {
                app.assets.once('add:' + atlas, watchAtlas);
                watch.events.onAtlasAdd = watchAtlas;
            }
        };

        watchAtlas();

        watch.events.onSetAtlas = watch.asset.on('data.textureAtlasAsset:set', function () {
            unwatchAtlas(watch, currentAtlas);
            watchAtlas();
        });

        watch.events.onSpriteChange = watch.asset.on('*:set', function (path) {
            if (/^data.frameKeys/.test(path) || /^data.textureAtlasAsset/.test(path)) {
                onChange();
            }
        });
    };

    var unwatchAtlas = function (watch, atlas) {
        if (! atlas) return;

        var engineAtlas = app.assets.get(atlas);

        if (watch.events.onAtlasChange) {
            if (engineAtlas) {
                engineAtlas.off('change', watch.events.onAtlasChange);
            }
            delete watch.events.onAtlasChange;
        }

        if (watch.events.onAtlasLoad) {
            if (engineAtlas) {
                engineAtlas.off('load', watch.events.onAtlasLoad);

                if (engineAtlas.resource) {
                    engineAtlas.resource.off('set:frame', watch.events.onAtlasChange);
                    engineAtlas.resource.off('set:frames', watch.events.onAtlasChange);
                }
            }
            delete watch.events.onAtlasLoad;
        }

        if (watch.events.onAtlasRemove) {
            watch.events.onAtlasRemove.unbind();
            delete watch.events.onAtlasRemove;
        }

        if (watch.events.onAtlasAdd) {
            app.assets.off('add:' + atlas, watch.events.onAtlasAdd);
            delete watch.events.onAtlasAdd;
        }
    };

    var unsubscribe = function (watch) {
        var atlas = watch.asset.get('data.textureAtlasAsset');
        unwatchAtlas(watch, atlas);
        if (watch.events.onSetAtlas) {
            watch.events.onSetAtlas.unbind();
        }
        if (watch.events.onSpriteChange) {
            watch.events.onSpriteChange.unbind();
        }
        watch.events = {};
    };

    var trigger = function (watch) {
        for (var key in watch.callbacks)
            watch.callbacks[key].callback();
    };

    // used to force the trigger when the asset is known to have changed
    // e.g. when loading the uncompressed texture atlas completes
    editor.method('assets:sprite:watch:trigger', function (asset) {
        var watch = watching[asset.get('id')];
        if (watch) {
            trigger(watch);
        }
    });

    editor.method('assets:sprite:watch', function (args) {
        var watch = watching[args.asset.get('id')];

        if (! watch) {
            watch = watching[args.asset.get('id')] = {
                asset: args.asset,
                events: {},
                ind: 0,
                callbacks: { }
            };
            subscribe(watch);
        }

        var item = watch.callbacks[++watch.ind] = {
            callback: args.callback
        };

        return watch.ind;
    });


    editor.method('assets:sprite:unwatch', function (asset, handle) {
        var watch = watching[asset.get('id')];
        if (! watch) return;

        if (! watch.callbacks.hasOwnProperty(handle))
            return;

        delete watch.callbacks[handle];

        if (Object.keys(watch.callbacks).length === 0) {
            unsubscribe(watch);
            delete watching[asset.get('id')];
        }
    });
});
