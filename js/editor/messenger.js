editor.on('start', function () {
    if (!editor.messenger) return;

    editor.messenger.connect(config.url.messenger.ws);

    editor.messenger.on('connect', () => {
        editor.emit('messenger:connected');
    });

    editor.messenger.on('message', (name, data) => {
        editor.emit('messenger:' + name, data);
    });

    editor.method('messenger:isConnected', function () {
        return editor.messenger.isConnected;
    });

});
