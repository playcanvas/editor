editor.once('load', function() {
    'use strict';


    var syncPaths = [
        'name',
        'parent',
        'children',
        'position',
        'rotation',
        'scale',
        'enabled',
        'components'
    ];



    editor.on('entities:add', function(entity) {
        if (entity.sync)
            return;

        entity.sync = new ObserverSync({
            item: entity,
            prefix: [ 'entities', entity.resource_id ],
            paths: syncPaths
        });

        // client > server
        entity.sync.on('op', function(op) {
            editor.call('realtime:op', op);
        });
    });


    // server > client
    editor.on('realtime:op:entities', function(op) {
        var entity = null;
        if (op.p[1])
            entity = editor.call('entities:get', op.p[1]);

        if (op.p.length === 2) {
            if (op.hasOwnProperty('od')) {
                // delete entity
                if (entity) {
                    editor.call('entities:remove', entity);
                } else {
                    console.log('delete operation entity not found', op);
                }
            } else if (op.hasOwnProperty('oi')) {
                // new entity
                entity = new Observer(op.oi);
                editor.call('entities:add', entity);
            } else {
                console.log('unknown operation', op);
            }
        } else if (entity) {
            // write operation
            entity.sync.write(op);
        } else {
            console.log('unknown operation', op);
        }
    });
});
