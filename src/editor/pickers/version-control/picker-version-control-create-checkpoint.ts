import { Button, Label, TextAreaInput } from '@playcanvas/pcui';

editor.once('load', () => {
    const labelDesc = new Label({
        text: 'Description:'
    });

    const fieldDescription = new TextAreaInput({
        blurOnEnter: false,
        keyChange: true,
        renderChanges: false,
        flexGrow: 1
    });

    const viewChangesButton = new Button({
        text: 'View Changes'
    });

    viewChangesButton.on('click', () => {
        panel.emit('diff');
    });

    const create = () => {
        panel.emit('confirm', {
            description: fieldDescription.value.trim()
        });
    };

    fieldDescription.on('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
