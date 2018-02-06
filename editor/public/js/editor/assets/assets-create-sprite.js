editor.once('load', function() {
    'use strict';

    editor.method('assets:create:sprite', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var data = {
            pixelsPerUnit: args.pixelsPerUnit !== undefined ? args.pixelsPerUnit : 100,
            frameKeys: args.frameKeys !== undefined ? args.frameKeys : [],
            textureAtlasAsset: args.textureAtlasAsset !== undefined ? parseInt(args.textureAtlasAsset, 10) : null
        };

        var asset = {
            name: args.name !== undefined ? args.name : 'New Sprite',
            type: 'sprite',
            source: false,
            preload: true,
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
