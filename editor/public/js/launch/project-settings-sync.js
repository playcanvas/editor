editor.once('load', function() {
    'use strict';

    var settings = new Observer(config.project.settings);

    editor.method('project:settings', function () {
        return settings;
    });

    // handle changes by others
    editor.on('messenger:project.update', function (data) {
        for (var path in data) {
            var p = path;
            if (path.startsWith('settings.'))
                p = path.substring(9);

            var history = settings.history;
            settings.history = false;
            settings.set(p, data[path]);
            settings.history = history;
        }
    });
});
