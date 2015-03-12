editor.once('load', function() {
    'use strict';

    editor.once('start', function() {
        editor.emit('realtime:connecting');

        var auth = false;
        var socket = new SockJS(config.url.realtime.http);
        var connection = new sharejs.Connection(socket);
        var scene = null;
        var userData = null;
        var data;

        var sharejsMessage = connection.socket.onmessage;

        connection.socket.onmessage = function(msg) {
            if (! auth && msg.data.startsWith('auth')) {
                auth = true;
                data = JSON.parse(msg.data.slice(4));

                // load scene
                if (! scene)
                    loadScene();

                // load user data
                if (! userData)
                   loadUserData();

            } else if (msg.data.startsWith('permissions')) {
                data = JSON.parse(msg.data.slice('permissions'.length));
                editor.call('permissions:set', data.write);
            } else if (msg.data.startsWith('whoisonline:')) {
                data = msg.data.slice('whoisonline:'.length);
                var ind = data.indexOf(':');
                if (ind !== -1) {
                    var op = data.slice(0, ind);
                    if (op === 'set') {
                        data = JSON.parse(data.slice(ind + 1));
                    } else if (op === 'add' || op === 'remove') {
                        data = parseInt(data.slice(ind + 1), 10);
                    }
                    editor.call('whoisonline:' + op, data);
                } else {
                    sharejsMessage(msg);
                }
            } else {
                sharejsMessage(msg);
            }
        };

        connection.on('connected', function() {
            this.socket.send('auth' + JSON.stringify({
                accessToken: config.accessToken
            }));
        });

        connection.on('error', function(msg) {
            console.log('realtime error:', msg);
        });

        var emitOp = function(type, op) {
            // console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op);

            if (op.p[0])
                editor.emit('realtime:' + type + ':op:' + op.p[0], op);
        };

        var loadScene = function() {
            scene = connection.get('scenes', '' + config.scene.id);

            // error
            scene.on('error', function(err) {
                console.log('error', err);
            });

            // ready to sync
            scene.on('ready', function() {
                // notify of operations
                scene.on('after op', function(ops, local) {
                    if (local) return;

                    for (var i = 0; i < ops.length; i++)
                        emitOp('scene', ops[i]);
                });

                // notify of scene load
                editor.emit('scene:raw', scene.getSnapshot());
            });

            // subscribe for realtime events
            scene.subscribe();
        };

        var loadUserData = function () {
            userData = connection.get('user_data', '' + config.scene.id + '_' + config.self.id);

            // error
            userData.on('error', function (err) {
                console.log('error', err);
            });

            // ready to sync
            userData.on('ready', function() {
                // notify of operations
                userData.on('after op', function(ops, local) {
                    if (local) return;

                    for (var i = 0; i < ops.length; i++)
                        emitOp('scene', ops[i]);
                });

                // notify of scene load
                editor.emit('userdata:raw', userData.getSnapshot());
            });

            // subscribe for realtime events
            userData.subscribe();
        };

        // write scene operations
        editor.method('realtime:scene:op', function(op) {
            if (! editor.call('permissions:write') || ! scene)
                return;

            // console.trace();
            // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op)

            scene.submitOp([ op ]);
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
    });
});
