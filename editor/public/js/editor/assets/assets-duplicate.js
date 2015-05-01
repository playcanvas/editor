editor.once('load', function() {
    'use strict';

    editor.method('assets:duplicate', function(asset) {
        var raw = {
            type: 'material',
            name: asset.get('name') + ' Copy',
            source: false,
            data: editor.call('material:mapToList', {
                name: asset.get('name') + ' Copy',
                data: asset.get('data')
            }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', raw);
    });
});
