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

                    // remove unnecessary fields
                    delete data._id;
                    delete data.name;
                    delete data.user;
                    delete data.project;

                    if (! settings.sync) {
                        settings.sync = new ObserverSync({
                            item: settings,
                            paths: Object.keys(settings._data)
                        });

                        // local -> server
                        settings.sync.on('op', function (op) {
                            if (doc)
                                doc.submitOp([ op ]);
                        });
                    }

                    var history = settings.history;
                    if (history) {
                        settings.history = false;
                    }

                    settings.sync._enabled = false;
                    for (var key in data) {
                        if (data[key] instanceof Array) {
                            settings.set(key, data[key].slice(0));
                        } else {
                            settings.set(key, data[key]);
                        }
                    }
                    settings.sync._enabled = true;
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

                    editor.emit('settings:' + args.name + ':load');
                });
            });

            // subscribe for realtime events
            doc.subscribe();
        };

        if (! args.deferLoad) {
            editor.on('realtime:authenticated', function () {
                settings.reload(settings.scopeId);
            });
        }

        editor.on('realtime:disconnected', function () {
            if (doc) {
                doc.destroy();
                doc = null;
            }
        });

        settings.disconnect = function () {
            if (doc) {
                doc.destroy();
                doc = null;
            }

            if (settings.sync) {
                settings.sync.unbind();
                delete settings.sync;
            }
        };


        return settings;
    });

});
