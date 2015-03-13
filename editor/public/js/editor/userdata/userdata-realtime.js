editor.once('load', function() {
    'use strict';

    var userData = null;

    editor.once('scene:raw', function () {
        if (editor.call('permissions:write'))
            loadUserData();
    });

    var loadUserData = function () {
        if (! userData) {
            userData = editor.call('realtime:subscribe:userdata', config.scene.id, config.self.id);
        }
    };

    editor.method('realtime:subscribe:userdata', function (sceneId, userId) {
        var connection = editor.call('realtime:connection');
        var data = connection.get('user_data', '' + sceneId + '_' + userId);

        // error
        data.on('error', function (err) {
            editor.emit('userdata:' + userId + ':error', err);
        });

        // ready to sync
        data.on('ready', function() {
            // notify of operations
            data.on('after op', function(ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    if (ops[i].p[0])
                        editor.emit('realtime:userdata:' + userId + ':op:' + ops[i].p[0], ops[i]);
                }
            });

            // notify of scene load
            editor.emit('userdata:' + userId + ':raw', data.getSnapshot());
        });

        // subscribe for realtime events
        data.subscribe();

        if (data.state === 'ready') {
            editor.emit('userdata:' + userId + ':raw', data.getSnapshot());
        }

        return data;
    });

    // write userdata operations
    editor.method('realtime:userdata:op', function(op) {
        if (! editor.call('permissions:write') || ! userData)
            return;

        // console.trace();
        // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
        // console.log(op)

        userData.submitOp([ op ]);
    });

    // subscribe to permission changes for userdata
    editor.on('permissions:set:' + config.self.id, function () {
        if (editor.call('permissions:write')) {
            loadUserData();
        } else {
            if (userData) {
                userData.unsubscribe();
                userData = null;
            }
        }
    });
});
