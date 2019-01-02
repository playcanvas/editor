editor.once('load', function () {
    'use strict';

    // settings observer
    var settings = new Observer({
        ide: {
            fontSize: 12,
            continueComments: true,
            autoCloseBrackets: true,
            highlightBrackets: true
        }
    });

    // Get settings
    editor.method('editor:settings', function () {
        return settings;
    });

    var doc;

    editor.on('realtime:authenticated', function () {
        if (doc) {
            if (!doc.subscribed) {
                doc.subscribe();
            }

            doc.resume();
            return;
        }

        var connection = editor.call('realtime:connection');
        doc = connection.get('settings', 'user_' + config.self.id);

        // handle errors
        doc.on('error', function (err) {
            editor.emit('settings:error', err);
        });

        // load settings
        doc.on('load', function () {
            var data = doc.data;
            for (var key in data) {
                settings.set(key, data[key]);
            }

            // server -> local
            doc.on('op', function (ops, local) {
                if (local) return;

                for (var i = 0; i < ops.length; i++) {
                    settings.sync.write(ops[i]);
                }
            });
        });

        // subscribe for realtime events
        doc.subscribe();
    });

    // local -> server
    settings.sync = new ObserverSync({
        item: settings,
        paths: Object.keys(settings._data)
    });
    settings.sync.on('op', function (op) {
        doc.submitOp([ op ]);
    });

    editor.on('realtime:disconnected', function () {
        if (doc)
            doc.pause();
    });
});
