editor.once('load', function() {
    'use strict';

    var auth = false;
    var socket, connection;
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

        var shareDbMessage = connection.socket.onmessage;

        connection.socket.onmessage = function(msg) {
            try {
                if (msg.data.startsWith('auth')) {
                    if (!auth) {
                        auth = true;
                        data = JSON.parse(msg.data.slice(4));

                        editor.emit('realtime:authenticated');
                    }
                } else if (! msg.data.startsWith('permissions') && ! msg.data.startsWith('chat') && ! msg.data.startsWith('selection') && ! msg.data.startsWith('whoisonline') && ! msg.data.startsWith('fs:')) {
                    shareDbMessage(msg);
                }
            } catch (e) {
                console.error(e);
            }

        };

        connection.on('connected', function() {
            reconnectAttempts = 0;
            reconnectInterval = 1;

            this.socket.send('auth' + JSON.stringify({
                timeout: false
            }));

            editor.emit('realtime:connected');
        });

        connection.on('error', function(msg) {
            console.log('3');
            editor.emit('realtime:error', msg);
        });

        var onConnectionClosed = connection.socket.onclose;
        connection.socket.onclose = function (reason) {
            auth = false;

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
});
