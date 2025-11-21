import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '../../common/ui/tooltip';

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

        const projectId = config.project?.id;
        let url = `/editor/code/${projectId}`;

        const query = [];
        const params = new URLSearchParams(location.search);
        if (asset) {
            query.push(`tabs=${asset.get('id')}`);
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
            // check if the window is already open and if it has the code editor loaded
            if (wnd?.editor?.isCodeEditor) {
                if (asset) {
                    wnd.editor.call('integration:selectWhenReady', asset.get('id'), options || {});
                }
                wnd?.focus();
                return;
            }

            // if the window is not open or does not have the code editor loaded, set the location
            // and wait for the code editor to mark itself as ready
            if (asset) {
                const onmessage = (event) => {
                    if (event.data !== 'ready') {
                        return;
                    }
                    wnd.editor.call('integration:selectWhenReady', asset.get('id'), options || {});
                    window.removeEventListener('message', onmessage);
                };
                window.addEventListener('message', onmessage);
            }
            wnd.location = url;
            wnd?.focus();
        } catch (ex) {
            // accessing wnd will throw an exception if it is at a different domain
            const newWnd = window.open(url, name);
            newWnd?.focus();
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
