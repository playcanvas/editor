editor.once('load', function() {
    'use strict';

    editor.once('start', function() {
        var auth = false;
        var socket = new SockJS(config.url.realtime.http);
        var connection = new sharejs.Connection(socket);
        var scene = null;
        var data;
        var reconnectAttempts = 0;
        var reconnectInterval = 1;

        editor.method('realtime:connection', function () {
            return connection;
        });

        var connect = function () {
            if (reconnectAttempts > 8) {
                editor.emit('realtime:cannotConnect');
                return;
            }

            reconnectAttempts++;
            editor.emit('realtime:connecting', reconnectAttempts);

            var sharejsMessage = connection.socket.onmessage;

            connection.socket.onmessage = function(msg) {
                try {
                    if (msg.data.startsWith('auth')) {
                        if (!auth) {
                            auth = true;
                            data = JSON.parse(msg.data.slice(4));

                            editor.emit('realtime:authenticated');

                            // load scene
                            if (! scene && config.scene.id)
                                editor.call('realtime:loadScene', config.scene.id);
                        }
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
                    } else if (msg.data.startsWith('chat:')) {
                        data = msg.data.slice('chat:'.length);

                        var ind = data.indexOf(':');
                        if (ind !== -1) {
                            var op = data.slice(0, ind);
                            data = JSON.parse(data.slice(ind + 1));

                            if (op === 'typing') {
                                editor.call('chat:sync:typing', data);
                            } else if (op === 'msg') {
                                editor.call('chat:sync:msg', data);
                            }
                        }
                    } else if (msg.data.startsWith('fs:')) {
                        data = msg.data.slice('fs:'.length);
                        var ind = data.indexOf(':');
                        if (ind !== -1) {
                            var op = data.slice(0, ind);
                            if (op === 'paths') {
                                data = JSON.parse(data.slice(ind + 1));
                                editor.call('assets:fs:paths:patch', data);
                            }
                        } else {
                            sharejsMessage(msg);
                        }
                    } else if (msg.data.startsWith('project:save:error')) {
                        console.error('Error saving project setting: ' + msg.data.slice(19));
                    } else {
                        sharejsMessage(msg);
                    }
                } catch (e) {
                    console.error(e);
                }

            };

            connection.on('connected', function() {
                reconnectAttempts = 0;
                reconnectInterval = 1;

                this.socket.send('auth' + JSON.stringify({
                    accessToken: config.accessToken
                }));

                editor.emit('realtime:connected');
            });

            connection.on('error', function(msg) {
                if (connection.state === 'connected') {
                    console.log(msg);
                    return;
                }

                editor.emit('realtime:error', msg);
            });

            var onConnectionClosed = connection.socket.onclose;
            connection.socket.onclose = function (reason) {
                auth = false;

                if (scene) {
                    scene.destroy();
                    scene = null;
                }

                editor.emit('realtime:disconnected', reason);
                onConnectionClosed(reason);

                // try to reconnect after a while
                editor.emit('realtime:nextAttempt', reconnectInterval);

                setTimeout(reconnect, reconnectInterval * 1000);

                reconnectInterval++;
            };
        };

        var reconnect = function () {
            // create new socket...
            socket = new SockJS(config.url.realtime.http);
            // ... and new sharejs connection
            connection = new sharejs.Connection(socket);
            // connect again
            connect();
        };

        connect();

        var emitOp = function(type, op) {
            // console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op);

            if (op.p[0])
                editor.emit('realtime:' + type + ':op:' + op.p[0], op);
        };

        editor.method('realtime:loadScene', function (id) {
            scene = connection.get('scenes', '' + id);

            // error
            scene.on('error', function(err) {
                editor.emit('realtime:scene:error', err);
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
                editor.emit('scene:load', id);
                editor.emit('scene:raw', scene.getSnapshot());
            });

            // subscribe for realtime events
            scene.subscribe();
        });

        // write scene operations
        editor.method('realtime:scene:op', function(op) {
            if (! editor.call('permissions:write') || ! scene)
                return;

            // console.trace();
            // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op)

            try {
                scene.submitOp([ op ]);
            } catch (e) {
                console.error(e);
                editor.emit('realtime:scene:error', e);
            }
        });

        editor.method('realtime:send', function(name, data) {
            socket.send(name + JSON.stringify(data));
        });

        editor.on('realtime:disconnected', function () {
            editor.emit('permissions:writeState', false);
        });

        editor.on('realtime:connected', function () {
            editor.emit('permissions:writeState', editor.call('permissions:write'));
        });

        editor.on('scene:unload', function (id) {
            if (scene) {
                scene.destroy();
                scene = null;

                connection.socket.send('close:scene:' + id);
            }
        });
    });
});
