editor.once('load', function () {
    'use strict';

    /**
     * Returns the history object.
     */
    editor.method('editor:history', function () {
        return editor.history;
    });

    // Keep for backwards compatibilty
    editor.method('history:add', function (action) {
        editor.history.add(action);
    });
});
