editor.on('start', () => {
    const messenger = editor.api.globals.messenger;
    if (!messenger) {
        return;
    }

    messenger.connect(config.url.messenger.ws);

    messenger.on('connect', () => {
        editor.emit('messenger:connected');
    });

    messenger.on('message', (name, data) => {
        editor.emit(`messenger:${name}`, data);
    });

    editor.method('messenger:isConnected', () => {
        return messenger.isConnected;
    });

});
