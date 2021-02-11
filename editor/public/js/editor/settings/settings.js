editor.once('load', function () {
    'use strict';

    editor.method('settings:create', function (args) {
        // settings observer
        var settings = new Observer(args.data);
        settings.id = args.id;

        // Get settings
        editor.method('settings:' + args.name, function () {
            return settings;
        });

        var doc;

        settings.reload = function () {
            var connection = editor.call('realtime:connection');

            if (doc)
                doc.destroy();

            doc = connection.get('settings', settings.id);

            // handle errors
            doc.on('error', function (err) {
                log.error(err);
                editor.emit('settings:' + args.name + ':error', err);
            });

            // load settings
            doc.on('load', function () {
                var data = doc.data;

                // remove unnecessary fields
                delete data._id;
                delete data.name;
                delete data.user;
                delete data.project;
                delete data.item_id;
                delete data.branch_id;
                delete data.checkpoint_id;

                if (! settings.sync) {
                    settings.sync = new ObserverSync({
                        item: settings,
                        paths: Object.keys(settings._data)
                    });

                    // local -> server
                    settings.sync.on('op', function (op) {
                        if (doc)
                            doc.submitOp([op]);
                    });
                }

                var history = settings.history.enabled;
                if (history) {
                    settings.history.enabled = false;
                }

                settings.sync._enabled = false;
                for (const key in data) {
                    if (data[key] instanceof Array) {
                        settings.set(key, data[key].slice(0));
                    } else {
                        settings.set(key, data[key]);
                    }
                }
                settings.sync._enabled = true;
                if (history)
                    settings.history.enabled = true;

                // server -> local
                doc.on('op', function (ops, local) {
                    if (local) return;

                    var history = settings.history.enabled;
                    if (history)
                        settings.history.enabled = false;
                    for (let i = 0; i < ops.length; i++) {
                        settings.sync.write(ops[i]);
                    }
                    if (history)
                        settings.history.enabled = true;
                });

                editor.emit('settings:' + args.name + ':load');
            });

            // subscribe for realtime events
            doc.subscribe();
        };

        if (! args.deferLoad) {
            editor.on('realtime:authenticated', function () {
                settings.reload();
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
