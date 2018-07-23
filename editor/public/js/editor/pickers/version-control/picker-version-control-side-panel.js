editor.once('load', function () {
    'use strict';

    var sidePanelIndex = 1;

    editor.method('picker:versioncontrol:createSidePanel', function (args) {
        var panel = new ui.Panel();
        panel.class.add('side-panel-widget');

        var panelTop = new ui.Panel();
        panelTop.class.add('top');
        panel.append(panelTop);

        var labelTitle = new ui.Label({
            text: args.title || ''
        });
        labelTitle.renderChanges = false;
        labelTitle.class.add('title', 'selectable');
        panelTop.append(labelTitle);

        var labelNote = new ui.Label({
            text: args.note || ''
        });
        labelNote.renderChanges = false;
        labelNote.class.add('note', 'selectable');
        panelTop.append(labelNote);

        var panelMain;
        if (args.mainContents) {
            panelMain = new ui.Panel();
            panel.append(panelMain);
            panelMain.class.add('main');
            panelMain.flex = true;

            for (var i = 0; i < args.mainContents.length; i++) {
                panelMain.append(args.mainContents[i]);
            }
        }

        var panelButtons = new ui.Panel();
        panelButtons.class.add('buttons');
        panel.append(panelButtons);

        var getButtonOption = function (button, name) {
            return args.buttons && args.buttons[button] && args.buttons[button][name];
        };

        var btnConfirm = new ui.Button({
            text: getButtonOption('confirm', 'text') || 'Confirm'
        });
        if (getButtonOption('confirm', 'highlighted')) {
            btnConfirm.class.add('highlighted');
        }
        panelButtons.append(btnConfirm);

        btnConfirm.on('click', function () {
            var onClick = getButtonOption('confirm', 'onClick');
            if (onClick) {
                onClick();
            } else {
                panel.emit('confirm');
            }
        });

        var btnCancel = new ui.Button({
            text: getButtonOption('cancel', 'text') || 'Cancel'
        });
        if (getButtonOption('cancel', 'highlighted')) {
            btnCancel.class.add('highlighted');
        }
        panelButtons.append(btnCancel);
        btnCancel.on('click', function () {
            var onClick = getButtonOption('cancel', 'onClick');
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

        var enterHotkeyAction = 'version-control-enter-' + sidePanelIndex++;

        panel.on('show', function () {
            // make main panel cover all the height between the top and bottom sections
            if (panelMain) {
                panelMain.element.style.height = 'calc(100% - ' + (panelTop.element.offsetHeight + panelButtons.element.offsetHeight) + 'px)';
            }

            // Register Enter hotkey to click the highlighted button
            editor.call('hotkey:register', enterHotkeyAction, {
                key: 'enter',
                callback: function (e) {
                    if (btnCancel.class.contains('highlighted')) {
                        if (btnCancel.disabled) return;
                        btnCancel.emit('click');
                    } else if (btnConfirm.class.contains('highlighted')) {
                        if (btnConfirm.disabled) return;
                        btnConfirm.emit('click');
                    }
                }
            });
        });

        panel.on('hide', function () {
            // if we remove during the 'hide' event it will throw an error in the hotkey lib
            requestAnimationFrame(function () {
                editor.call('hotkey:unregister', enterHotkeyAction);
            });
        });

        return panel;
    });
});
