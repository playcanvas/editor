editor.once('load', function() {
    'use strict';

    // list of paths that has combined history
    var combineFields = [
        'position',
        'position.0',
        'position.1',
        'position.2',

        'rotation',
        'rotation.0',
        'rotation.1',
        'rotation.2',

        'scale',
        'scale.0',
        'scale.1',
        'scale.2'
    ];

    editor.on('entities:add', function(entity) {
        entity.history = new ObserverHistory({
            item: entity
        });

        // register history action
        entity.history.on('add', function(data) {
            // get path
            var path = data.name;
            // set full name
            data.name = 'entity.' + entity.resource_id + '.' + data.name;

            // check if path is within combineFields list and last history operation is for same field
            if (combineFields.indexOf(path) !== -1 && editor.call('history:canUndo') && editor.call('history:current').name === data.name) {
                // then update last history operation
                editor.call('history:update', data);
            } else {
                // otherwise add new history record
                editor.call('history:add', data);
            }
        });
    });
});
