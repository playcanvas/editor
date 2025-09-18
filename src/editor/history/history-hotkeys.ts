editor.once('load', () => {
    const history = editor.api.globals.history;

    const hotkeyExceptions = [
        'curve',
        'gradient',
        'sprite-editor'
    ];

    // hotkey undo
    editor.call('hotkey:register', 'history:undo', {
        key: 'KeyZ',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write')) {
                return;
            }

            if (editor.call('picker:isOpen:otherThan', hotkeyExceptions)) {
                return;
            }

            history.undo();
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo', {
        key: 'KeyZ',
        ctrl: true,
        shift: true,
        callback: function () {
            if (!editor.call('permissions:write')) {
                return;
            }

            if (editor.call('picker:isOpen:otherThan', hotkeyExceptions)) {
                return;
            }

            history.redo();
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo:y', {
        key: 'KeyY',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write')) {
                return;
            }

            if (editor.call('picker:isOpen:otherThan', hotkeyExceptions)) {
                return;
            }

            history.redo();
        }
    });
});
