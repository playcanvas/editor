editor.once('load', function () {
    'use strict';

    var RECONNECT_INTERVAL = 1
    var reconnectInterval = RECONNECT_INTERVAL;

    var connection;
    var socket;

    var isConnected = false;
    var isAuthenticated = false;

    var onError = function (err) {
        console.error(err);
        editor.emit('realtime:error', err);
    };

    var connect = function () {
        editor.emit('realtime:connecting');

        socket = new WebSocket(config.url.realtime.http);

        // if we are connecting for the first time
        // create new sharejs connection
        if (! connection) {
            connection = new sharejs.Connection(socket);

            connection.on('connected', function () {
                reconnectInterval = RECONNECT_INTERVAL;

                // send auth message
                this.socket.send('auth' + JSON.stringify({
                    accessToken: config.accessToken
                }));

                isConnected = true;
                editor.emit('realtime:connected');
            });
        } else {
            // we are re-connecting so bind new socket
            connection.bindToSocket(socket);
        }

        // hook handlers on socket
        var onSharejsMessage = connection.socket.onmessage;

        // Message handler
        connection.socket.onmessage = function(msg) {
            try {
                if (msg.data.startsWith('auth')) {
                    if (! isAuthenticated) {
                        isAuthenticated = true;
                        editor.emit('realtime:authenticated');
                    }
                } else if (msg.data.startsWith('whoisonline:')) {
                    var data = msg.data.slice('whoisonline:'.length);
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
                        onSharejsMessage(msg);
                    }
                } else {
                    onSharejsMessage(msg);
                }
            } catch (e) {
                onError(e);
            }
        };

        // Close handler
        var onConnectionClosed = connection.socket.onclose;
        connection.socket.onclose = function (reason) {
            onConnectionClosed(reason);

            isConnected = false;
            isAuthenticated = false;

            // disconnected event
            editor.emit('realtime:disconnected', reason);

            // try to reconnect after a while
            editor.emit('realtime:nextAttempt', reconnectInterval);

            if (editor.call('visibility')) {
                setTimeout(connect, reconnectInterval * 1000);
            } else {
                editor.once('visible', reconnect);
            }

            if (reconnectInterval < 5)
                reconnectInterval++;
        };

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
        editor.once('visible', reconnect);
    }


});