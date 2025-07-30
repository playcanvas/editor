editor.once('load', () => {
    editor.method('assets:create:material', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const data = editor.call('schema:material:getDefaultData');

        const asset = {
            name: 'New Material',
            type: 'material',
            source: false,
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
