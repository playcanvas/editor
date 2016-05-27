app.once('load', function() {
    'use strict';

    var auth = false;
    var socket = new SockJS(config.url.realtime.http);
    var connection = new sharejs.Connection(socket);
    var data;
    var reconnectAttempts = 0;
    var reconnectInterval = 1;

    app.method('realtime:connection', function () {
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
                    }
                } else if (! msg.data.startsWith('permissions') && ! msg.data.startsWith('whoisonline') && ! msg.data.startsWith('fs:')) {
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
            editor.emit('realtime:error', msg);
        });

        var onConnectionClosed = connection.socket.onclose;
        connection.socket.onclose = function (reason) {
            auth = false;

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
});
