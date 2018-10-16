editor.once('load', function () {
    'use strict';

    if (! config.resolveConflict) return;

    var root = editor.call('layout.root');
    root.class.add('file-only-mode');

    editor.method('editor:resolveConflictMode', function () {
        return true;
    });
});
