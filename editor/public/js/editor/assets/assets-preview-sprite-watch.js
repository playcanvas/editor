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
            if (atlas) {
                var atlasAsset = editor.call('assets:get', atlas);
                if (atlasAsset) {
                    watch.events.onAtlasChange = atlasAsset.on('*:set', function (path) {
                        if (/^data.frames/.test(path) || /^file.hash/.test(path)) {
                            setTimeout(onChange, 0);
                        }
                    });

                    watch.events.onAtlasRemove = atlasAsset.once('destroy', function () {
                        if (watch.events.onAtlasRemove) {
                            watch.events.onAtlasRemove.unbind();
                            watch.events.onAtlasRemove = null;
                        }

                        if (watch.events.onAtlasAdd) {
                            watch.events.onAtlasAdd.unbind();
                            watch.events.onAtlasAdd = null;
                        }

                        if (watch.events.onAtlasChange) {
                            watch.events.onAtlasChange.unbind();
                            watch.events.onAtlasChange = null;
                        }

                        if (watch.events.onAtlasChange) {
                            watch.events.onAtlasChange.unbind();
                            watch.events.onAtlasChange = null;
                        }

                        onChange();
                    });

                } else {
                    watch.onAtlasAdd = editor.once('assets:add[' + atlas + ']', watchAtlas);
                }
            }
        };

        if (watch.asset.get('data.textureAtlasAsset')) {
            watchAtlas();
        }

        watch.events.onSetAtlas = watch.asset.on('data.textureAtlasAsset:set', function () {
            if (watch.onAtlasChange) {
                watch.onAtlasChange.unbind();
                watch.onAtlasChange = null;
            }

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
            watch.events[key].unbind();
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
