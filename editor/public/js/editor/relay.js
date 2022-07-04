editor.on('start', function () {
    'use strict';

    if (typeof RelayServer === 'undefined')
        return;

    const relay = new RelayServer();

    if (editor.call('permissions:read')) {
        relay.connect(config.url.relay.ws);
    }

    relay.on('connect', () => {
        editor.emit('relay:connected');
    });

    relay.on('disconnect', () => {
        editor.emit('relay:disconnected');
    });

    relay.on('message', evt => {
        editor.emit('relay:' + evt.t, evt);
    });

    relay.on('error', err => {
        console.error('Relay server: ' + err);
        editor.emit('relay:error', err);
    });

    editor.method('relay:isConnected', () => {
        return relay.isConnected;
    });

    editor.method('relay:joinRoom', name => {
        relay.joinRoom(name, {
            type: 'project',
            id: config.project.id
        });
    });

    editor.method('relay:leaveRoom', name => {
        relay.leaveRoom(name);
    });

    editor.method('relay:broadcast', (name, msg) => {
        relay.broadcast(name, msg);
    });

    editor.method('relay:dm', (name, msg, recipient) => {
        relay.dm(name, msg, recipient);
    });

    window.relay = relay;
});
