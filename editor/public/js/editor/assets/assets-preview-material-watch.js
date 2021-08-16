editor.once('load', function () {
    'use strict';

    const app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    const watching = { };
    const slots = ['aoMap', 'diffuseMap', 'emissiveMap', 'glossMap', 'lightMap', 'metalnessMap', 'opacityMap', 'specularMap', 'normalMap', 'cubeMap', 'sphereMap'];

    const trigger = function (watch, slot) {
        for (const key in watch.callbacks)
            watch.callbacks[key].callback(slot);
    };

    function onMaterialLoad() {
        trigger(this);
    }

    function onMaterialAdd(asset) {
        asset.on('load', onMaterialLoad, this);
        app.assets.load(asset);
    }

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

        if (watch.autoLoad) {
            asset = app.assets.get(id);
            if (asset && ! asset.resource)
                app.assets.load(asset);
        }
    };

    const removeTextureWatch = function (watch, slot) {
        if (! watch.textures[slot])
            return;

        app.assets.off('load:' + watch.textures[slot].id, watch.textures[slot].fn);
        app.assets.off('add:' + watch.textures[slot].id, watch.textures[slot].addFn);

        const asset = app.assets.get(watch.textures[slot].id);
        if (asset) asset.off('change', watch.textures[slot].fn);

        delete watch.textures[slot];
    };

    const addSlotWatch = function (watch, slot) {
        watch.watching[slot] = watch.asset.on('data.' + slot + ':set', function (value) {
            if (watch.textures[slot]) {
                if (value !== watch.textures[slot].id) {
                    removeTextureWatch(watch, slot);
                    if (value) addTextureWatch(watch, slot, value);
                }
            } else if (value) {
                addTextureWatch(watch, slot, value);
            }
        });
    };

    const subscribe = function (watch) {
        for (let i = 0; i < slots.length; i++) {
            const textureId = watch.asset.get('data.' + slots[i]);
            if (textureId)
                addTextureWatch(watch, slots[i], textureId);
        }

        watch.watching.data = watch.asset.on('*:set', function (path) {
            if (! path.startsWith('data.'))
                return;

            trigger(watch, null);
        });

        watch.watching.all = watch.asset.on('data:set', function (value) {
            if (value) {
                for (let i = 0; i < slots.length; i++) {
                    const id = value[slots[i]];
                    if (watch.textures[slots[i]]) {
                        if (id !== watch.textures[slots[i]].id) {
                            removeTextureWatch(watch, slots[i]);
                            if (id) addTextureWatch(watch, slots[i], id);
                        }
                    } else if (id) {
                        addTextureWatch(watch, slots[i], id);
                    }
                }
            } else {
                for (let i = 0; i < slots.length; i++) {
                    if (watch.textures[slots[i]])
                        removeTextureWatch(watch, slots[i]);
                }
            }
        });

        for (let i = 0; i < slots.length; i++)
            addSlotWatch(watch, slots[i]);
    };

    const unsubscribe = function (watch) {
        for (const key in watch.textures)
            removeTextureWatch(watch, key);

        for (const key in watch.watching)
            watch.watching[key].unbind();
    };


    editor.method('assets:material:watch', function (args) {
        let watch = watching[args.asset.get('id')];

        if (! watch) {
            watch = watching[args.asset.get('id')] = {
                asset: args.asset,
                autoLoad: 0,
                autoLoadMaterial: 0,
                textures: { },
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
            for (const key in watch.textures) {
                const asset = app.assets.get(watch.textures[key].id);
                if (asset && ! asset.resource)
                    app.assets.load(asset);
            }
        }

        if (args.loadMaterial) {
            watch.autoLoadMaterial++;
        }

        if (watch.autoLoadMaterial === 1) {
            const materialAsset = app.assets.get(args.asset.get('id'));
            if (materialAsset) {
                materialAsset.on('load', onMaterialLoad, watch);
                app.assets.load(materialAsset);
            } else {
                app.assets.on('add[' + args.asset.get('id') + ']', onMaterialAdd, watch);
            }
        }

        return watch.ind;
    });


    editor.method('assets:material:unwatch', function (asset, handle) {
        const watch = watching[asset.get('id')];
        if (! watch) return;

        if (! watch.callbacks.hasOwnProperty(handle))
            return;

        if (watch.callbacks[handle].autoLoad)
            watch.autoLoad--;

        if (watch.autoLoadMaterial) {
            watch.autoLoadMaterial--;

            if (watch.autoLoadMaterial === 0) {
                app.assets.off('add[' + asset.get('id') + ']', onMaterialAdd, watch);
                const materialAsset = app.assets.get(asset.get('id'));
                if (materialAsset) {
                    materialAsset.off('load', onMaterialLoad, watch);
                }
            }
        }

        delete watch.callbacks[handle];

        if (Object.keys(watch.callbacks).length === 0) {
            unsubscribe(watch);
            delete watching[asset.get('id')];
        }
    });
});
