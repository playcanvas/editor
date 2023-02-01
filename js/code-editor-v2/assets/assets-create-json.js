editor.once('load', function () {
    'use strict';

    editor.method('assets:create:json', function (args) {
        if (!editor.call('permissions:write'))
            return;

        args = args || { };

        const asset = {
            name: 'New Json',
            type: 'json',
            source: false,
            preload: true,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:selected:folder'),
            filename: 'asset.json',
            file: new Blob(['{ }'], { type: 'application/json' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
