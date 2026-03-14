import { Container, Label, TextInput } from '@playcanvas/pcui';

import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box';

editor.once('load', () => {
    const boxRestore = new VersionControlSidePanelBox({
        header: 'RESETTING TO'
    });

    const boxConfirm = new VersionControlSidePanelBox({
        header: 'ARE YOU SURE?',
        noIcon: true
    });

    const panelWriteConfirm = new Container({ flex: true });
    const label = new Label({
        text: 'Type "hard reset" to confirm',
        class: 'small'
    });
    panelWriteConfirm.append(label);

    const textField = new TextInput({
        renderChanges: false,
        flexGrow: 1,
        keyChange: true
    });
    panelWriteConfirm.append(textField);

    boxConfirm.append(panelWriteConfirm);

    const panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Hard reset to checkpoint?',
        note: 'All checkpoints and changes after this checkpoint will be permanently deleted!',
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

    textField.on('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !panel.buttonConfirm.disabled) {
            panel.emit('confirm');
        }
    });

    editor.method('picker:versioncontrol:widget:hardResetCheckpoint', () => {
        return panel;
    });

    panel.setCheckpoint = (checkpoint: Record<string, unknown>) => {
        textField.value = '';
        panel.checkpoint = checkpoint;
        boxRestore.setCheckpoint(checkpoint);
        panel.labelTitle.text = `Hard reset to checkpoint "${(checkpoint.id as string).substring(0, 7)}" ?`;
    };

    textField.on('change', () => {
        if (!panel.checkpoint) {
            return;
        }

        panel.buttonConfirm.disabled = (textField.value !== 'hard reset' && textField.value !== '"hard reset"');
    });

    panel.on('hide', () => {
        boxRestore.clear();
    });
});
