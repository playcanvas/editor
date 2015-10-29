editor.once('load', function() {
    'use strict';

    editor.method('assets:createFolder', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Folder',
            type: 'folder',
            source: false,
            data: null,
            parent: editor.call('assets:panel:currentFolder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
