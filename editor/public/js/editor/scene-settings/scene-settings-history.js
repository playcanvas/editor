editor.once('load', function() {
    'use strict';

    var obj = editor.call('sceneSettings');
    obj.history = true;

    obj.on('*:set', function(path, value, oldValue) {
        if (!this.history)
            return;

        editor.call('history:add', {
            name: 'change sceneSettings ' + path,
            undo: function() {
                obj.history = false;
                obj.set(path, oldValue);
                obj.history = true;
            },
            redo: function() {
                obj.history = false;
                obj.set(path, value);
                obj.history = true;
            }
        });
    });
});
