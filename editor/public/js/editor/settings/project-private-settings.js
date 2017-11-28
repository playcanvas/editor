editor.once('load', function () {
    'use strict';

    var defaultData = {
        facebook: {
            appId: '',
            uploadToken: '',
            sdkVersion: ''
        }
    };

    var isConnected = false;

    var settings = editor.call('settings:create', {
        name: 'projectPrivate',
        scopeType: 'project-private',
        scopeId: config.project.id,
        deferLoad: true,
        data: defaultData
    });


    // add history
    settings.history = new ObserverHistory({
        item: settings,
        getItemFn: function () {return settings;}
    });

    // record history
    settings.history.on('record', function(action, data) {
        editor.call('history:' + action, data);
    });

    settings.on('facebook.appId:set', function (value) {
        if (value && ! settings.get('facebook.sdkVersion')) {
            // set default sdk version
            var history = settings.history.enabled;
            settings.history.enabled = false;
            settings.set('facebook.sdkVersion', config.facebook.version);
            settings.history.enabled = history;
        }
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
            settings.unset('facebook');
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
