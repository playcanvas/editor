editor.once('load', function() {
    'use strict';

    var userData = null;

    var loadUserData = function () {
        if (! userData && config.scene.id) {
            userData = editor.call('realtime:subscribe:userdata', config.scene.id, config.self.id);
        }
    };

    editor.method('realtime:subscribe:userdata', function (sceneId, userId) {
        var connection = editor.call('realtime:connection');
        var data = connection.get('user_data', '' + sceneId + '_' + userId);

        // error
        data.on('error', function (err) {
            editor.emit('realtime:userdata:error', err);
        });

        // ready to sync
        data.on('load', function() {
            // notify of operations
            data.on('op', function(ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    if (ops[i].p[0])
                        editor.emit('realtime:userdata:' + userId + ':op:' + ops[i].p[0], ops[i]);
                }
            });

            // notify of scene load
            editor.emit('userdata:' + userId + ':raw', data.data);
        });

        // subscribe for realtime events
        data.subscribe();

        if (data.state === 'ready')
            editor.emit('userdata:' + userId + ':raw', data.data);

        return data;
    });

    // write userdata operations
    editor.method('realtime:userdata:op', function(op) {
        if (! editor.call('permissions:read') || ! userData)
            return;

        // console.trace();
        // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
        // console.log(op)

        userData.submitOp([ op ]);
    });

    // subscribe to permission changes for userdata
    editor.on('permissions:set:' + config.self.id, function () {
        if (editor.call('permissions:read') && config.scene.id) {
            loadUserData();
        } else {
            if (userData) {
                userData.destroy();
                userData = null;
            }
        }
    });

    editor.on('realtime:disconnected', function () {
        if (userData) {
            userData.destroy();
            userData = null;
        }
    });

    editor.on('scene:unload', function () {
        if (userData) {
            userData.destroy();
            userData = null;
        }
    });

    editor.on('scene:raw', function () {
        if (editor.call('permissions:read'))
            loadUserData();
    });

});
