editor.once('load', function() {
    'use strict';

    editor.method('assets:createCss', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Css',
            type: 'css',
            source: false,
            parent: editor.call('assets:panel:currentFolder'),
            filename: 'asset.css',
            file: new Blob([ '\n' ], { type: 'text/css' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
