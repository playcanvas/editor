editor.once('load', function() {
    'use strict';

    editor.once('start', function() {
        var auth = false;

        var socket, connection;
        var scene = null;
        var data;
        var reconnectAttempts = 0;
        var reconnectInterval = 3;

        editor.method('realtime:connection', function () {
            return connection;
        });

        var connect = function () {
            if (reconnectAttempts > 4) {
                editor.emit('realtime:cannotConnect');
                return;
            }

            reconnectAttempts++;
            editor.emit('realtime:connecting', reconnectAttempts);

            var shareDbMessage = connection.socket.onmessage;

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
                        var parts = msg.data.split(':');
                        if (parts.length === 5 && parts[1] === 'scene') {
                            var data;
                            var scene = parts[2];
                            var op = parts[3];
                            if (op === 'set') {
                                data = JSON.parse(parts[4]);
                            } else if (op === 'add' || op === 'remove') {
                                data = parseInt(parts[4], 10);
                            }
                            editor.call('whoisonline:' + op, data);
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
                    } else if (msg.data.startsWith('selection')) {
                        var data = msg.data.slice('selection:'.length);
                        editor.emit('selector:sync:raw', data);
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
                            shareDbMessage(msg);
                        }
                    } else {
                        shareDbMessage(msg);
                    }
                } catch (e) {
                    console.error(e);
                }

            };

            connection.on('connected', function() {
                reconnectAttempts = 0;
                reconnectInterval = 3;

                this.socket.send('auth' + JSON.stringify({
                    accessToken: config.accessToken
                }));

                editor.emit('realtime:connected');
            });

            connection.on('error', function(msg) {
                if (connection.state === 'connected')
                    return;
                editor.emit('realtime:error', msg);
            });

            connection.on('bs error', function (msg) {
                editor.call('status:error', msg);
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

                if (editor.call('visibility')) {
                    setTimeout(reconnect, reconnectInterval * 1000);
                } else {
                    editor.once('visible', reconnect);
                }

                reconnectInterval++;
            };
        };

        var reconnect = function () {
            // create new socket...
            socket = new WebSocket(config.url.realtime.http);
            // ... and new sharedb connection
            connection = new window.share.Connection(socket);
            // connect again
            connect();
        };

        if (editor.call('visibility')) {
            reconnect();
        } else {
            editor.once('visible', reconnect);
        }

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
            scene.on('load', function() {
                // notify of operations
                scene.on('op', function(ops, local) {
                    if (local) return;

                    for (var i = 0; i < ops.length; i++)
                        emitOp('scene', ops[i]);
                });

                // notify of scene load
                editor.emit('scene:load', id);
                editor.emit('scene:raw', scene.data);
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
            // console.log(name, data);
            if (socket.readyState === 1)
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
