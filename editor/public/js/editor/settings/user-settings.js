editor.once('load', function () {
    'use strict';

    var settings = editor.call('settings:create', {
        name: 'user',
        scopeType: 'user',
        scopeId: config.self.id,
        data: {
            editor: {
                howdoi: true,
                iconSize: 0.2
            }
        }
    });

    // add history
    settings.history = true;
    settings.on('*:set', function(path, value, oldValue) {
        if (! settings.history)
            return;

        editor.call('history:add', {
            name: 'user settings:' + path,
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
});
