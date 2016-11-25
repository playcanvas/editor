editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var watching = { };
    var slots = [ 'aoMap', 'diffuseMap', 'emissiveMap', 'glossMap', 'lightMap', 'metalnessMap', 'opacityMap', 'specularMap', 'normalMap', 'cubeMap', 'sphereMap' ];

    var addTextureWatch = function(watch, slot, id) {
        watch.textures[slot] = {
            id: id,
            fn: function() {
                trigger(watch, slot);
            }
        };
        app.assets.on('load:' + id, watch.textures[slot].fn);

        var asset = app.assets.get(id);
        if (asset) asset.on('change', watch.textures[slot].fn);

        if (watch.autoLoad) {
            var asset = app.assets.get(id);
            if (asset && ! asset.resource)
                app.assets.load(asset);
        }
    };

    var removeTextureWatch = function(watch, slot) {
        if (! watch.textures[slot])
            return;

        app.assets.off('load:' + watch.textures[slot].id, watch.textures[slot].fn);

        var asset = app.assets.get(watch.textures[slot].id);
        if (asset) asset.off('change', watch.textures[slot].fn);

        delete watch.textures[slot];
    };

    var addSlotWatch = function(watch, slot) {
        watch.watching[slot] = watch.asset.on('data.' + slot + ':set', function(value) {
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

    var subscribe = function(watch) {
        for(var i = 0; i < slots.length; i++) {
            var textureId = watch.asset.get('data.' + slots[i]);
            if (textureId)
                addTextureWatch(watch, slots[i], textureId);
        }

        watch.watching.all = watch.asset.on('data:set', function(value) {
            if (value) {
                for(var i = 0; i < slots.length; i++) {
                    var id = value[slots[i]];
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
                for(var i = 0; i < slots.length; i++) {
                    if (watch.textures[slots[i]])
                        removeTextureWatch(watch, slots[i]);
                }
            }
        });

        for(var i = 0; i < slots.length; i++)
            addSlotWatch(watch, slots[i]);
    };

    var unsubscribe = function(watch) {
        for(var key in watch.textures)
            removeTextureWatch(watch, key);

        for(var key in watch.watching)
            watch.watching[key].unbind();
    };

    var trigger = function(watch, slot) {
        for(var key in watch.callbacks)
            watch.callbacks[key].callback(slot);
    };


    editor.method('assets:material:watch', function(args) {
        var watch = watching[args.asset.get('id')];

        if (! watch) {
            watch = watching[args.asset.get('id')] = {
                asset: args.asset,
                autoLoad: 0,
                textures: { },
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

        return watch.ind;
    });


    editor.method('assets:material:unwatch', function(asset, handle) {
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
