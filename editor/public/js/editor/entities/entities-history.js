editor.once('load', function() {
    'use strict';

    editor.on('entities:add', function(entity) {
        entity.history = new ObserverHistory({
            item: entity
        });

        // register history action
        entity.history.on('add', function(data) {
            editor.call('history:add', data);
        });
    });
});
