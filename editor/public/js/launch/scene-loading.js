app.once('load', function() {
    'use strict';

    // cache
    var loaded = {};
    var isLoading = false;
    var loadScene = function(id, callback, settingsOnly) {
        if (loaded[id]) {
            if (callback)
                callback(null, loaded[id].getSnapshot());

            return;
        }

        isLoading = true;

        var connection = editor.call('realtime:connection');
        var scene = connection.get('scenes', '' + id);

        // error
        scene.on('error', function(err) {
            console.error('error', err);
        });

        // ready to sync
        scene.on('ready', function() {
            // cache loaded scene for any subsequent load requests
            loaded[id] = scene;

            // notify of operations
            scene.on('after op', function(ops, local) {
                if (local)
                    return;

                for (var i = 0; i < ops.length; i++) {
                    var op = ops[i];

                    // console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));

                    if (op.p[0]) {
                        app.emit('realtime:op:' + op.p[0], op);
                    }
                }
            });

            // notify of scene load
            var snapshot = scene.getSnapshot();
            if (settingsOnly !== true) {
                app.emit('scene:raw', snapshot);
            }
            if (callback) {
                callback(null, snapshot);
            }

            isLoading = false;
        });

        // subscribe for realtime events
        scene.subscribe();
    };

    app.method('loadScene', loadScene);
    app.method('isLoadingScene', function () {
        return isLoading;
    });

    app.on('realtime:authenticated', function () {
        var startedLoading = false;

        // if we are reconnecting try to reload
        // all scenes that we've already loaded
        for (var id in loaded) {
            startedLoading = true;
            loaded[id].destroy();
            delete loaded[id];

            app.call('loadScene', id);
        }

        // if no scenes have been loaded at
        // all then we are initializing
        // for the first time so load the main scene
        if (! startedLoading) {
            app.call('loadScene', config.scene.id);
        }
    });
});
