editor.once('load', function() {
    'use strict';

    // delete
    editor.call('hotkey:register', 'entity:delete', {
        key: 'delete',
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            var type = editor.call('selector:type');
            if (type !== 'entity')
                return;

            var items = editor.call('selector:items');
            items.forEach(function(entity) {
                editor.call('entities:delete', entity);
            });
        }
    });
});
