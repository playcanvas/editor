app.once('load', function() {
    'use strict';

    var auth = false;
    var socket = new SockJS(config.url.realtime.http);
    var connection = new sharejs.Connection(socket);
    var scene = null;

    var sharejsMessage = connection.socket.onmessage;
    connection.socket.onmessage = function(msg) {
        if (! auth && msg.data.startsWith('auth')) {
            auth = true;
            var data = JSON.parse(msg.data.slice(4));

            // load scene
            if (! scene)
                loadScene();

        } else if (msg.data.startsWith('permissions')) {
            // var data = JSON.parse(msg.data.slice('permissions'.length));
            // console.log(data);
            // editor.call('permissions:set', data.write);
        } else {
            sharejsMessage(msg);
        }
    };

    connection.on('connected', function() {
        this.socket.send('auth' + JSON.stringify({
            accessToken: config.accessToken
        }));
    });

    connection.on('error', function(msg) {
        console.log('realtime error:', msg);
    });


    var loadScene = function() {
        scene = connection.get('scenes', '' + config.scene.id);

        // error
        scene.on('error', function(err) {
            console.log('error', err);
        });

        // ready to sync
        scene.on('ready', function() {
            // notify of operations
            scene.on('after op', function(ops, local) {
                if (local)
                    return;

                for (var i = 0; i < ops.length; i++) {
                    var op = ops[i];

                    // console.log('in: [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));

                    if (op.p[0])
                        app.emit('realtime:op:' + op.p[0], op);
                }
            });

            // notify of scene load
            app.emit('scene:raw', scene.getSnapshot());
        });

        // subscribe for realtime events
        scene.subscribe();
    };
});
