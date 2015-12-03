editor.once('load', function() {
    'use strict';

    var settings = new Observer(config.project.settings);

    var changing = false;

    editor.method('project:settings', function () {
        return settings;
    });

    // send changes to sharejs
    settings.on('*:set', function (path, value, oldValue) {
        // just handle top level paths
        if (path.indexOf('.') !== -1)
            return;

        config.project.settings[path] = value;

        if (changing || !editor.call('permissions:write'))
            return;

        var data = {
            id: config.project.id,
            path: 'settings.' + path,
            value: value
        };

        editor.call('realtime:send', 'project:save', data);
    });

    // handle changes by others
    editor.on('messenger:project.update', function (data) {
        changing = true;
        for (var path in data) {
            var p = path;
            if (path.startsWith('settings.'))
                p = path.substring(9);

            var history = settings.history;
            settings.history = false;
            settings.set(p, data[path]);
            settings.history = history;
        }

        changing = false;
    });
});
