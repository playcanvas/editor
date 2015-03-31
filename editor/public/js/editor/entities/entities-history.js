editor.once('load', function() {
    'use strict';

    editor.on('entities:add', function(entity) {
        if (entity.history)
            return;

        var resourceId = entity.get('resource_id');

        entity.history = new ObserverHistory({
            item: entity,
            prefix: 'entity.' + entity.get('resource_id') + '.',
            onGetItem: function() {
                return editor.call('entities:get', resourceId);
            }
        });

        // record history
        entity.history.on('record', function(action, data) {
            editor.call('history:' + action, data);
        });
    });
});
