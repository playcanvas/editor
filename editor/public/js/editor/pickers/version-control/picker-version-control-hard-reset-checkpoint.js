editor.once('load', function () {
    'use strict';

    var boxRestore = new ui.VersionControlSidePanelBox({
        header: 'RESETTING TO'
    });

    var boxConfirm = new ui.VersionControlSidePanelBox({
        header: 'ARE YOU SURE?',
        noIcon: true
    });

    var panelWriteConfirm = new ui.Panel();
    panelWriteConfirm.flex = true;
    panelWriteConfirm.style.padding = '10px';

    var label = new ui.Label({
        text: 'Type "hard reset" to confirm'
    });
    label.class.add('small');
    panelWriteConfirm.append(label);

    var textField = new ui.TextField();
    textField.renderChanges = false;
    textField.flexGrow = 1;
    textField.keyChange = true;
    panelWriteConfirm.append(textField);

    boxConfirm.append(panelWriteConfirm);

    var panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Hard reset to checkpoint?',
        note: 'All checkpoints after this checkpoint will be permanently deleted!',
        mainContents: [boxConfirm.panel, boxRestore.panel],
        buttons: {
            cancel: {
                highlighted: true
            },
            confirm: {
                text: 'Hard Reset To Checkpoint'
            }
        }
    });
    panel.buttonConfirm.disabled = true;
    panel.class.add('hard-reset-checkpoint');

    textField.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13 && !panel.buttonConfirm.disabled) {
            panel.emit('confirm');
        }
    });

    editor.method('picker:versioncontrol:widget:hardResetCheckpoint', function () {
        return panel;
    });

    panel.setCheckpoint = function (checkpoint) {
        textField.value = '';
        panel.checkpoint = checkpoint;
        boxRestore.setCheckpoint(checkpoint);
        panel.labelTitle.text = 'Hard reset to checkpoint "' + checkpoint.id.substring(0, 7) + '" ?';
    };

    textField.on('change', function () {
        if (!panel.checkpoint) return;

        panel.buttonConfirm.disabled = (textField.value !== 'hard reset' && textField.value !== '"hard reset"');
    });

    panel.on('hide', function () {
        boxRestore.clear();
    });
});
