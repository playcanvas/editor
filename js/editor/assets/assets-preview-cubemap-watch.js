editor.once('load', function () {
    'use strict';

    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available
    const watching = { };

    const trigger = function (watch, slot) {
        for (const key in watch.callbacks)
            watch.callbacks[key].callback(slot);
    };

    const addTextureWatch = function (watch, slot, id) {
        watch.textures[slot] = {
            id: id,
            fn: function () {
                trigger(watch, slot);
            },
            addFn: function () {
                const asset = app.assets.get(id);
                if (asset) {
                    asset.on('change', watch.textures[slot].fn);

                    if (watch.autoLoad && !asset.resource) {
                        app.assets.load(asset);
                    }
                }
            }
        };
        app.assets.on('load:' + id, watch.textures[slot].fn);

        let asset = app.assets.get(id);
        if (asset) {
            asset.on('change', watch.textures[slot].fn);
        } else {
            app.assets.on('add:' + id, watch.textures[slot].addFn);
        }

        const obj = editor.call('assets:get', id);
        if (obj) obj.on('thumbnails.s:set', watch.textures[slot].fn);

        if (watch.autoLoad) {
            asset = app.assets.get(id);
            if (asset && !asset.resource)
                app.assets.load(asset);

            asset = app.assets.get(watch.asset.get('id'));
            if (asset && (!asset.resource || !asset.loadFaces)) {
                asset.loadFaces = true;
                app.assets.load(asset);
            }
        }
    };

    const removeTextureWatch = function (watch, slot) {
        if (!watch.textures[slot])
            return;

        const id = watch.textures[slot].id;

        app.assets.off('load:' + id, watch.textures[slot].fn);
        app.assets.off('add:' + id, watch.textures[slot].addFn);

        const asset = app.assets.get(id);
        if (asset) asset.off('change', watch.textures[slot].fn);

        const obj = editor.call('assets:get', id);
        if (obj) obj.unbind('thumbnails.s:set', watch.textures[slot].fn);

        delete watch.textures[slot];
    };

    const addSlotWatch = function (watch, slot) {
        watch.watching[slot] = watch.asset.on('data.textures.' + slot + ':set', function (value) {
            if (watch.textures[slot]) {
                if (value !== watch.textures[slot].id) {
                    removeTextureWatch(watch, slot);
                    if (value) addTextureWatch(watch, slot, value);
                }
            } else if (value) {
                addTextureWatch(watch, slot, value);
            }

            trigger(watch, slot);
        });
    };

    const subscribe = function (watch) {
        for (let i = 0; i < 6; i++) {
            const textureId = watch.asset.get('data.textures.' + i);
            if (textureId)
                addTextureWatch(watch, i, textureId);
        }

        watch.watching.all = watch.asset.on('data.textures:set', function (value) {
            if (value) {
                for (let i = 0; i < 6; i++) {
                    const id = value[i];
                    if (watch.textures[i]) {
                        if (id !== watch.textures[i].id) {
                            removeTextureWatch(watch, i);
                            if (id) addTextureWatch(watch, i, id);
                        }
                    } else if (id) {
                        addTextureWatch(watch, i, id);
                    }
                }
            } else {
                for (let i = 0; i < 6; i++) {
                    if (watch.textures[i])
                        removeTextureWatch(watch, i);
                }
            }

            trigger(watch);
        });

        for (let i = 0; i < 6; i++)
            addSlotWatch(watch, i);

        watch.retryTimeout = null;
        let retries = 5;

        watch.onAdd = function (asset) {
            if (!watch.autoLoad)
                return;

            asset.loadFaces = true;
            app.assets.load(asset);
        };

        watch.onLoad = function (asset) {
            trigger(watch);
        };

        // onError will also be called when a texture
        // face has not been added yet. When this happens
        // we retry after a while to see if the cubemap can load
        // then
        watch.onError = function (err, asset) {
            if (watch.retryTimeout) {
                clearTimeout(watch.retryTimeout);
                watch.retryTimeout = null;
            }

            watch.retryTimeout = setTimeout(() => {
                retries--;
                if (retries < 0) return;

                asset.loaded = false;
                watch.onAdd(asset);
            }, 1000);
        };

        app.assets.on('add:' + watch.asset.get('id'), watch.onAdd);
        app.assets.on('load:' + watch.asset.get('id'), watch.onLoad);
        app.assets.on('error:' + watch.asset.get('id'), watch.onError);
    };

    const unsubscribe = function (watch) {
        for (const key in watch.textures)
            removeTextureWatch(watch, key);

        for (const key in watch.watching)
            watch.watching[key].unbind();

        if (watch.retryTimeout) {
            clearTimeout(watch.retryTimeout);
            watch.retryTimeout = null;
        }

        app.assets.off('add:' + watch.asset.get('id'), watch.onAdd);
        app.assets.off('load:' + watch.asset.get('id'), watch.onLoad);
        app.assets.off('error:' + watch.asset.get('id'), watch.onError);
    };


    editor.method('assets:cubemap:watch', function (args) {
        let watch = watching[args.asset.get('id')];

        if (!watch) {
            watch = watching[args.asset.get('id')] = {
                asset: args.asset,
                autoLoad: 0,
                textures: { },
                watching: { },
                ind: 0,
                callbacks: { },
                onLoad: null,
                onAdd: null,
                onError: null,
                retryTimeout: null
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
            if (asset && (!asset.loadFaces || !asset.resource)) {
                asset.loadFaces = true;
                app.assets.load(asset);
            }
        }

        return watch.ind;
    });


    editor.method('assets:cubemap:unwatch', function (asset, handle) {
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
