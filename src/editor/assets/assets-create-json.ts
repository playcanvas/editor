editor.once('load', () => {
    editor.method('assets:create:json', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const asset = {
            name: args.name ?? 'New Json',
            type: 'json',
            source: false,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            filename: 'asset.json',
            file: new Blob([args.json ?? '{ }'], { type: 'application/json' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset, args.callback, args.noSelect);
    });
});
