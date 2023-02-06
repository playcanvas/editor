editor.once('load', function () {
    editor.method('assets:create:json', function (args) {
        if (!editor.call('permissions:write'))
            return;

        args = args || { };

        var asset = {
            name: 'New Json',
            type: 'json',
            source: false,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            filename: 'asset.json',
            file: new Blob(['{ }'], { type: 'application/json' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
