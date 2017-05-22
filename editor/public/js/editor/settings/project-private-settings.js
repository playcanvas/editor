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
    settings.history = true;
    settings.on('*:set', function(path, value, oldValue) {
        if (! settings.history)
            return;

        editor.call('history:add', {
            name: 'private project settings:' + path,
            undo: function() {
                settings.history = false;
                settings.set(path, oldValue);
                settings.history = true;
            },
            redo: function() {
                settings.history = false;
                settings.set(path, value);
                settings.history = true;
            }
        });
    });

    settings.on('facebook.appId:set', function (value) {
        if (value && ! settings.get('facebook.sdkVersion')) {
            // set default sdk version
            var history = settings.history;
            settings.set('facebook.sdkVersion', config.facebook.version);
            settings.history = history;
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
            editor.once('settings:project-private:load', function () {
                evtOnSet.unbind();

                var history = settings.history;
                settings.history = false;
                for (var key in pendingChanges) {
                    settings.set(key, pendingChanges[key]);
                }
                settings.history = history;

                pendingChanges = null;
            });
        }
    };

    // handle permission changes
    editor.on('permissions:set:' + config.self.id, function (accesslevel) {
        if (accesslevel !== 'admin' && accesslevel !== 'write') {
            // unset private settings
            settings.disconnect();
            settings.history = false;
            settings.unset('facebook');
        } else {
            // reload settings
            settings.history = true;
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
