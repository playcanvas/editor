editor.on('load', () => {
    const messenger = editor.api.globals.messenger;
    if (!messenger) {
        return;
    }

    messenger.connect(config.url.messenger.ws);

    messenger.on('message', (name, data) => {
        editor.emit(`messenger:${name}`, data);
    });
});
