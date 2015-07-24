editor.once('load', function() {
    'use strict';

    editor.method('assets:createCss', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Css',
            type: 'css',
            source: false,
            preload: true,
            asset: {
                filename: "asset.css",
                data: ''
            },
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
