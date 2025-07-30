import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyPanel } from '../../../common/ui/panel.ts';
import { LegacyTextField } from '../../../common/ui/text-field.ts';

editor.once('load', () => {
    const boxRestore = new VersionControlSidePanelBox({
        header: 'RESETTING TO'
    });

    const boxConfirm = new VersionControlSidePanelBox({
        header: 'ARE YOU SURE?',
        noIcon: true
    });

    const panelWriteConfirm = new LegacyPanel();
    panelWriteConfirm.flex = true;
    panelWriteConfirm.style.padding = '10px';

    const label = new LegacyLabel({
        text: 'Type "hard reset" to confirm'
    });
    label.class.add('small');
    panelWriteConfirm.append(label);

    const textField = new LegacyTextField();
    textField.renderChanges = false;
    textField.flexGrow = 1;
    textField.keyChange = true;
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

    textField.elementInput.addEventListener('keydown', (e) => {
        if (e.keyCode === 13 && !panel.buttonConfirm.disabled) {
            panel.emit('confirm');
        }
    });

    editor.method('picker:versioncontrol:widget:hardResetCheckpoint', () => {
        return panel;
    });

    panel.setCheckpoint = function (checkpoint) {
        textField.value = '';
        panel.checkpoint = checkpoint;
        boxRestore.setCheckpoint(checkpoint);
        panel.labelTitle.text = `Hard reset to checkpoint "${checkpoint.id.substring(0, 7)}" ?`;
    };

    textField.on('change', () => {
        if (!panel.checkpoint) return;

        panel.buttonConfirm.disabled = (textField.value !== 'hard reset' && textField.value !== '"hard reset"');
    });

    panel.on('hide', () => {
        boxRestore.clear();
    });
});
