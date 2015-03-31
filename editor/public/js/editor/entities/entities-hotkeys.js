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
                editor.call('entities:new', items[0]);
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
            if (type !== 'entity')
                return;

            var items = editor.call('selector:items');
            if (items[0] !== editor.call('entities:root'))
                editor.call('entities:duplicate', items[0]);
        }
    });

    // delete
    editor.call('hotkey:register', 'entity:delete', {
        key: 'delete',
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            var type = editor.call('selector:type');
            if (type !== 'entity')
                return;

            var root = editor.call('entities:root');
            var items = editor.call('selector:items');
            items.forEach(function(entity) {
                if (entity !== root)
                    editor.call('entities:delete', entity);
            });
        }
    });
});
