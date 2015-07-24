editor.once('load', function() {
    'use strict';

    editor.method('assets:edit', function (asset) {
        if (asset.get('type') === 'script') {
            window.open('/editor/code/' + config.project.id + '/' + asset.get('filename'));
        } else {
            window.open('/editor/asset/' + asset.get('id'));
        }
    });
});
