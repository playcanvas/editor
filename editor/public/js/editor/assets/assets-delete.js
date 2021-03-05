editor.once('load', function () {
    'use strict';

    editor.method('assets:delete:picker', function (items) {
        if (! editor.call('permissions:write'))
            return;

        var msg = 'Delete Asset?';

        if (items.length === 1 && items[0].get('type') === 'folder')
            msg = 'Delete Folder?';

        if (items.length > 1)
            msg = 'Delete ' + items.length + ' Assets?';

        editor.call('picker:confirm', msg, function () {
            if (! editor.call('permissions:write'))
                return;

            editor.call('assets:delete', items);
        }, {
            yesText: 'Delete',
            noText: 'Cancel'
        });
    });

    var deleteCallback = function () {
        if (! editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'asset')
            return;

        if (editor.call('animstategraph:editor:open'))
            return;

        editor.call('assets:delete:picker', editor.call('selector:items'));
    };
    // delete
    editor.call('hotkey:register', 'asset:delete', {
        key: 'delete',
        callback: deleteCallback
    });
    // ctrl + backspace
    editor.call('hotkey:register', 'asset:delete', {
        ctrl: true,
        key: 'backspace',
        callback: deleteCallback
    });
});
