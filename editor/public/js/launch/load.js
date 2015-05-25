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
            if (!scene) {
                app.call('loadScene', config.scene.id);
            }

        } else if (msg.data.startsWith('permissions') || msg.data.startsWith('whoisonline')) {
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
        console.error('realtime error:', msg);
    });

    editor.method('realtime:connection', function () {
        return connection;
    });
});
