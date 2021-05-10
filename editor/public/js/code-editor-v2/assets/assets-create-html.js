editor.once('load', function () {
    'use strict';

    editor.method('assets:create:html', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var asset = {
            name: 'New Html',
            type: 'html',
            source: false,
            preload: true,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:selected:folder'),
            filename: 'asset.html',
            file: new Blob(['\n'], { type: 'text/html' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
