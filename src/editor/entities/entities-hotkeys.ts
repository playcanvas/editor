editor.once('load', () => {
    // new
    editor.call('hotkey:register', 'entity:new', {
        key: 'KeyE',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write')) {
                return;
            }

            if (editor.call('picker:isOpen')) {
                return;
            }

            const type = editor.call('selector:type');
            const items = editor.call('selector:items');

            if (type === 'entity') {
                if (items.length !== 1) {
                    return;
                }

                editor.call('entities:new', {
                    parent: items[0]
                });
            } else {
                editor.call('entities:new');
            }
        }
    });


    // duplicate
    editor.call('hotkey:register', 'entity:duplicate', {
        key: 'KeyD',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write')) {
                return;
            }
            if (editor.call('picker:isOpen')) {
                return;
            }

            const type = editor.call('selector:type');
            const items = editor.call('selector:items');

            if (!items.length) {
                return;
            }

            if (type === 'entity') {
                if (items.indexOf(editor.call('entities:root')) !== -1) {
                    return;
                }
                editor.call('entities:duplicate', items);
            } else if (type === 'asset' && items.length === 1) {
                if (items[0].get('type') !== 'material' && items[0].get('type') !== 'sprite') {
                    return;
                }
                editor.call('assets:duplicate', items[0]);
            }
        }
    });

    // delete
    const deleteCallback = function () {
        if (editor.call('picker:isOpen')) {
            return;
        }

        if (!editor.call('permissions:write')) {
            return;
        }

        const type = editor.call('selector:type');
        if (type !== 'entity') {
            return;
        }

        const root = editor.call('entities:root');
        const items = editor.call('selector:items');

        if (items.indexOf(root) !== -1) {
            return;
        }

        editor.call('entities:delete', items);
    };
    // delete
    editor.call('hotkey:register', 'entity:delete', {
        key: 'Delete',
        callback: deleteCallback
    });
    // ctrl + backspace
    editor.call('hotkey:register', 'entity:delete', {
        key: 'Backspace',
        ctrl: true,
        callback: deleteCallback
    });

    // copy
    editor.call('hotkey:register', 'entity:copy', {
        key: 'KeyC',
        ctrl: true,
        skipPreventDefault: true,
        callback: function () {
            // write permissions only (perhaps we could also allow read permissions)
            if (!editor.call('permissions:write')) {
                return;
            }

            if (editor.call('picker:isOpen')) {
                return;
            }

            const type = editor.call('selector:type');
            if (type !== 'entity') {
                return;
            }

            const items = editor.call('selector:items');
            if (!items.length) {
                return;
            }

            editor.call('entities:copy', items);
        }
    });

    // paste
    editor.call('hotkey:register', 'entity:paste', {
        key: 'KeyV',
        ctrl: true,
        callback: function () {
            // write permissions only (perhaps we could also allow read permissions)
            if (!editor.call('permissions:write')) {
                return;
            }

            if (editor.call('picker:isOpen')) {
                return;
            }

            const items = editor.call('selector:items');
            if (items.length === 0 || items.length === 1 && editor.call('selector:type') === 'entity') {
                editor.call('entities:paste', items[0]);
            }
        }
    });
});
