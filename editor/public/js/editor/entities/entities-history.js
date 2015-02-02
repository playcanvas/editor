editor.once('load', function() {
    'use strict';

    editor.on('entities:add', function(entity) {
        if (entity.history)
            return;

        entity.history = new ObserverHistory({
            item: entity,
            prefix: 'entity.' + entity.resource_id + '.'
        });

        // record history
        entity.history.on('record', function(action, data) {
            console.log(data.name);
            editor.call('history:' + action, data);
        });
    });
});
