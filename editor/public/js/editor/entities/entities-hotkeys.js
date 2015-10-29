editor.once('load', function() {
    'use strict';

    // new
    editor.call('hotkey:register', 'entity:new', {
        key: 'n',
        ctrl: true,
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

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
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            var type = editor.call('selector:type');

            var items = editor.call('selector:items');
            if (items.length !== 1)
                return;

            if (type === 'entity') {
                if (items[0] !== editor.call('entities:root'))
                    editor.call('entities:duplicate', items[0]);
            } else if (type === 'asset') {
                if (items[0].get('type') !== 'material')
                    return;

                editor.call('assets:duplicate', items[0]);
            }
        }
    });

    // delete
    var deleteCallback = function() {
        if (! editor.call('permissions:write'))
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
            if (! editor.call('permissions:write'))
                return;

            var type = editor.call('selector:type');
            if (type !== 'entity')
                return;

            var items = editor.call('selector:items');
            if (items.length !== 1)
                return;

            editor.call('entities:copy', items[0]);
        }
    });

    // paste
    editor.call('hotkey:register', 'entity:paste', {
        key: 'v',
        ctrl: true,
        callback: function () {
            // write permissions only (perhaps we could also allow read permissions)
            if (! editor.call('permissions:write'))
                return;

            var type = editor.call('selector:type');
            if (type !== 'entity')
                return;

            var items = editor.call('selector:items');
            if (items.length !== 1)
                return;

            editor.call('entities:paste', items[0]);
        }
    });
});
