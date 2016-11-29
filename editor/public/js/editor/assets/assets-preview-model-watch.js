editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var watching = { };

    var subscribe = function(watch) {
        watch.watching.file = watch.asset.on('file.hash:set', function() {
            trigger(watch);
        });

        watch.watching.fileUnset = watch.asset.on('file.hash:unset', function() {
            trigger(watch);
        });

        watch.onAdd = function(asset) {
            app.assets.off('add:' + watch.asset.get('id'), watch.onAdd);
            watch.onAdd = null;

            watch.onLoad = function() {
                trigger(watch);
            };
            asset.on('load', watch.onLoad);

            if (watch.autoLoad && ! asset.resource)
                app.assets.load(asset);
        };

        var asset = app.assets.get(watch.asset.get('id'));
        if (asset) {
            watch.onAdd(asset);
        } else {
            app.assets.once('add:' + watch.asset.get('id'), watch.onAdd);
        }
    };

    var unsubscribe = function(watch) {
        if (watch.onLoad)
            watch.asset.off('load', watch.onLoad);

        if (watch.onAdd)
            app.assets.off('add:' + watch.asset.get('id'), watch.onAdd);

        for(var key in watch.watching)
            watch.watching[key].unbind();
    };

    var trigger = function(watch) {
        for(var key in watch.callbacks)
            watch.callbacks[key].callback();
    };


    editor.method('assets:model:watch', function(args) {
        var watch = watching[args.asset.get('id')];

        if (! watch) {
            watch = watching[args.asset.get('id')] = {
                asset: args.asset,
                autoLoad: 0,
                onLoad: null,
                onAdd: null,
                watching: { },
                ind: 0,
                callbacks: { }
            };
            subscribe(watch);
        }

        var item = watch.callbacks[++watch.ind] = {
            autoLoad: args.autoLoad,
            callback: args.callback
        };

        if (args.autoLoad)
            watch.autoLoad++;

        if (watch.autoLoad === 1) {
            var asset = app.assets.get(watch.asset.get('id'));
            if (asset && ! asset.resource)
                app.assets.load(asset);
        }

        return watch.ind;
    });


    editor.method('assets:model:unwatch', function(asset, handle) {
        var watch = watching[asset.get('id')];
        if (! watch) return;

        if (! watch.hasOwnProperty(handle))
            return;

        if (watch.callbacks[handle].autoLoad)
            watch.autoLoad--;

        delete watch.callbacks[handle];

        if (Object.keys(watch.callbacks).length === 0) {
            unsubscribe(watch);
            delete watching[asset.get('id')];
        }
    });
});
