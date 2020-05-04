editor.once('load', function() {
    'use strict';

    editor.method('assets:create:bundle', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var defaultAssetPreload = editor.call('settings:projectUser').get('editor.pipeline.defaultAssetPreload');

        var asset = {
            name: 'New Bundle',
            type: 'bundle',
            source: false,
            preload: defaultAssetPreload,
            data: {
                assets: []
            },
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
