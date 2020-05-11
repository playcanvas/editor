editor.once('load', function() {
    'use strict';

    editor.method('assets:create:css', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var defaultAssetPreload = editor.call('settings:projectUser').get('editor.pipeline.defaultAssetPreload');;

        var asset = {
            name: 'New Css',
            type: 'css',
            source: false,
            preload: defaultAssetPreload,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
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
