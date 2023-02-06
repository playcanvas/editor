editor.once('load', function () {
    editor.on('entities:add', function (entity) {
        if (entity.history)
            return;

        var resourceId = entity.get('resource_id');

        entity.history = new ObserverHistory({
            item: entity,
            prefix: 'entity.' + resourceId + '.',
            history: editor.call('editor:history')
        });
    });
});
