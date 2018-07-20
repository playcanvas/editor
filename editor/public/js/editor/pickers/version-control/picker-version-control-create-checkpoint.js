editor.once('load', function () {
    'use strict';

    var labelDesc = new ui.Label({
        text: 'Description:'
    });
    labelDesc.class.add('small');

    var fieldDescription = new ui.TextAreaField({
        blurOnEnter: false
    });
    fieldDescription.renderChanges = false;
    fieldDescription.keyChange = true;
    fieldDescription.flexGrow = 1;

    var create = function () {
        panel.emit('confirm', {
            description: fieldDescription.value.trim()
        });
    };

    fieldDescription.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
            if (! panel.buttonConfirm.disabled) {
                create();
            }
        }
    });

    var panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Create a new checkpoint',
        note: 'A new checkpoint will take a snapshot of the current branch which you can revert to at a later date.',
        mainContents: [labelDesc, fieldDescription],
        buttons: {
            confirm: {
                text: 'Create Checkpoint',
                highlighted: true,
                onClick: create
            }
        }
    });
    panel.class.add('create-checkpoint');

    panel.buttonConfirm.disabled = true;

    fieldDescription.on('change', function (value) {
        panel.buttonConfirm.disabled = !value.trim();
    });

    panel.on('hide', function () {
        fieldDescription.value = '';
        panel.buttonConfirm.disabled = true;
    });

    panel.on('show', function () {
        setTimeout(function () {
            fieldDescription.focus();
        });
    });

    editor.method('picker:versioncontrol:widget:createCheckpoint', function () {
        return panel;
    });
});
