editor.once('load', function () {
    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available
    const watching = { };

    const trigger = function (watch) {
        for (const key in watch.callbacks) {
            watch.callbacks[key].callback();
        }
    };

    const loadFont = function (watch, asset, reload) {
        if (reload && asset) {
            asset.unload();
        }

        asset.ready(function () {
            trigger(watch);
        });
        app.assets.load(asset);
    };

    const subscribe = function (watch) {
        watch.onChange = function (asset, name, value) {
            if (name === 'data') {
                trigger(watch);
            }
        };

        watch.onAdd = function (asset) {
            app.assets.off('add:' + watch.asset.get('id'), watch.onAdd);
            watch.onAdd = null;
            watch.engineAsset = asset;
            watch.engineAsset.off('load', watch.onLoad);
            watch.engineAsset.on('load', watch.onLoad);
            watch.engineAsset.off('change', watch.onChange);
            watch.engineAsset.on('change', watch.onChange);
            if (watch.autoLoad) loadFont(watch, asset);
        };

        watch.onLoad = function (asset) {
            trigger(watch);
        };

        const asset = app.assets.get(watch.asset.get('id'));
        if (asset) {
            watch.onAdd(asset);

        } else {
            app.assets.once('add:' + watch.asset.get('id'), watch.onAdd);
        }
    };

    const unsubscribe = function (watch) {
        if (watch.engineAsset) {
            watch.engineAsset.off('load', watch.onLoad);
            watch.engineAsset.off('change', watch.onChange);
        }

        if (watch.onAdd)
            app.assets.off('add:' + watch.asset.get('id'), watch.onAdd);

        for (const key in watch.watching)
            watch.watching[key].unbind();
    };


    editor.method('assets:font:watch', function (args) {
        let watch = watching[args.asset.get('id')];

        if (!watch) {
            watch = watching[args.asset.get('id')] = {
                asset: args.asset,
                engineAsset: null,
                autoLoad: 0,
                onLoad: null,
                onAdd: null,
                watching: { },
                ind: 0,
                callbacks: { }
            };
            subscribe(watch);
        }

        watch.callbacks[++watch.ind] = {
            autoLoad: args.autoLoad,
            callback: args.callback
        };

        if (args.autoLoad)
            watch.autoLoad++;

        if (watch.autoLoad === 1) {
            const asset = app.assets.get(watch.asset.get('id'));
            if (asset) {
                watch.engineAsset = asset;
                loadFont(watch, asset);
            }
        }

        return watch.ind;
    });

    editor.method('assets:font:unwatch', function (asset, handle) {
        const watch = watching[asset.get('id')];
        if (!watch) return;

        if (!watch.callbacks.hasOwnProperty(handle))
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
