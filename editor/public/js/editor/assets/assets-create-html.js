editor.once('load', function() {
    'use strict';

    editor.method('assets:createHtml', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Html',
            type: 'html',
            source: false,
            asset: {
                filename: "asset.html",
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
