editor.once('load', function () {

    var syncPaths = [
        'name',
        'tags',
        'parent',
        'children',
        'position',
        'rotation',
        'scale',
        'enabled',
        'template_id',
        'template_ent_ids',
        'components'
    ];

    function addObserverSync(entity) {
        if (entity.sync)
            return;

        entity.sync = new ObserverSync({
            item: entity,
            prefix: ['entities', entity.get('resource_id')],
            paths: syncPaths
        });

        // client > server
        entity.sync.on('op', function (op) {
            editor.call('realtime:scene:op', op);
        });
    }

    editor.on('entities:add', addObserverSync);

    // server > client
    editor.on('realtime:scene:op:entities', function (op) {
        var entity = null;
        if (op.p[1])
            entity = editor.entities.get(op.p[1]);

        if (op.p.length === 2) {
            if (op.hasOwnProperty('od')) {
                // delete entity
                if (entity) {
                    editor.entities.serverRemove(entity);
                } else {
                    console.log('delete operation entity not found', op);
                }
            } else if (op.hasOwnProperty('oi')) {
                // new entity
                editor.entities.serverAdd(op.oi);
            } else {
                console.log('unknown operation', op);
            }
        } else if (entity) {
            // write operation
            entity._observer.sync.write(op);
        } else {
            console.log('unknown operation', op);
        }
    });
});
