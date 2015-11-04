editor.once('load', function() {
    'use strict';

    editor.method('assets:create:cubemap', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var asset = {
            name: 'New Cubemap',
            type: 'cubemap',
            source: false,
            preload: true,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            data: {
                name: 'New Cubemap',
                textures: [ null, null, null, null, null, null ],
                minFilter: 5, // linear mipmap linear
                magFilter: 1, // linear
                anisotropy: 1
            },
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
