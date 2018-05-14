editor.once('load', function () {
    'use strict';

    var panelName = new ui.Panel();
    panelName.flex = true;
    panelName.append(new ui.Label({
        text: 'New Branch Name'
    }));

    var fieldBranchName = new ui.TextField();
    fieldBranchName.flexGrow = 1;
    fieldBranchName.renderChanges = false;
    fieldBranchName.keyChange = true;
    panelName.append(fieldBranchName);

    var panelFrom = new ui.Panel();
    panelFrom.flex = true;
    panelFrom.append(new ui.Label({
        text: 'Branching From'
    }));

    var labelBranch = new ui.Label();
    labelBranch.renderChanges = false;
    panelFrom.append(labelBranch);

    var panelCheckpoint = new ui.Panel();
    panelCheckpoint.flex = true;
    panelCheckpoint.append(new ui.Label({
        text: 'Using Checkpoint'
    }))

    var labelCheckpoint = new ui.Label();
    labelCheckpoint.renderChanges = false;
    panelCheckpoint.append(labelCheckpoint);

    var panel = editor.call('picker:versioncontrol:createWidget', {
        title: 'Create a new branch',
        note: 'A new branch will create an independent line of development where you can work in isolation from other team members.',
        mainContents: [panelName, panelFrom, panelCheckpoint],
        buttons: {
            confirm: {
                text: 'Create New Branch',
                highlighted: true,
                onClick: function () {
                    panel.emit('confirm', {
                        name: fieldBranchName.value
                    })
                }
            }
        }
    });
    panel.class.add('create-branch');

    panel.on('hide', function () {
        labelBranch.text = '';
        labelCheckpoint.text = '';
        panel.buttonConfirm.disabled = true;
    });

    fieldBranchName.on('change', function (value) {
        panel.buttonConfirm.disabled = !value;
    });

    panel.setCheckpoint = function (checkpoint) {
        labelCheckpoint.text = checkpoint.id + ' - ' + editor.call('datetime:convert', checkpoint.created);

        // TODO: load branch name from checkpoint
        labelBranch.text = checkpoint.branch;
    };

    editor.method('picker:versioncontrol:widget:createBranch', function () {
        return panel;  
    });
});