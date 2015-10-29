editor.once('load', function() {
    'use strict';

    editor.method('assets:createHtml', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Html',
            type: 'html',
            source: false,
            parent: editor.call('assets:panel:currentFolder'),
            filename: 'asset.html',
            file: new Blob([ '\n' ], { type: 'text/html' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
