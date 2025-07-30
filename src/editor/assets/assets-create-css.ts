editor.once('load', () => {
    editor.method('assets:create:css', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const asset = {
            name: 'New Css',
            type: 'css',
            source: false,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            filename: 'asset.css',
            file: new Blob(['\n'], { type: 'text/css' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
