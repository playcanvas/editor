editor.once('load', function() {
    'use strict';

    editor.method('assets:duplicate', function(asset) {
        var path = asset.get('path');
        var parent = path.length ? path[path.length - 1] : null;

        var raw = {
            type: 'material',
            name: asset.get('name') + ' Copy',
            source: false,
            data: asset.get('data'),
            preload: asset.get('preload'),
            parent: parent ? editor.call('assets:get', parent) : null,
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', raw);
    });
});
