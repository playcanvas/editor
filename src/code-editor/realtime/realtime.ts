import { share } from '../../common/sharedb.ts';

editor.once('load', () => {
    const RECONNECT_INTERVAL = 1;
    let reconnectInterval = RECONNECT_INTERVAL;

    let connection;
    let socket;

    let isConnected = false;
    let isAuthenticated = false;

    const onError = function (err) {
        editor.emit('realtime:error', err);
    };

    const connect = function () {
        editor.emit('realtime:connecting');

        const msgBuffer = [];

        // When socket is connected send auth message
        const onOpen = function () {
            isConnected = true;
            reconnectInterval = RECONNECT_INTERVAL;
            socket.send(`auth${JSON.stringify({})}`);
        };

        // If socket is closed try to reconnect
        const onClose = function (reason) {
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

            if (reconnectInterval < 5) {
                reconnectInterval++;
            }
        };

        const createShareDbConnection = function () {
            if (!connection) {
                // if we are connecting for the first time
                // create new sharedb connection
                connection = new share.Connection(socket);
                connection.on('error', onError);
                connection.on('bs error', onError);
            } else {
                // we are re-connecting so bind new socket
                connection.bindToSocket(socket);
            }

            // hook handlers on socket
            const onShareDbMessage = connection.socket.onmessage;

            // Message handler
            connection.socket.onmessage = function (msg) {
                try {
                    if (msg.data.startsWith('auth')) {
                        if (!isAuthenticated) {
                            isAuthenticated = true;
                            editor.emit('realtime:authenticated');
                        }
                    } else if (msg.data.startsWith('fs:')) {
                        let data = msg.data.slice('fs:'.length);
                        const ind = data.indexOf(':');
                        if (ind !== -1) {
                            const op = data.slice(0, ind);
                            if (op === 'paths') {
                                data = JSON.parse(data.slice(ind + 1));
                                editor.call('assets:fs:paths:patch', data);
                            }
                        } else {
                            onShareDbMessage(msg);
                        }
                    } else if (msg.data.startsWith('whoisonline:')) {
                        // const parts = msg.data.split(':');
                        // if (parts.length === 5 && parts[1] === 'doc') {
                        //     let data;
                        //     const doc = parts[2];
                        //     const op = parts[3];
                        //     if (op === 'set') {
                        //         data = JSON.parse(parts[4]);
                        //     } else if (op === 'add' || op === 'remove') {
                        //         data = parseInt(parts[4], 10);
                        //     }
                        //     editor.call('whoisonline:' + op, doc, data);
                        // }
                    } else if (msg.data.startsWith('doc:save:')) {
                        const parts = msg.data.split(':');
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
            const onConnectionClosed = connection.socket.onclose;
            connection.socket.onclose = function (reason) {
                onConnectionClosed(reason);
                onClose(reason);
            };

            // pass any buffered messages that came before
            // authentication to the connection
            for (let i = 0; i < msgBuffer.length; i++) {
                connection.socket.onmessage(msgBuffer[i]);
            }
            msgBuffer.length = 0;
        };

        // Handle initial messages until we are authenticated
        const onMessage = function (msg) {
            // put any irrelevant messages in the buffer
            if (!msg.data.startsWith('auth')) {
                msgBuffer.push(msg);
                return;
            }

            // handle authentication
            isAuthenticated = true;

            createShareDbConnection();

            editor.emit('realtime:connected');
            editor.emit('realtime:authenticated');
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
    editor.method('realtime:send', (name, data) => {
        if (isConnected) {
            socket.send(name + JSON.stringify(data));
        }
    });

    // get connection
    editor.method('realtime:connection', () => {
        return connection;
    });

    // True if connected and authenticated
    editor.method('realtime:isConnected', () => {
        return isAuthenticated;
    });

    // connect to C3
    if (editor.call('visibility')) {
        connect();
    } else {
        editor.once('visible', connect);
    }
});
