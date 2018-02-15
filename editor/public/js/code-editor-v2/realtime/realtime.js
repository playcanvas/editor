editor.once('load', function () {
    'use strict';

    var RECONNECT_INTERVAL = 1
    var reconnectInterval = RECONNECT_INTERVAL;

    var connection;
    var socket;

    var isConnected = false;
    var isAuthenticated = false;

    var onError = function (err) {
        editor.emit('realtime:error', err);
    };

    var connect = function () {
        editor.emit('realtime:connecting');

        var msgBuffer = [];

        // When socket is connected send auth message
        var onOpen = function () {
            isConnected = true;
            reconnectInterval = RECONNECT_INTERVAL;
            socket.send('auth' + JSON.stringify({}));
        };

        // If socket is closed try to reconnect
        var onClose = function (reason) {
            isConnected = false;
            isAuthenticated = false;

            // disconnected event
            editor.emit('realtime:disconnected', reason);

            // try to reconnect after a while
            editor.emit('realtime:nextAttempt', reconnectInterval);

            if (editor.call('visibility')) {
                setTimeout(connect, reconnectInterval * 1000);
            } else {
                editor.once('visible', connect);
            }

            if (reconnectInterval < 5)
                reconnectInterval++;
        };

        // Handle initial messages until we are authenticated
        var onMessage = function (msg) {
            // put any irrelevant messages in the buffer
            if (! msg.data.startsWith('auth')) {
                msgBuffer.push(msg);
                return;
            }

            // handle authentication
            isAuthenticated = true;

            createShareDbConnection();

            editor.emit('realtime:connected');
            editor.emit('realtime:authenticated');
        };

        var createShareDbConnection = function () {
            if (! connection) {
                // if we are connecting for the first time
                // create new sharedb connection
                connection = new window.share.Connection(socket);
                connection.on('error', onError);
                connection.on('bs error', onError);
            } else {
                // we are re-connecting so bind new socket
                connection.bindToSocket(socket);
            }

            // hook handlers on socket
            var onShareDbMessage = connection.socket.onmessage;

            // Message handler
            connection.socket.onmessage = function(msg) {
                try {
                    if (msg.data.startsWith('auth')) {
                        if (! isAuthenticated) {
                            isAuthenticated = true;
                            editor.emit('realtime:authenticated');
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
                            onShareDbMessage(msg);
                        }
                    } else if (msg.data.startsWith('whoisonline:')) {
                        var parts = msg.data.split(':');
                        if (parts.length === 5 && parts[1] === 'doc') {
                            var data;
                            var doc = parts[2];
                            var op = parts[3];
                            if (op === 'set') {
                                data = JSON.parse(parts[4]);
                            } else if (op === 'add' || op === 'remove') {
                                data = parseInt(parts[4], 10);
                            }
                            editor.call('whoisonline:' + op, doc, data);
                        }
                    } else if (msg.data.startsWith('doc:save:')) {
                        var parts = msg.data.split(':');
                        if (parts.length === 4) {
                            if (parts[2] === 'success') {
                                editor.emit('documents:save:success', parseInt(parts[3], 10));
                            } else if (parts[2] === 'error') {
                                editor.emit('documents:save:error', parseInt(parts[3], 10));
                            }
                        }
                    } else {
                        onShareDbMessage(msg);
                    }
                } catch (e) {
                    onError(e);
                }
            };

            // Close handler
            var onConnectionClosed = connection.socket.onclose;
            connection.socket.onclose = function (reason) {
                onConnectionClosed(reason);
                onClose(reason);
            };

            // pass any buffered messages that came before
            // authentication to the connection
            for (var i = 0; i < msgBuffer.length; i++) {
                connection.socket.onmessage(msgBuffer[i]);
            }
            msgBuffer.length = 0;
        };

        // create new socket
        socket = new WebSocket(config.url.realtime.http);

        // handle authentication first before we start
        // doing sharedb stuff
        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onmessage = onMessage;
    };

    // Raw socket send
    editor.method('realtime:send', function (name, data) {
        if (isConnected)
            socket.send(name + JSON.stringify(data));
    });

    // get connection
    editor.method('realtime:connection', function () {
        return connection;
    });

    // True if connected and authenticated
    editor.method('realtime:isConnected', function () {
        return isAuthenticated;
    });

    // connect to C3
    if (editor.call('visibility')) {
        connect();
    } else {
        editor.once('visible', connect);
    }


});