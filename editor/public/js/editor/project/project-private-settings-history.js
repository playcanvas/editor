editor.once('load', function() {
    'use strict';

    var settings = editor.call('project:privateSettings');

    settings.history = true;

    settings.on('*:set', function(path, value, oldValue) {
        if (! this.history)
            return;

        console.log(path);

        editor.call('history:add', {
            name: 'project.private_settings.' + path,
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
