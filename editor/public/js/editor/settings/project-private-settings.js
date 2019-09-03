editor.once('load', function () {
    'use strict';

    // this used to have facebook settings
    // but we removed those so leaving this here in case
    // it is needed in the future
    var defaultData = {
    };

    var isConnected = false;

    var settings = editor.call('settings:create', {
        name: 'projectPrivate',
        id: 'project-private_' + config.project.id,
        deferLoad: true,
        data: defaultData
    });


    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.call('editor:history')
    });

    var reload = function () {
        if (! isConnected) return;

        if (config.project.hasPrivateSettings && editor.call('permissions:write')) {
            settings.reload(settings.scopeId);
        }

        if (! config.project.hasPrivateSettings) {
            var pendingChanges = {};

            var evtOnSet = settings.on('*:set', function (path, value, valueOld) {
                // store pending changes until we load document from C3 in order to send
                // them to the server
                if (! settings.sync) {
                    pendingChanges[path] = value;
                }

                if (! config.project.hasPrivateSettings) {
                    config.project.hasPrivateSettings = true;
                    settings.reload(settings.scopeId);
                }
            });

            // when settings are created and loaded from the server sync any pending changes
            editor.once('settings:projectPrivate:load', function () {
                evtOnSet.unbind();

                var history = settings.history.enabled;
                settings.history.enabled = false;
                for (var key in pendingChanges) {
                    settings.set(key, pendingChanges[key]);
                }
                settings.history.enabled = history;

                pendingChanges = null;
            });
        }
    };

    // handle permission changes
    editor.on('permissions:set:' + config.self.id, function (accesslevel) {
        if (accesslevel !== 'admin' && accesslevel !== 'write') {
            // unset private settings
            settings.disconnect();
            settings.history.enabled = false;
            for (var key in defaultData) {
                settings.unset(key);
            }
        } else {
            // reload settings
            settings.history.enabled = true;
            reload();
        }
    });

    editor.on('realtime:authenticated', function () {
        isConnected = true;
        reload();
    });

    editor.on('realtime:disconnected', function () {
        isConnected = false;
    });

    if (! config.project.hasPrivateSettings) {
        editor.on('messenger:settings.create', function (msg) {
            if (config.project.hasPrivateSettings) return; // skip if we've already created the settings locally

            if (msg.settings.name === 'project-private') {
                config.project.hasPrivateSettings = true;
                reload();
            }
        });
    }

});
