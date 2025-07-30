editor.once('load', () => {
    const settings = editor.call('settings:project');

    editor.method('assets:delete:picker', (items) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        let msg = 'Permanently delete asset?';

        if (items.length === 1) {
            const item = items[0];
            const type = item.get('type');

            let name = item.get('name');
            if (!name && type === 'script' && settings.get('useLegacyScripts')) {
                name = item.get('filename');
            }

            if (type === 'folder') {
                msg = `Permanently delete folder '${name}'?`;
            } else {
                msg = `Permanently delete asset '${name}'?`;
            }
        } else if (items.length > 1) {
            msg = `Permanently delete ${items.length} assets?`;
        }

        editor.call('picker:confirm', msg, () => {
            if (!editor.call('permissions:write')) {
                return;
            }

            editor.call('assets:delete', items);
        }, {
            yesText: 'Delete',
            noText: 'Cancel'
        });
    });

    const deleteCallback = function () {
        if (!editor.call('permissions:write')) {
            return;
        }

        const type = editor.call('selector:type');
        if (type !== 'asset') {
            return;
        }

        if (editor.call('animstategraph:editor:open')) {
            return;
        }

        editor.call('assets:delete:picker', editor.call('selector:items'));
    };
    // delete
    editor.call('hotkey:register', 'asset:delete', {
        key: 'Delete',
        callback: deleteCallback
    });
    // ctrl + backspace
    editor.call('hotkey:register', 'asset:delete', {
        key: 'Backspace',
        ctrl: true,
        callback: deleteCallback
    });
});
