editor.once('load', function () {
    'use strict';

    editor.method('assets:create:text', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var asset = {
            name: 'New Text',
            type: 'text',
            source: false,
            preload: true,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:selected:folder'),
            filename: 'asset.txt',
            file: new Blob(['\n'], { type: 'text/plain' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
