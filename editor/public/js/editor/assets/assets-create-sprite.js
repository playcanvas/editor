editor.once('load', function() {
    'use strict';

    editor.method('assets:create:sprite', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var data = {
            pixelsPerUnit: args.pixelsPerUnit !== undefined ? args.pixelsPerUnit : 100,
            frameKeys: args.frameKeys !== undefined ? args.frameKeys.map(val => val.toString()) : [],
            textureAtlasAsset: args.textureAtlasAsset !== undefined ? parseInt(args.textureAtlasAsset, 10) : null,
            renderMode: args.renderMode !== undefined ? args.renderMode : 0
        };

        var defaultAssetPreload = editor.call('settings:project').get('defaultAssetPreload');

        var asset = {
            name: args.name !== undefined ? args.name : 'New Sprite',
            type: 'sprite',
            source: false,
            preload: defaultAssetPreload,
            data: data,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset, args.fn, args.noSelect);
    });
});
