editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var watching = { };


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

        var obj = editor.call('assets:get', id);
        if (obj) obj.on('thumbnails.s:set', watch.textures[slot].fn);

        if (watch.autoLoad) {
            var asset = app.assets.get(id);
            if (asset && ! asset.resource)
                app.assets.load(asset);
        }
    };

    var removeTextureWatch = function(watch, slot) {
        if (! watch.textures[slot])
            return;

        var id = watch.textures[slot].id;

        app.assets.off('load:' + id, watch.textures[slot].fn);

        var asset = app.assets.get(id);
        if (asset) asset.off('change', watch.textures[slot].fn);

        var obj = editor.call('assets:get', id);
        if (obj) obj.unbind('thumbnails.s:set', watch.textures[slot].fn);

        delete watch.textures[slot];
    };

    var addSlotWatch = function(watch, slot) {
        watch.watching[slot] = watch.asset.on('data.textures.' + slot + ':set', function(value) {
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
        for(var i = 0; i < 6; i++) {
            var textureId = watch.asset.get('data.textures.' + i);
            if (textureId)
                addTextureWatch(watch, i, textureId);
        }

        watch.watching.all = watch.asset.on('data.textures:set', function(value) {
            if (value) {
                for(var i = 0; i < 6; i++) {
                    var id = value[i];
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
                for(var i = 0; i < 6; i++) {
                    if (watch.textures[i])
                        removeTextureWatch(watch, i);
                }
            }
        });

        for(var i = 0; i < 6; i++)
            addSlotWatch(watch, i);
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


    editor.method('assets:cubemap:watch', function(args) {
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


    editor.method('assets:cubemap:unwatch', function(asset, handle) {
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
