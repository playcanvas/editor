editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available
    const watching = { };

    const trigger = function (watch: { callbacks: Record<string | number, { callback: () => void }> }) {
        for (const key in watch.callbacks) {
            watch.callbacks[key].callback();
        }
    };

    const loadFont = function (watch: { callbacks: Record<string | number, unknown> }, asset: { unload?: () => void; ready: (fn: () => void) => void }, reload?: boolean) {
        if (reload && asset) {
            asset.unload();
        }

        asset.ready(() => {
            trigger(watch);
        });
        app.assets.load(asset);
    };

    const subscribe = function (watch: { asset: { get: (path: string) => string | number }; engineAsset: { off: (event: string, fn: () => void) => void; on: (event: string, fn: () => void) => void } | null; onAdd: ((asset: unknown) => void) | null; onLoad: (() => void) | null; onChange: ((asset: unknown, name: string, value: unknown) => void) | null; autoLoad: number; watching: Record<string, { unbind: () => void }> }) {
        watch.onChange = function (_asset: unknown, name: string, _value: unknown) {
            if (name === 'data') {
                trigger(watch);
            }
        };

        watch.onAdd = function (asset: { off: (event: string, fn: () => void) => void; on: (event: string, fn: () => void) => void }) {
            app.assets.off(`add:${watch.asset.get('id')}`, watch.onAdd);
            watch.onAdd = null;
            watch.engineAsset = asset;
            watch.engineAsset.off('load', watch.onLoad);
            watch.engineAsset.on('load', watch.onLoad);
            watch.engineAsset.off('change', watch.onChange);
            watch.engineAsset.on('change', watch.onChange);
            if (watch.autoLoad) {
                loadFont(watch, asset);
            }
        };

        watch.onLoad = function (_asset: unknown) {
            trigger(watch);
        };

        const asset = app.assets.get(watch.asset.get('id'));
        if (asset) {
            watch.onAdd(asset);

        } else {
            app.assets.once(`add:${watch.asset.get('id')}`, watch.onAdd);
        }
    };

    const unsubscribe = function (watch: { engineAsset: { off: (event: string, fn: () => void) => void } | null; onAdd: (() => void) | null; watching: Record<string, { unbind: () => void }> }) {
        if (watch.engineAsset) {
            watch.engineAsset.off('load', watch.onLoad);
            watch.engineAsset.off('change', watch.onChange);
        }

        if (watch.onAdd) {
            app.assets.off(`add:${watch.asset.get('id')}`, watch.onAdd);
        }

        for (const key in watch.watching) {
            watch.watching[key].unbind();
        }
    };


    editor.method('assets:font:watch', (args) => {
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

        if (args.autoLoad) {
            watch.autoLoad++;
        }

        if (watch.autoLoad === 1) {
            const asset = app.assets.get(watch.asset.get('id'));
            if (asset) {
                watch.engineAsset = asset;
                loadFont(watch, asset);
            }
        }

        return watch.ind;
    });

    editor.method('assets:font:unwatch', (asset, handle) => {
        const watch = watching[asset.get('id')];
        if (!watch) {
            return;
        }

        if (!watch.callbacks.hasOwnProperty(handle)) {
            return;
        }

        if (watch.callbacks[handle].autoLoad) {
            watch.autoLoad--;
        }

        delete watch.callbacks[handle];

        if (Object.keys(watch.callbacks).length === 0) {
            unsubscribe(watch);
            delete watching[asset.get('id')];
        }
    });
});
