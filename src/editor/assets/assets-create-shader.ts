editor.once('load', () => {
    editor.method('assets:create:shader', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const asset = {
            name: 'New Shader',
            type: 'shader',
            source: false,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
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
