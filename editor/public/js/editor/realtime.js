editor.once('load', function() {
    'use strict';

    editor.once('start', function() {
        editor.emit('realtime:connecting');

        var auth = false;
        var socket = new SockJS(config.url.realtime.http);
        var connection = new sharejs.Connection(socket);
        var scene = null;
        var data;

        var sharejsMessage = connection.socket.onmessage;

        connection.socket.onmessage = function(msg) {
            if (! auth && msg.data.startsWith('auth')) {
                auth = true;
                data = JSON.parse(msg.data.slice(4));

                // load scene
                if (! scene)
                    loadScene();

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
            editor.emit('realtime:connected');
        });

        connection.on('error', function(msg) {
            console.log('realtime error:', msg);
            editor.emit('realtime:error', msg);
        });

        editor.method('realtime:connection', function () {
            return connection;
        });

        var emitOp = function(type, op) {
            //console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            //console.log(op);


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

        // write scene operations
        editor.method('realtime:scene:op', function(op) {
            if (! editor.call('permissions:write') || ! scene)
                return;

            // console.trace();
            // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op)

            scene.submitOp([ op ]);
        });
    });
});
