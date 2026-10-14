editor.on('start', () => {
    const messenger = editor.api.globals.messenger;
    if (!messenger) {
        return;
    }

    messenger.connect(config.url.messenger.ws);

    messenger.on('connected', () => {
        editor.emit('messenger:connected');
    });

    messenger.on('cannotConnect', () => {
        editor.emit('messenger:cannotConnect');
    });

    messenger.on('message', (name: string, data: unknown) => {
        editor.emit(`messenger:${name}`, data);
    });

    editor.method('messenger:isConnected', () => {
        return messenger.isConnected;
    });
});
