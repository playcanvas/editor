editor.once('load', function () {
    editor.method('assets:create:shader', function (args) {
        if (!editor.call('permissions:write'))
            return;

        args = args || { };

        const asset = {
            name: 'New Shader',
            type: 'shader',
            source: false,
            preload: true,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:selected:folder'),
            filename: 'asset.glsl',
            file: new Blob(['\n'], { type: 'text/x-glsl' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
