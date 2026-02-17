import { Container, Overlay, Label } from '@playcanvas/pcui';

editor.once('load', () => {
    editor.method('picker:versioncontrol:createOverlay', (args) => {
        // overlay
        const overlay = new Overlay({
            class: 'version-control-overlay',
            hidden: true
        });

        const root = editor.call('layout.root');
        root.append(overlay);

        // main panel
        const panel = new Container({
            class: 'main'
        });
        overlay.append(panel);

        // icon on the left
        const panelIcon = new Container({
            class: 'left'
        });
        panel.append(panelIcon);

        panelIcon.domContent.appendChild(args.icon);

        // content on the right
        const panelRight = new Container({
            class: 'right'
        });
        panel.append(panelRight);

        // title
        const labelTitle = new Label({
            class: 'title',
            text: args.title
        });
        panelRight.append(labelTitle);

        // message
        const labelMessage = new Label({
            class: 'message',
            text: args.message
        });
        panelRight.append(labelMessage);

        // public methods
        overlay.setMessage = function (msg: string) {
            labelMessage.text = msg;
        };

        overlay.setTitle = function (title: string) {
            labelTitle.text = title;
        };

        overlay.on('show', () => {
            if (editor.call('picker:versioncontrol:isProgressWidgetVisible')) {
                overlay.class.add('show-behind-picker');
            }

            // editor-blocking popup opened
            editor.emit('picker:open', 'version-control-overlay');
        });

        overlay.on('hide', () => {
            // editor-blocking popup closed
            editor.emit('picker:close', 'version-control-overlay');
        });

        return overlay;
    });
});
