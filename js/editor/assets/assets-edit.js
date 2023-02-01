editor.once('load', function () {
    'use strict';

    var types = {
        'css': 1,
        'html': 1,
        'json': 1,
        'script': 1,
        'shader': 1,
        'text': 1
    };

    editor.method('assets:edit', function (asset) {
        if (asset.get('type') === 'script' && editor.call('settings:project').get('useLegacyScripts')) {
            window.open('/editor/code/' + config.project.id + '/' + asset.get('filename'));
        } else {
            if (!editor.call('settings:project').get('useLegacyScripts')) {
                editor.call('picker:codeeditor', asset);
            } else {
                let url = `/editor/asset/${asset.get('id')}`;

                if (location.search.includes('use_local_frontend')) {
                    url += '?use_local_frontend';
                }

                window.open(url, asset.get('id')).focus();
            }
        }
    });

    var dblClick = function (key, asset) {
        var gridItem = editor.call('assets:panel:get', asset.get(key));
        if (!gridItem)
            return;

        gridItem.element.addEventListener('dblclick', function (evt) {
            editor.call('assets:edit', asset);
        }, false);
    };

    editor.on('assets:add', function (asset) {
        if (!types[asset.get('type')])
            return;

        dblClick('id', asset);
    });

    editor.on('sourcefiles:add', function (file) {
        dblClick('filename', file);
    });
});
