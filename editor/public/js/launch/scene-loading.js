pc.editor = pc.editor || {};
pc.extend(pc.editor, function() {
    var loadScene = function(id, callback, settingsOnly) {
        var connection = editor.call('realtime:connection');
        scene = connection.get('scenes', '' + id);

        // error
        scene.on('error', function(err) {
            console.error('error', err);
        });

        // ready to sync
        scene.on('ready', function() {
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
            if (callback)
                callback(null, snapshot);
        });

        // subscribe for realtime events
        scene.subscribe();
    };

    return {
        loadScene: loadScene
    };
}());
