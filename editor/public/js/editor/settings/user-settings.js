editor.once('load', function () {
    'use strict';

    // settings observer
    var settings = new Observer({
        editor: {
            howdoi: true
        }
    });

    // Get settings
    editor.method('settings:user', function () {
        return settings;
    });

    var doc;

    editor.on('realtime:authenticated', function () {
        var connection = editor.call('realtime:connection');
        doc = connection.get('settings', 'user_' + config.self.id);

        // handle errors
        doc.on('error', function (err) {
            editor.emit('settings:error', err);
        });

        // load settings
        doc.on('subscribe', function () {
            doc.whenReady(function () {
                var data = doc.getSnapshot();
                for (var key in data) {
                    settings.set(key, data[key]);
                }

                // server -> local
                doc.on('after op', function (ops, local) {
                    if (local) return;

                    for (var i = 0; i < ops.length; i++) {
                        settings.sync.write(ops[i]);
                    }
                });

                editor.emit('settings:user:load');
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
        if (doc)
            doc.submitOp([ op ]);
    });

    editor.on('realtime:disconnected', function () {
        if (doc) {
            doc.destroy();
            doc = null;
        }
    });
});
