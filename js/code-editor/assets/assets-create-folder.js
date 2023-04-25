editor.once('load', function () {
    editor.method('assets:create:folder', function (args) {
        if (!editor.call('permissions:write'))
            return;

        args = args || { };

        const asset = {
            name: 'New Folder',
            type: 'folder',
            source: true,
            preload: false,
            data: null,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:selected:folder'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
