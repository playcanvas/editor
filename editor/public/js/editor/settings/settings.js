editor.once('load', function () {
    'use strict';

    editor.method('settings:create', function (args) {
        // settings observer
        var settings = new Observer(args.data);
        settings.scopeId = args.scopeId;

        // Get settings
        editor.method('settings:' + args.name, function () {
            return settings;
        });

        var doc;

        settings.reload = function (scopeId) {
            settings.scopeId = scopeId;

            var connection = editor.call('realtime:connection');
            var name = args.scopeType + '_' + args.scopeId;
            if (args.userId)
                name += '_' + args.userId;

            if (doc)
                doc.destroy();

            doc = connection.get('settings', name);

            // handle errors
            doc.on('error', function (err) {
                console.error(err);
                editor.emit('settings:' + args.scopeType + ':error', err);
            });

            // load settings
            doc.on('subscribe', function () {
                doc.whenReady(function () {
                    var data = doc.getSnapshot();
                    var history = settings.history;
                    if (history) {
                        settings.history = false;
                    }
                    for (var key in data) {
                        settings.set(key, data[key]);
                    }
                    if (history)
                        settings.history = true;

                    // server -> local
                    doc.on('after op', function (ops, local) {
                        if (local) return;

                        var history = settings.history;
                        if (history)
                            settings.history = false;
                        for (var i = 0; i < ops.length; i++) {
                            settings.sync.write(ops[i]);
                        }
                        if (history)
                            settings.history = true;
                    });

                    editor.emit('settings:' + args.scopeType + ':load');
                });
            });

            // subscribe for realtime events
            doc.subscribe();
        };

        editor.on('realtime:authenticated', function () {
            settings.reload(settings.scopeId);
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


        return settings;
    });

});
