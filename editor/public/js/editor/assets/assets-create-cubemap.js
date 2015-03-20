editor.once('load', function() {
    'use strict';

    editor.method('assets:createCubemap', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Cubemap',
            type: 'cubemap',
            source: false,
            data: {
                name: 'New Cubemap',
                textures: [null, null, null, null, null, null],
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
