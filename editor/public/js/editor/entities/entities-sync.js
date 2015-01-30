editor.once('load', function() {
    'use strict';


    var syncPaths = [
        'name',
        'parent',
        'children',
        'position',
        'rotations',
        'scale',
        'enabled',
        'components'
    ];



    editor.on('entities:add', function(entity) {
        entity.sync = new ObserverSync({
            item: entity,
            prefix: [ 'entities', entity.resource_id ],
            paths: syncPaths
        });

        // client > server
        entity.sync.on('op', function(op) {
            // console.log(op.p.slice(2).join('.'))
            editor.call('realtime:op', op);
        });
    });



    // server > client
    editor.on('realtime:op:entities', function(op) {
        var entity = null;
        if (op.p[1])
            entity = editor.call('entities:get', op.p[1]);

        if (! entity)
            return;

        entity.sync.write(op);
    });
});
