editor.once('load', () => {
    editor.method('assets:create:animstategraph', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const data = editor.call('schema:animstategraph:getDefaultData');

        const defaultAssetPreload = editor.call('settings:projectUser').get('editor.pipeline.defaultAssetPreload');

        const asset = {
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
