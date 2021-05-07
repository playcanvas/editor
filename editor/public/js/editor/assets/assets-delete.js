editor.once('load', function () {
    'use strict';

    editor.method('assets:delete:picker', function (items) {
        if (! editor.call('permissions:write'))
            return;

        let msg = 'Permanently delete asset?';

        if (items.length === 1) {
            const item = items[0];
            const name = item.get('name');
            const type = item.get('type');

            if (type === 'folder') {
                msg = `Permanently delete folder '${name}'?`;
            } else {
                msg = `Permanently delete asset '${name}'?`;
            }
        } else if (items.length > 1) {
            msg = `Permanently delete ${items.length} assets?`;
        }

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
