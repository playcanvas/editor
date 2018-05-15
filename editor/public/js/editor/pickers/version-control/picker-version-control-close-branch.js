editor.once('load', function () {
    'use strict';

    var label = new ui.Label({
        text: 'Type branch name to confirm'
    });
    label.class.add('small');
    
    var fieldName = new ui.TextField();
    fieldName.renderChanges = false;
    fieldName.flexGrow = 1;
    fieldName.keyChange = true;

    var panel = editor.call('picker:versioncontrol:createWidget', {
        note: 'Closing this branch will place it in the archive where it can be restored at a later date. If you are sure then please type the name of the branch below.',
        mainContents: [label, fieldName],
        buttons: {
            cancel: {
                highlighted: true
            },
            confirm: {
                text: 'Close Branch'
            }
        }
    });
    panel.class.add('close-branch');

    panel.buttonConfirm.disabled = true;
    fieldName.on('change', function () {
        if (! panel.branch) return;

        panel.buttonConfirm.disabled = fieldName.value !== panel.branch.name;
    });

    panel.on('hide', function () {
        fieldName.value = '';
        panel.buttonConfirm.disabled = true;
    });

    panel.setBranch = function (branch) {
        panel.branch = branch;
        panel.labelTitle.text = 'Close the branch "' + branch.name + '" ? ';
    };

    editor.method('picker:versioncontrol:widget:closeBranch', function () {
        return panel;  
    });
});