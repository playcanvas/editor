editor.once('load', () => {
    editor.method('assets:create:sprite', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const data = {
            pixelsPerUnit: args.pixelsPerUnit !== undefined ? args.pixelsPerUnit : 100,
            frameKeys: args.frameKeys !== undefined ? args.frameKeys.map(val => val.toString()) : [],
            textureAtlasAsset: args.textureAtlasAsset !== undefined ? parseInt(args.textureAtlasAsset, 10) : null,
            renderMode: args.renderMode !== undefined ? args.renderMode : 0
        };

        const asset = {
            name: args.name !== undefined ? args.name : 'New Sprite',
            type: 'sprite',
            source: false,
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
