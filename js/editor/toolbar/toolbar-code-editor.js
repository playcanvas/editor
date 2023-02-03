import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    'use strict';

    if (editor.call('settings:project').get('useLegacyScripts'))
        return;

    var toolbar = editor.call('layout.toolbar');
    var firefox = navigator.userAgent.indexOf('Firefox') !== -1;

    var button = new Button({
        icon: 'E130'
    });
    button.class.add('pc-icon');

    var publishButton = toolbar.dom.querySelector('.publish-download');
    toolbar.appendBefore(button, publishButton);

    button.on('click', function () {
        editor.call('picker:codeeditor');
    });

    editor.method('picker:codeeditor', function (asset) {
        // open the new code editor - try to focus existing tab if it exists
        // (only works in Chrome and only if the Code Editor has been opened by the Editor)

        var url = '/editor/code/' + config.project.id;

        const query = [];
        if (location.search.includes('use_local_frontend')) {
            query.push('use_local_frontend');
        }
        if (asset) {
            query.push(`tabs=${asset.get('id')}`);
        }
        if (query.length) {
            url += '?' + query.join('&');
        }

        var name = 'codeeditor:' + config.project.id;

        if (firefox) {
            // (Firefox doesn't work at all so open a new tab every time)
            window.open(url);
        } else {
            var wnd = window.open('', name);
            try {
                if (wnd.editor && wnd.editor.isCodeEditor) {
                    if (asset) {
                        wnd.editor.call('integration:selectWhenReady', asset.get('id'));
                    }
                } else {
                    wnd.location = url;
                }
            } catch (ex) {
                // accessing wnd will throw an exception if it
                // is at a different domain
                window.open(url, name);
            }

        }
    });

    Tooltip.attach({
        target: button.element,
        text: 'Code Editor',
        align: 'left',
        root: editor.call('layout.root')
    });

    editor.call('hotkey:register', 'code-editor', {
        key: 'i',
        ctrl: true,
        callback: function () {
            editor.call('picker:codeeditor');
        }
    });
});
