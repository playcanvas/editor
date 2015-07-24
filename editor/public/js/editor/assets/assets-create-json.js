editor.once('load', function() {
    'use strict';

    editor.method('assets:createJson', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Json',
            type: 'json',
            source: false,
            preload: true,
            asset: {
                filename: "asset.json",
                data: btoa('{}')
            },
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
