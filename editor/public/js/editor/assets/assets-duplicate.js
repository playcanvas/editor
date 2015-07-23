editor.once('load', function() {
    'use strict';

    editor.method('assets:duplicate', function(asset) {
        var raw = {
            type: 'material',
            name: asset.get('name') + ' Copy',
            source: false,
            data: asset.get('data'),
            preload: asset.get('preload'),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', raw);
    });
});
