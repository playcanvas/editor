editor.once('load', function () {
    'use strict';

    editor.method('assets:create:animstategraph', function (args) {
        if (!editor.call('permissions:write'))
            return;

        args = args || { };

        var data = editor.call('schema:animstategraph:getDefaultData');

        var defaultAssetPreload = editor.call('settings:projectUser').get('editor.pipeline.defaultAssetPreload');

        var asset = {
            name: 'New Anim State Graph',
            type: 'animstategraph',
            source: false,
            preload: defaultAssetPreload,
            data: data,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
