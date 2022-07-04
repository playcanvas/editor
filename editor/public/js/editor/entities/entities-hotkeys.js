editor.once('load', function () {
    'use strict';

    // new
    editor.call('hotkey:register', 'entity:new', {
        key: 'e',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write'))
                return;

            if (editor.call('picker:isOpen')) return;

            var type = editor.call('selector:type');
            var items = editor.call('selector:items');

            if (type === 'entity') {
                if (items.length !== 1)
                    return;

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
        key: 'd',
        ctrl: true,
        callback: function () {
            if (!editor.call('permissions:write')) return;
            if (editor.call('picker:isOpen')) return;

            var type = editor.call('selector:type');
            var items = editor.call('selector:items');

            if (!items.length) return;

            if (type === 'entity') {
                if (items.indexOf(editor.call('entities:root')) !== -1) return;
                editor.call('entities:duplicate', items);
            } else if (type === 'asset' && items.length === 1) {
                if (items[0].get('type') !== 'material' && items[0].get('type') !== 'sprite') return;
                editor.call('assets:duplicate', items[0]);
            }
        }
    });

    // delete
    var deleteCallback = function () {
        if (editor.call('picker:isOpen')) return;

        if (!editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'entity')
            return;

        var root = editor.call('entities:root');
        var items = editor.call('selector:items');

        if (items.indexOf(root) !== -1)
            return;

        editor.call('entities:delete', items);
    };
    // delete
    editor.call('hotkey:register', 'entity:delete', {
        key: 'delete',
        callback: deleteCallback
    });
    // ctrl + backspace
    editor.call('hotkey:register', 'entity:delete', {
        ctrl: true,
        key: 'backspace',
        callback: deleteCallback
    });

    // copy
    editor.call('hotkey:register', 'entity:copy', {
        key: 'c',
        ctrl: true,
        skipPreventDefault: true,
        callback: function () {
            // write permissions only (perhaps we could also allow read permissions)
            if (!editor.call('permissions:write'))
                return;

            if (editor.call('picker:isOpen')) return;

            var type = editor.call('selector:type');
            if (type !== 'entity')
                return;

            var items = editor.call('selector:items');
            if (!items.length)
                return;

            editor.call('entities:copy', items);
        }
    });

    // paste
    editor.call('hotkey:register', 'entity:paste', {
        key: 'v',
        ctrl: true,
        callback: function () {
            // write permissions only (perhaps we could also allow read permissions)
            if (!editor.call('permissions:write'))
                return;

            if (editor.call('picker:isOpen')) return;

            var items = editor.call('selector:items');
            if (items.length === 0 || items.length === 1 && editor.call('selector:type') === 'entity')
                editor.call('entities:paste', items[0]);
        }
    });
});
