editor.once('load', function () {
    editor.on('messenger:user.usage', function (data) {
        if (data.user !== config.owner.id) return;

        config.owner.size += data.usage.total;

        editor.emit('user:' + config.owner.id + ':usage', config.owner.size);
    });
});
