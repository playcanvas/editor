editor.once('load', function() {
    'use strict';

    var settings = editor.call('project:settings');

    settings.history = true;

    settings.on('*:set', function(path, value, oldValue) {
        if (! this.history)
            return;

        editor.call('history:add', {
            name: 'project.settings.' + path,
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
