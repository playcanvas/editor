editor.once('load', function() {
    'use strict';

    editor.once('start', function() {
        editor.emit('realtime:connecting');


        var socket = new SockJS(config.url.realtime.http);
        var connection = new sharejs.Connection(socket);


        connection.on('error', function(msg) {
            console.log('realtime error:', msg);
        });


        var scene = connection.get('scenes', '' + config.scene.id);


        scene.on('error', function(err) {
            console.log('error', err);
        });


        scene.on('ready', function() {
            // notify of operations
            scene.on('after op', function(ops, local) {
                if (local)
                    return;

                for (var i = 0; i < ops.length; i++) {
                    var op = ops[i];

                    // console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));

                    if (op.p[0])
                        editor.emit('realtime:op:' + op.p[0], op);
                }
            });

            // notify of scene load
            editor.emit('scene:raw', scene.getSnapshot());
        });


        scene.subscribe();


        // method to send operations
        editor.method('realtime:op', function(op) {

            // console.log('out: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));

            scene.submitOp([ op ]);
        });
    });
});
