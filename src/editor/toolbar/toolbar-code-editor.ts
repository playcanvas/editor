import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip.ts';

editor.once('load', () => {
    const toolbar = editor.call('layout.toolbar');

    const button = new Button({
        class: 'pc-icon',
        icon: 'E130'
    });

    const publishButton = toolbar.dom.querySelector('.publish-download');
    toolbar.appendBefore(button, publishButton);

    button.on('click', () => {
        editor.call('picker:codeeditor');
    });

    editor.method('picker:codeeditor', (asset, options) => {
        // open the new code editor - try to focus existing tab if it exists

        const projectId = (config as any).project?.id;
        let url = `/editor/code/${projectId}`;

        const query = [];
        const params = new URLSearchParams(location.search);
        if (asset) {
            query.push(`tabs=${asset.get('id')}`);
        }
        if (params.has('v2')) {
            query.push('v2');
        }
        if (params.has('version')) {
            query.push('version');
        }
        if (params.has('use_local_frontend')) {
            query.push('use_local_frontend');
        }
        if (params.has('use_local_engine')) {
            query.push(`use_local_engine=${params.get('use_local_engine')}`);
        }
        if (query.length) {
            url += `?${query.join('&')}`;
        }

        const name = `codeeditor:${projectId}`;

        const wnd = window.open('', name);
        try {
            if (wnd.editor && wnd.editor.isCodeEditor) {
                if (asset) {
                    wnd.editor.call('integration:selectWhenReady', asset.get('id'), options || {});
                }
            } else {
                const onCodeEditorReady = (event) => {
                    if (event.data === 'start') {
                        wnd.editor.call('integration:selectWhenReady', asset.get('id'), options || {});
                        window.removeEventListener('message', onCodeEditorReady);
                    }
                };
                window.addEventListener('message', onCodeEditorReady);
                wnd.location = url;
            }
            if (wnd) {
                wnd.focus();
            }
        } catch (ex) {
            // accessing wnd will throw an exception if it is at a different domain
            const newWnd = window.open(url, name);
            if (newWnd) {
                newWnd.focus();
            }
        }
    });

    LegacyTooltip.attach({
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
