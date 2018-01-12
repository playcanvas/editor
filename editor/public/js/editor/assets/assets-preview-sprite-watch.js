editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var watching = { };

    var subscribe = function(watch) {
        var onChange = function() {
            trigger(watch);
        };

        var watchAtlas = function () {
            var atlas = watch.asset.get('data.textureAtlasAsset');
            if (! atlas) return;

            var atlasAsset = editor.call('assets:get', atlas);
            if (atlasAsset) {
                var engineAtlas = app.assets.get(atlas);
                watch.events.onAtlasChange = engineAtlas.on('change', onChange);
                watch.events.onAtlasLoad = engineAtlas.on('load', onChange);

                watch.events.onAtlasRemove = atlasAsset.once('destroy', function () {
                    unwatchAtlas();
                    onChange();
                });

            } else {
                watch.events.onAtlasAdd = app.assets.once('assets:add[' + atlas + ']', watchAtlas);
            }
        };

        var unwatchAtlas = function () {
            if (watch.events.onAtlasChange) {
                watch.events.onAtlasChange.unbind();
                delete watch.events.onAtlasChange;
            }

            if (watch.events.onAtlasLoad) {
                watch.events.onAtlasLoad.unbind();
                delete watch.events.onAtlasLoad;
            }

            if (watch.events.onAtlasRemove) {
                watch.events.onAtlasRemove.unbind();
                delete watch.events.onAtlasRemove;
            }

            if (watch.events.onAtlasAdd) {
                watch.events.onAtlasAdd.unbind();
                delete watch.events.onAtlasAdd;
            }
        };

        watchAtlas();

        watch.events.onSetAtlas = watch.asset.on('data.textureAtlasAsset:set', function () {
            unwatchAtlas();
            watchAtlas();
        });

        watch.events.onSpriteChange = watch.asset.on('*:set', function (path) {
            if (/^data.frameKeys/.test(path) || /^data.textureAtlasAsset/.test(path)) {
                onChange();
            }
        });
    };

    var unsubscribe = function(watch) {
        for (var key in watch.events) {
            if (watch.events[key]) {
                watch.events[key].unbind();
            }
        }
        watch.events = {};
    };

    var trigger = function(watch) {
        for(var key in watch.callbacks)
            watch.callbacks[key].callback();
    };

    editor.method('assets:sprite:watch', function(args) {
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


    editor.method('assets:sprite:unwatch', function(asset, handle) {
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
