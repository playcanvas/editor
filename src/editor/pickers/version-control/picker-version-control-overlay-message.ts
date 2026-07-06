import { Container, Overlay, Label } from '@playcanvas/pcui';

const ICONS = {
    loading: 'spinner',
    success: 'check',
    error: 'cross',
    merge: ''
};

const makeIcon = (state: keyof typeof ICONS) => {
    const icon = document.createElement('span');
    icon.classList.add('vc-overlay-icon', state);
    icon.setAttribute('aria-hidden', 'true');

    if (state === 'merge') {
        icon.innerHTML = '&#xE431;';
    } else {
        icon.appendChild(document.createElement('span')).classList.add(ICONS[state]);
    }

    return icon;
};

editor.once('load', () => {
    editor.method('picker:versioncontrol:createOverlay', (args) => {
        const overlay = new Overlay({
            class: 'version-control-overlay',
            hidden: true
        });

        const root = editor.call('layout.root');
        root.append(overlay);

        const panel = new Container({
            class: 'main'
        });
        overlay.append(panel);

        const header = new Container({
            class: 'vc-overlay-header'
        });
        panel.append(header);

        header.append(
            new Label({
                class: 'vc-heading',
                text: 'Version control'
            })
        );

        const body = new Container({
            class: 'vc-overlay-body'
        });
        panel.append(body);

        const card = new Container({
            class: 'status-card'
        });
        body.append(card);

        const row = new Container({
            class: 'status-row'
        });
        card.append(row);

        const iconCell = new Container({
            class: 'icon-cell'
        });
        row.append(iconCell);

        const icons = {
            loading: makeIcon('loading'),
            success: makeIcon('success'),
            error: makeIcon('error'),
            merge: makeIcon('merge')
        };
        iconCell.domContent.append(icons.loading, icons.success, icons.error, icons.merge);

        const panelRight = new Container({
            class: ['copy', 'right']
        });
        row.append(panelRight);

        const labelTitle = new Label({
            class: 'title',
            text: args.title ?? ''
        });
        panelRight.append(labelTitle);

        const labelMessage = new Label({
            class: 'message',
            text: args.message ?? ''
        });
        panelRight.append(labelMessage);

        const setStatus = (state: 'loading' | 'success' | 'error' | 'merge') => {
            overlay.class.remove('loading', 'success', 'error', 'merge');
            overlay.class.add(state);
            icons.loading.classList.toggle('hidden', state !== 'loading');
            icons.success.classList.toggle('hidden', state !== 'success');
            icons.error.classList.toggle('hidden', state !== 'error');
            icons.merge.classList.toggle('hidden', state !== 'merge');
        };

        overlay.setMessage = function (msg: string) {
            labelMessage.text = msg;
        };

        overlay.setTitle = function (title: string) {
            labelTitle.text = title;
        };

        overlay.setStatus = function (state: 'loading' | 'success' | 'error' | 'merge') {
            setStatus(state);
        };

        overlay.setLoading = function (_loading: boolean) {
            return undefined;
        };

        overlay.on('show', () => {
            if (editor.call('picker:versioncontrol:isProgressWidgetVisible')) {
                overlay.class.add('show-behind-picker');
            } else {
                overlay.class.remove('show-behind-picker');
            }

            // editor-blocking popup opened
            editor.emit('picker:open', 'version-control-overlay');
        });

        overlay.on('hide', () => {
            // editor-blocking popup closed
            editor.emit('picker:close', 'version-control-overlay');
        });

        overlay.setLoading(!!args.loading);
        setStatus(args.status ?? (args.loading ? 'loading' : 'success'));
        return overlay;
    });
});
