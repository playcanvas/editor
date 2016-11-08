editor.once('load', function() {
    'use strict';

    // initial data
    var initializePrivateSettings = function () {
        if (! config.project.privateSettings.facebook) {
            config.project.privateSettings.facebook = {
                app_id: '',
                upload_token: ''
            }
        }
    };

    initializePrivateSettings();

    var settings = new Observer(config.project.privateSettings);

    settings.sync = true;

    var changing = false;

    editor.method('project:privateSettings', function () {
        return settings;
    });

    // send changes to sharejs
    settings.on('*:set', function (path, value, oldValue) {
        var parts = path.split('.');
        var field = config.project.privateSettings;
        for (var i = 0; i < parts.length - 1; i++) {
            field = field[parts[i]];
        }

        field[parts[parts.length - 1]] = value;

        if (changing || ! settings.sync || ! editor.call('permissions:write'))
            return;

        var data = {
            id: config.project.id,
            path: 'private_settings.' + path,
            value: value
        };

        editor.call('realtime:send', 'project:save', data);
    });

    // handle changes by others
    editor.on('messenger:project.update', function (data) {
        changing = true;
        for (var path in data) {
            var p = path;
            if (path.startsWith('private_settings.'))
                p = path.substring(17);

            var history = settings.history;
            settings.history = false;
            settings.set(p, data[path]);
            settings.history = history;
        }

        changing = false;
    });

    // handle permission changes
    editor.on('permissions:set:' + config.self.id, function (accesslevel) {
        if (accesslevel !== 'admin' && accesslevel !== 'write') {
            // unset all local settings
            changing = true;
            settings.history = false;
            for (var key in config.project.privateSettings) {
                settings.unset(key);
            }
            config.project.privateSettings = {};
            initializePrivateSettings();

            changing = false;
            settings.history = true;
        } else {
            // reload settings
            Ajax({
                url: '{{url.api}}/projects/{{project.id}}?view=private_settings',
                auth: true
            })
            .on('load', function(status, data) {
                changing = true;
                settings.history = false;
                var response = data;
                for (var key in response) {
                    if (response.hasOwnProperty(key)) {
                        settings.set(key, response[key]);
                    }
                }

                settings.history = true;
                changing = false;
            });
        }
    });
});
