import { LegacyButton } from '../../../common/ui/button.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyTextAreaField } from '../../../common/ui/textarea-field.ts';

editor.once('load', () => {
    const labelDesc = new LegacyLabel({
        text: 'Description:'
    });
    labelDesc.class.add('small');

    const fieldDescription = new LegacyTextAreaField({
        blurOnEnter: false
    });
    fieldDescription.renderChanges = false;
    fieldDescription.keyChange = true;
    fieldDescription.flexGrow = 1;

    const viewChangesButton = new LegacyButton({
        text: 'View Changes'
    });

    viewChangesButton.on('click', () => {
        panel.emit('diff');
    });

    const create = function () {
        panel.emit('confirm', {
            description: fieldDescription.value.trim()
        });
    };

    fieldDescription.elementInput.addEventListener('keydown', (e) => {
        if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
            if (!panel.buttonConfirm.disabled) {
                create();
            }
        }
    });

    const panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Create a new checkpoint',
        note: 'A new checkpoint will take a snapshot of the current branch which you can revert to at a later date.',
        mainContents: [labelDesc, fieldDescription, viewChangesButton],
        buttons: {
            confirm: {
                highlighted: true,
                text: 'Create Checkpoint',
                onClick: create
            }
        }
    });
    panel.class.add('create-checkpoint');

    panel.buttonConfirm.disabled = true;

    fieldDescription.on('change', (value) => {
        panel.buttonConfirm.disabled = !value.trim();
    });

    panel.on('hide', () => {
        fieldDescription.value = '';
        panel.buttonConfirm.disabled = true;
    });

    panel.on('show', () => {
        setTimeout(() => {
            fieldDescription.focus();
        });
    });

    editor.method('picker:versioncontrol:widget:createCheckpoint', () => {
        return panel;
    });
});
