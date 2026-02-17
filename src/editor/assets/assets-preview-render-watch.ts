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

    const load = function (watch: { callbacks: Record<string | number, unknown> }, asset: { unload?: () => void; ready: (fn: () => void) => void }, reload?: boolean) {
        if (reload && asset) {
            asset.unload();
        }

        asset.ready(() => {
            trigger(watch);
        });
        app.assets.load(asset);
    };

    const unwatchContainer = function (watch: { onContainerLoad?: () => void; onContainerAdd?: () => void; evtContainerRemove?: { unbind: () => void }; evtContainerFileSet?: { unbind: () => void }; evtContainerFileUnset?: { unbind: () => void } }, container: string | number | null) {
        if (watch.onContainerLoad && container) {
            app.assets.off(`load:${container}`, watch.onContainerLoad);
            delete watch.onContainerLoad;
        }

        if (watch.onContainerAdd && container) {
            app.assets.off(`add:${container}`, watch.onContainerAdd);
            delete watch.onContainerAdd;
        }

        if (watch.evtContainerRemove) {
            watch.evtContainerRemove.unbind();
            delete watch.evtContainerRemove;
        }
        if (watch.evtContainerFileSet) {
            watch.evtContainerFileSet.unbind();
            delete watch.evtContainerFileSet;
        }
        if (watch.evtContainerFileUnset) {
            watch.evtContainerFileUnset.unbind();
            delete watch.evtContainerFileUnset;
        }
    };

    const subscribe = function (watch: { asset: { get: (path: string) => string | number | null }; engineAsset: { resource?: { off: (event: string, fn: () => void) => void; on: (event: string, fn: () => void) => void; meshes?: unknown }; off: (event: string, fn: () => void) => void; on: (event: string, fn: () => void) => void } | null; onChange: ((asset: unknown, name: string, value: unknown) => void) | null; onAdd: ((asset: unknown) => void) | null; onLoad: ((asset: { resource?: { off: (event: string, fn: () => void) => void; on: (event: string, fn: () => void) => void; meshes?: unknown }; resource?: unknown }) => void) | null; onSetMeshes: (() => void) | null; watching: Record<string, { unbind: () => void }> }) {
        let currentContainer = null;

        watch.onChange = function (_asset: unknown, name: string, _value: unknown) {
            if (name === 'data') {
                trigger(watch);
            }
        };


        const watchContainer = function () {
            const container = watch.asset.get('data.containerAsset');
            currentContainer = container;
            if (!container) {
                return;
            }

            const containerAsset = editor.call('assets:get', container);
            if (containerAsset) {
                const engineContainer = app.assets.get(container);

                watch.onContainerLoad = function () {
                    trigger(watch);
                };

                app.assets.on(`load:${container}`, watch.onContainerLoad);

                watch.onContainerRemove = function () {
                    unwatchContainer(watch, currentContainer);
                    trigger(watch);
                };

                watch.evtContainerRemove = containerAsset.once('destroy', () => {
                    watch.onContainerRemove();
                });

                if (!engineContainer.resource && engineContainer.file) {
                    app.assets.load(engineContainer);
                }

                watch.evtContainerFileSet = containerAsset.on('file:set', () => {
                    app.assets.load(engineContainer);
                });
                watch.evContainerFileUnset = containerAsset.on('file:unset', () => {
                    watch.onContainerRemove();
                });

            } else {
                app.assets.once(`add:${container}`, watchContainer);
                watch.onContainerAdd = watchContainer;
            }
        };

        watch.onSetContainer = watch.asset.on('data.containerAsset:set', () => {
            unwatchContainer(watch, currentContainer);
            watchContainer();
        });

        watch.onAdd = function (asset: { off: (event: string, fn: () => void) => void; on: (event: string, fn: () => void) => void; resource?: unknown }) {
            app.assets.off(`add:${watch.asset.get('id')}`, watch.onAdd);
            watch.onAdd = null;
            watch.engineAsset = asset;
            watch.engineAsset.off('load', watch.onLoad);
            watch.engineAsset.on('load', watch.onLoad);
            watch.engineAsset.off('change', watch.onChange);
            watch.engineAsset.on('change', watch.onChange);

            watchContainer();

            if (watch.autoLoad) {
                load(watch, asset);
            }
        };

        watch.onLoad = function (asset: { resource?: { off: (event: string, fn: () => void) => void; on: (event: string, fn: () => void) => void; meshes?: unknown }; resource?: unknown }) {
            if (!asset.resource) {
                return;
            }

            asset.resource.off('set:meshes', watch.onSetMeshes);
            asset.resource.on('set:meshes', watch.onSetMeshes);
            if (asset.resource.meshes) {
                trigger(watch);
            }
        };

        watch.onSetMeshes = function (): void {
            trigger(watch);
        };

        const asset = app.assets.get(watch.asset.get('id'));
        if (asset) {
            watch.onAdd(asset);

        } else {
            app.assets.once(`add:${watch.asset.get('id')}`, watch.onAdd);
        }
    };

    const unsubscribe = function (watch: { asset: { get: (path: string) => string | number | null }; engineAsset: { resource?: { off: (event: string, fn: () => void) => void }; off: (event: string, fn: () => void) => void } | null; onAdd: (() => void) | null; watching: Record<string, { unbind: () => void }> }) {
        const container = watch.asset.get('data.containerAsset');
        unwatchContainer(watch, container);

        if (watch.engineAsset) {
            if (watch.engineAsset.resource) {
                watch.engineAsset.resource.off('set:meshes', watch.onSetMeshes);
            }

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


    editor.method('assets:render:watch', (args) => {
        let watch = watching[args.asset.get('id')];

        if (!watch) {
            watch = watching[args.asset.get('id')] = {
                asset: args.asset,
                engineAsset: null,
                autoLoad: 0,
                onLoad: null,
                onAdd: null,
                onSetMeshes: null,
                onContainerAdd: null,
                onContainerLoad: null,
                onContainerRemove: null,
                evtContainerRemove: null,
                evtContainerFileSet: null,
                evtContainerFileUnset: null,
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
                load(watch, asset);
            }
        }

        return watch.ind;
    });


    editor.method('assets:render:unwatch', (asset, handle) => {
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
