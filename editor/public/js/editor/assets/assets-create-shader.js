editor.once('load', function() {
    'use strict';

    editor.method('assets:createShader', function () {
        if (! editor.call('permissions:write'))
            return;

        var asset = {
            name: 'New Shader',
            type: 'shader',
            source: false,
            preload: true,
            asset: {
                filename: "asset.glsl",
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
