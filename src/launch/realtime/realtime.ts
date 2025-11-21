import { share } from '../../common/sharedb';

editor.once('load', () => {
    let auth = false;
    let socket, connection;
    let data; // eslint-disable-line no-unused-vars
    let reconnectAttempts = 0;
    let reconnectInterval = 1;

    var connect;
    var reconnect;

    editor.method('realtime:connection', () => {
        return connection;
    });

    connect = function () {
        if (reconnectAttempts > 8) {
            editor.emit('realtime:cannotConnect');
            return;
        }

        reconnectAttempts++;
        editor.emit('realtime:connecting', reconnectAttempts);

        const shareDbMessage = connection.socket.onmessage;

        connection.socket.onmessage = function (msg) {
            try {
                if (msg.data.startsWith('auth')) {
                    if (!auth) {
                        auth = true;

                        data = JSON.parse(msg.data.slice(4));

                        editor.emit('realtime:authenticated');
                    }
                } else if (!msg.data.startsWith('permissions') && !msg.data.startsWith('chat') && !msg.data.startsWith('selection') && !msg.data.startsWith('whoisonline') && !msg.data.startsWith('fs:')) {
                    shareDbMessage(msg);
                }
            } catch (e) {
                log.error(e);
            }

        };

        connection.on('connected', function () {
            reconnectAttempts = 0;
            reconnectInterval = 1;

            this.socket.send(`auth${JSON.stringify({
                timeout: false
            })}`);

            editor.emit('realtime:connected');
        });

        connection.on('error', (msg) => {
            editor.emit('realtime:error', msg);
        });

        const onConnectionClosed = connection.socket.onclose;
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

    reconnect = function () {
        // create new socket...
        socket = new WebSocket(config.url.realtime.http);
        // ... and new sharedb connection
        connection = new share.Connection(socket);
        // connect again
        connect();
    };

    // instead of connecting to realtime immediately, we wait for a 'realtime:connect' event.
    // this is because connecting immediately will trigger asset load events in the scene and
    // as of engine v1.61.2 model assets compressed with draco will fail to load depending on
    // timing relative to draco wasm module loading.
    // this event can be removed (and the body executed immediately) when the engine supports
    // loading draco module on demand during model asset load.
    editor.method('realtime:connect', () => {
        if (editor.call('visibility')) {
            reconnect();
        } else {
            editor.once('visible', reconnect);
        }
    });
});
