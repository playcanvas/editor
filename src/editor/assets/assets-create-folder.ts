editor.once('load', () => {
    editor.method('assets:create:folder', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const asset = {
            name: args.name || 'New Folder',
            type: 'folder',
            source: true,
            preload: false,
            data: null,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset, args.fn, args.noSelect);
    });
});
