editor.once('load', function() {
    'use strict';

    editor.method('assets:delete:picker', function(items) {
        if (! editor.call('permissions:write'))
            return;

        var msg = 'Delete Asset?';
        if (items.length > 1)
            msg = 'Delete ' + items.length + ' Assets?';

        editor.call('picker:confirm:class', 'asset-delete');

        editor.call('picker:confirm', msg, function() {
            if (! editor.call('permissions:write'))
                return;

            for(var i = 0; i < items.length; i++)
                editor.call('assets:delete', items[i]);
        });
    });

    editor.call('hotkey:register', 'asset:delete', {
        key: 'delete',
        callback: function() {
            if (! editor.call('permissions:write'))
                return;

            var type = editor.call('selector:type');
            if (type !== 'asset')
                return;

            editor.call('assets:delete:picker', editor.call('selector:items'));
        }
    });
});
