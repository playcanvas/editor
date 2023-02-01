editor.once('load', function () {
    'use strict';

    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    const watching = { };

    const trigger = function (watch) {
        for (const key in watch.callbacks)
            watch.callbacks[key].callback();
    };

    const loadModel = function (watch, asset, reload) {
        let url;
        const file = watch.asset.get('file');

        if (file && file.url) {
            url = file.url;

            if (app.assets.prefix && !pc.ABSOLUTE_URL.test(url))
                url = app.assets.prefix + url;

            url = url.appendQuery('t=' + file.hash);
        }

        if (url && (reload || !asset._editorPreviewModel)) {
            app.assets._loader.load(url, asset.type, function (err, resource, extra) {
                if (resource instanceof Array) {
                    asset._editorPreviewModel = resource[0];
                } else {
                    asset._editorPreviewModel = resource;
                }
                trigger(watch);
            });
        } else if (!url && asset._editorPreviewModel) {
            asset._editorPreviewModel = null;
            trigger(watch);
        }
    };

    const subscribe = function (watch) {
        const onChange = function () {
            loadModel(watch, watch.engineAsset, true);
        };

        watch.watching.file = watch.asset.on('file.hash:set', function () {
            setTimeout(onChange, 0);
        });

        watch.watching.fileUnset = watch.asset.on('file.hash:unset', function () {
            setTimeout(onChange, 0);
        });

        watch.onAdd = function (asset) {
            app.assets.off('add:' + watch.asset.get('id'), watch.onAdd);
            watch.engineAsset = asset;
            watch.onAdd = null;

            if (watch.autoLoad) loadModel(watch, asset);
        };

        const asset = app.assets.get(watch.asset.get('id'));
        if (asset) {
            watch.onAdd(asset);
        } else {
            app.assets.once('add:' + watch.asset.get('id'), watch.onAdd);
        }
    };

    const unsubscribe = function (watch) {
        if (watch.engineAsset)
            watch.engineAsset.off('load', watch.onLoad);

        if (watch.onAdd)
            app.assets.off('add:' + watch.asset.get('id'), watch.onAdd);

        for (const key in watch.watching)
            watch.watching[key].unbind();
    };


    editor.method('assets:model:watch', function (args) {
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
                loadModel(watch, asset);
            }
        }

        return watch.ind;
    });


    editor.method('assets:model:unwatch', function (asset, handle) {
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
