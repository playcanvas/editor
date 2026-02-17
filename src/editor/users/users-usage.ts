editor.once('load', () => {
    editor.on('messenger:user.usage', (data: unknown) => {
        if (data.user !== config.owner.id) {
            return;
        }

        config.owner.size += data.usage.total;

        editor.emit(`user:${config.owner.id}:usage`, config.owner.size);
    });
});
