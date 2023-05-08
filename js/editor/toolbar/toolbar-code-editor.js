import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    if (editor.call('settings:project').get('useLegacyScripts'))
        return;

    const toolbar = editor.call('layout.toolbar');
    const firefox = navigator.userAgent.indexOf('Firefox') !== -1;

    const button = new Button({
        class: 'pc-icon',
        icon: 'E130'
    });

    const publishButton = toolbar.dom.querySelector('.publish-download');
    toolbar.appendBefore(button, publishButton);

    button.on('click', function () {
        editor.call('picker:codeeditor');
    });

    editor.method('picker:codeeditor', function (asset) {
        // open the new code editor - try to focus existing tab if it exists
        // (only works in Chrome and only if the Code Editor has been opened by the Editor)

        let url = '/editor/code/' + config.project.id;

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

        const name = 'codeeditor:' + config.project.id;

        if (firefox) {
            // (Firefox doesn't work at all so open a new tab every time)
            window.open(url);
        } else {
            const wnd = window.open('', name);
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
        target: button.dom,
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
