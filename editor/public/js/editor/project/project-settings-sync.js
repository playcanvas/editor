editor.once('load', function() {
    'use strict';

    var settings = new Observer(config.project.settings);
    settings.sync = true;

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

        if (changing || ! settings.sync || ! editor.call('permissions:write'))
            return;

        var data = {
            id: config.project.id,
            path: 'settings.' + path,
            value: value
        };

        editor.call('realtime:send', 'project:save', data);
    });

    var onArrayChange = function(path) {
        if (changing || ! settings.sync || ! editor.call('permissions:write'))
            return;

        var field = path.split('.')[0];
        var data = {
            id: config.project.id,
            path: 'settings.' + field,
            value: settings.get(field)
        };

        editor.call('realtime:send', 'project:save', data);
    };

    settings.on('*:insert', onArrayChange);
    settings.on('*:move', onArrayChange);
    settings.on('*:remove', onArrayChange);

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

    // migrate
    if (! settings.get('use_legacy_scripts')) {
        // scripts order
        if (! (settings.get('scripts') instanceof Array))
            settings.set('scripts', [ ]);

        pc.script.legacy = false;
    } else {
        pc.script.legacy = true;
    }

    // migrate preferWebGl2
    if (! settings.has('preferWebGl2'))
        settings.set('preferWebGl2', true);
});
