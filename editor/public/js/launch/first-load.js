(function() {
    'use strict';

    var visible = ! document.hidden;

    document.addEventListener('visibilitychange', function() {
        if (visible === ! document.hidden)
            return;

        visible = ! document.hidden;
        if (visible) {
            editor.emit('visible');
        } else {
            editor.emit('hidden');
        }
        editor.emit('visibility', visible);
    }, false);

    editor.method('visibility', function() {
        return visible;
    });

    // first load
    document.addEventListener('DOMContentLoaded', function() {
        editor.emit('load');
    }, false);
})();
