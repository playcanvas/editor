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

    var currentBranch = null;

    var panel = editor.call('picker:versioncontrol:createWidget', {
        note: 'Archiving this branch will place it in the archive where it can be restored at a later date. If you are sure then please type the name of the branch below.',
        mainContents: [label, fieldName],
        buttons: {
            cancel: {
                highlighted: true
            },
            confirm: {
                text: 'Archive Branch'
            }
        }
    });
    panel.class.add('archive-branch');

    panel.buttonConfirm.disabled = true;
    fieldName.on('change', function () {
        if (! currentBranch) return;

        panel.buttonConfirm.disabled = fieldName.value !== currentBranch.name;
    });

    panel.on('hide', function () {
        fieldName.value = '';
        panel.buttonConfirm.disabled = true;
    });

    panel.setBranch = function (branch) {
        currentBranch = branch;
        panel.labelTitle.text = 'Archive the branch "' + branch.name + '" ? ';
    };

    editor.method('picker:versioncontrol:widget:archiveBranch', function () {
        return panel;  
    });
});