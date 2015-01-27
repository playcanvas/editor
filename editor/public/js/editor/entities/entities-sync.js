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


    // client > server
    editor.on('entities:add', function(entity) {
        entity.sync = true;

        // object set
        entity.on('*:set', function(path, value, valueOld) {
            if (! this.sync)
                return;

            var allowedPath = false;
            for(var i = 0; i < syncPaths.length; i++) {
                if (path.indexOf(syncPaths[i]) !== -1) {
                    allowedPath = true;
                    break;
                }
            }

            // path is not allowed
            if (! allowedPath)
                return;

            // operation
            var op;

            // full path
            var p = [ 'entities', this.resource_id ].concat(path.split('.'));

            // can be array value
            var ind = path.lastIndexOf('.');
            if (ind !== -1 && (entity.get(path.slice(0, ind)) instanceof Array)) {
                // array index should be int
                p[p.length - 1] = parseInt(p[p.length - 1], 10);

                // list item set
                op = {
                    p: p,
                    li: value,
                    ld: valueOld
                };
            } else {
                // object item set
                op = {
                    p: p,
                    oi: value,
                    od: valueOld
                };
            }

            // send operation
            editor.call('realtime:op', op);
        });

        // list move
        entity.on('*:move', function(path, value, ind, indOld) {
            if (! this.sync) return;

            editor.call('realtime:op', {
                p: [ 'entities', this.resource_id ].concat(path.split('.')).concat([ indOld ]),
                lm: ind
            });
        });

        // list remove
        entity.on('*:remove', function(path, value, ind) {
            if (! this.sync) return;

            editor.call('realtime:op', {
                p: [ 'entities', this.resource_id ].concat(path.split('.')).concat([ ind ]),
                ld: value
            });
        });

        // list insert
        entity.on('*:insert', function(path, value, ind) {
            if (! this.sync) return;

            editor.call('realtime:op', {
                p: [ 'entities', this.resource_id ].concat(path.split('.')).concat([ ind ]),
                li: value
            });
        });

    });


    // server > client
    editor.on('realtime:op:entities', function(op) {
        var entity = null;
        if (op.p[1])
            entity = editor.call('entities:get', op.p[1]);

        if (! entity)
            return;

        if (op.hasOwnProperty('od') && op.hasOwnProperty('oi')) {
            // set key value
            var path = op.p.slice(2).join('.');

            entity.sync = false;
            entity.set(path, op.oi);
            entity.sync = true;


        } else if (op.hasOwnProperty('ld') && op.hasOwnProperty('li')) {
            // set array value
            var path = op.p.slice(2).join('.');

            entity.sync = false;
            entity.set(path, op.li);
            entity.sync = true;


        } else if (op.hasOwnProperty('ld')) {
            // delete item
            var path = op.p.slice(2, -1).join('.');

            entity.sync = false;
            entity.remove(path, op.ld);
            entity.sync = true;


        } else if (op.hasOwnProperty('li')) {
            // add item
            var path = op.p.slice(2, -1).join('.');
            var ind = op.p[op.p.length - 1];

            entity.sync = false;
            entity.insert(path, op.li, ind);
            entity.sync = true;


        } else if (op.hasOwnProperty('lm')) {
            // item moved
            var path = op.p.slice(2, -1).join('.');
            var indOld = op.p[op.p.length - 1];
            var ind = op.lm;

            entity.sync = false;
            entity.move(path, entity.get(path + '.' + indOld), ind);
            entity.sync = true;
        } else {
            console.log('entity unknown operation', op);
        }
    });
});
