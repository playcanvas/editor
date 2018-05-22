editor.once('load', function () {
    'use strict';

    var labelDesc = new ui.Label({
        text: 'Description:'
    });
    labelDesc.class.add('small');

    var fieldDescription = new ui.TextAreaField();
    fieldDescription.renderChanges = false;
    fieldDescription.keyChange = true;
    fieldDescription.flexGrow = 1;

    var panel = editor.call('picker:versioncontrol:createWidget', {
        title: 'Create a new checkpoint',
        note: 'A new checkpoint will take a snapshot of the current branch which you can revert to at a later date.',
        mainContents: [labelDesc, fieldDescription],
        buttons: {
            confirm: {
                text: 'Create Checkpoint',
                highlighted: true,
                onClick: function () {
                    panel.emit('confirm', {
                        description: fieldDescription.value.trim()
                    })
                }
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
        fieldDescription.focus();  
    });

    editor.method('picker:versioncontrol:widget:createCheckpoint', function () {
        return panel;  
    });
});