editor.once('load', function () {
    'use strict';

    var history = editor.call('editor:history');

    var hotkeyExceptions = [
        'curve',
        'gradient',
        'sprite-editor'
    ];

    // hotkey undo
    editor.call('hotkey:register', 'history:undo', {
        key: 'z',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write'))
                return;

            if (editor.call('picker:isOpen:otherThan', hotkeyExceptions)) return;

            history.undo();
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo', {
        key: 'z',
        ctrl: true,
        shift: true,
        callback: function () {
            if (!editor.call('permissions:write'))
                return;

            if (editor.call('picker:isOpen:otherThan', hotkeyExceptions)) return;

            history.redo();
        }
    });

    // hotkey redo
    editor.call('hotkey:register', 'history:redo:y', {
        key: 'y',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write'))
                return;

            if (editor.call('picker:isOpen:otherThan', hotkeyExceptions)) return;

            history.redo();
        }
    });
});
