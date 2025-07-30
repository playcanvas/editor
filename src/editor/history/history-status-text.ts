editor.once('load', () => {
    const history = editor.api.globals.history;

    history.on('add', (name) => {
        editor.call('status:text', name);
    });

    history.on('undo', () => {
        if (history.currentAction) {
            editor.call('status:text', history.currentAction.name);
        } else {
            editor.call('status:text', '');
        }
    });

    history.on('redo', (name) => {
        editor.call('status:text', name);
    });
});
