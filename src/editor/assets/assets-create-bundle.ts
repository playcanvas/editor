editor.once('load', () => {
    editor.method('assets:create:bundle', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const asset = {
            name: 'New Bundle',
            type: 'bundle',
            source: false,
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
