editor.once('load', function() {
    'use strict';

    editor.method('assets:delete:picker', function(items) {
        if (! editor.call('permissions:write'))
            return;

        var msg = 'Delete Asset?';

        if (items.length === 1 && items[0].get('type') === 'folder')
            msg = 'Delete Folder?';

        if (items.length > 1)
            msg = 'Delete ' + items.length + ' Assets?';

        editor.call('picker:confirm:class', 'asset-delete');

        editor.call('picker:confirm', msg, function() {
            if (! editor.call('permissions:write'))
                return;

            editor.call('assets:fs:delete', items);
        });
    });

    var deleteCallback = function() {
        if (! editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'asset')
            return;

        editor.call('assets:delete:picker', editor.call('selector:items'));
    };

});
