editor.once('load', function () {
    var history = editor.call('editor:history');

    history.on('add', function (name) {
        editor.call('status:text', name);
    });

    history.on('undo', function () {
        if (history.currentAction) {
            editor.call('status:text', history.currentAction.name);
        } else {
            editor.call('status:text', '');
        }
    });

    history.on('redo', function (name) {
        editor.call('status:text', name);
    });
});
