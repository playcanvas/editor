import { LegacyButton } from '@/common/ui/button';
import { LegacyLabel } from '@/common/ui/label';
import { LegacyPanel } from '@/common/ui/panel';

editor.once('load', () => {
    let sidePanelIndex = 1;

    editor.method('picker:versioncontrol:createSidePanel', (args) => {
        const panel = new LegacyPanel();
        panel.class.add('side-panel-widget');

        const panelTop = new LegacyPanel();
        panelTop.class.add('top');
        panel.append(panelTop);

        const labelTitle = new LegacyLabel({
            text: args.title || ''
        });
        labelTitle.renderChanges = false;
        labelTitle.class.add('title', 'selectable');
        panelTop.append(labelTitle);

        const labelNote = new LegacyLabel({
            text: args.note || ''
        });
        labelNote.renderChanges = false;
        labelNote.class.add('note', 'selectable');
        panelTop.append(labelNote);

        let panelMain;
        if (args.mainContents) {
            panelMain = new LegacyPanel();
            panel.append(panelMain);
            panelMain.class.add('main');
            panelMain.flex = true;

            for (let i = 0; i < args.mainContents.length; i++) {
                panelMain.append(args.mainContents[i]);
            }
        }

        const panelButtons = new LegacyPanel();
        panelButtons.class.add('buttons');
        panel.append(panelButtons);

        const getButtonOption = function (button: string, name: string) {
            return args.buttons && args.buttons[button] && args.buttons[button][name];
        };

        const btnConfirm = new LegacyButton({
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

        const btnCancel = new LegacyButton({
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
            // make main panel cover all the height between the top and bottom sections
            if (panelMain) {
                panelMain.element.style.height = `calc(100% - ${panelTop.element.offsetHeight + panelButtons.element.offsetHeight}px)`;
            }

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
