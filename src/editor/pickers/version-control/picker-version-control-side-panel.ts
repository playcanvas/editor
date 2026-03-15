import { Button, Container, Label } from '@playcanvas/pcui';

editor.once('load', () => {
    let sidePanelIndex = 1;

    editor.method('picker:versioncontrol:createSidePanel', (args) => {
        const panel = new Container({
            class: 'side-panel-widget'
        });

        const panelTop = new Container({
            class: 'top'
        });
        panel.append(panelTop);

        const labelTitle = new Label({
            text: args.title || '',
            class: ['title', 'selectable']
        });
        panelTop.append(labelTitle);

        const labelNote = new Label({
            text: args.note || '',
            class: ['note', 'selectable']
        });
        panelTop.append(labelNote);

        let panelMain;
        if (args.mainContents) {
            panelMain = new Container({
                flex: true,
                class: 'main'
            });
            panel.append(panelMain);

            for (let i = 0; i < args.mainContents.length; i++) {
                panelMain.append(args.mainContents[i]);
            }
        }

        const panelButtons = new Container({
            class: 'buttons'
        });
        panel.append(panelButtons);

        const getButtonOption = function (button: string, name: string) {
            return args.buttons && args.buttons[button] && args.buttons[button][name];
        };

        const btnConfirm = new Button({
            text: getButtonOption('confirm', 'text') || 'Confirm'
        });
        if (getButtonOption('confirm', 'highlighted')) {
            btnConfirm.class.add('highlighted');
        }
        panelButtons.append(btnConfirm);

        btnConfirm.on('click', () => {
            const onClick = getButtonOption('confirm', 'onClick');
            if (onClick) {
                onClick();
            } else {
                panel.emit('confirm');
            }
        });

        const btnCancel = new Button({
            text: getButtonOption('cancel', 'text') || 'Cancel'
        });
        if (getButtonOption('cancel', 'highlighted')) {
            btnCancel.class.add('highlighted');
        }
        panelButtons.append(btnCancel);
        btnCancel.on('click', () => {
            const onClick = getButtonOption('cancel', 'onClick');
            if (onClick) {
                onClick();
            } else {
                panel.emit('cancel');
            }
        });

        panel.labelTitle = labelTitle;
        panel.labelNote = labelNote;
        panel.panelMain = panelMain;
        panel.buttonCancel = btnCancel;
        panel.buttonConfirm = btnConfirm;

        const enterHotkeyAction = `version-control-enter-${sidePanelIndex++}`;

        panel.on('show', () => {
            // Defer height calculation so callers can update title/note text
            // before offsetHeight is read (empty labels have 0px height)
            requestAnimationFrame(() => {
                if (panelMain) {
                    panelMain.style.height = `calc(100% - ${panelTop.dom.offsetHeight + panelButtons.dom.offsetHeight}px)`;
                }
            });

            // Register Enter hotkey to click the highlighted button
            editor.call('hotkey:register', enterHotkeyAction, {
                key: 'Enter',
                callback: function (e: KeyboardEvent) {
                    if (btnCancel.class.contains('highlighted')) {
                        if (btnCancel.disabled) {
                            return;
                        }
                        btnCancel.emit('click');
                    } else if (btnConfirm.class.contains('highlighted')) {
                        if (btnConfirm.disabled) {
                            return;
                        }
                        btnConfirm.emit('click');
                    }
                }
            });
        });

        panel.on('hide', () => {
            // if we remove during the 'hide' event it will throw an error in the hotkey lib
            requestAnimationFrame(() => {
                editor.call('hotkey:unregister', enterHotkeyAction);
            });
        });

        return panel;
    });
});
