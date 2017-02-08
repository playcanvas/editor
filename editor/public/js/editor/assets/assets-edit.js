editor.once('load', function() {
    'use strict';

    var types = {
        'css': 1,
        'html': 1,
        'json': 1,
        'script': 1,
        'shader': 1,
        'text': 1
    };

    var firefox = navigator.userAgent.indexOf('Firefox') !== -1;

    editor.method('assets:edit', function (asset) {
        if (asset.get('type') === 'script' && editor.call('project:settings').get('use_legacy_scripts')) {
            window.open('/editor/code/' + config.project.id + '/' + asset.get('filename'));
        } else {
            if (config.self.codeEditor2) {
                // open the new code editor - try to focus existing tab if it exists
                // (only works in Chrome and only if the Code Editor has been opened by the Editor)

                if (firefox) {
                    // (Firefox doesn't work at all so open a new tab everytime)
                    window.open('/editor/code/' + config.project.id + '?tabs=' + asset.get('id'));
                } else {
                    var wnd = window.open('', 'codeeditor:' + config.project.id);
                    if (wnd.editor) {
                        wnd.editor.call('files:selectWhenReady', asset.get('id'));
                    } else {
                        wnd.location.href = '/editor/code/' + config.project.id + '?tabs=' + asset.get('id');
                    }
                }

            } else {
                window.open('/editor/asset/' + asset.get('id'), asset.get('id')).focus();
            }
        }
    });

    var dblClick = function(key, asset) {
        var gridItem = editor.call('assets:panel:get', asset.get(key));
        if (! gridItem)
            return;

        gridItem.element.addEventListener('dblclick', function(evt) {
            editor.call('assets:edit', asset);
        }, false);
    };

    editor.on('assets:add', function(asset) {
        if (! types[asset.get('type')])
            return;

        dblClick('id', asset);
    });

    editor.on('sourcefiles:add', function(file) {
        dblClick('filename', file);
    });
});
