editor.once('load', function () {
    'use strict';

    var panelName = new ui.Panel();
    panelName.flex = true;
    var label = new ui.Label({
        text: 'New Branch Name'
    });
    label.class.add('left');
    panelName.append(label);

    var fieldBranchName = new ui.TextField();
    fieldBranchName.flexGrow = 1;
    fieldBranchName.renderChanges = false;
    fieldBranchName.keyChange = true;
    panelName.append(fieldBranchName);

    // blur on enter
    fieldBranchName.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
            this.blur();
            createBranch();
        }
    });

    var panelFrom = new ui.Panel();
    panelFrom.flex = true;
    label = new ui.Label({
        text: 'Branching From'
    });
    label.class.add('left');
    panelFrom.append(label);

    var labelBranch = new ui.Label();
    labelBranch.renderChanges = false;
    panelFrom.append(labelBranch);

    var panelCheckpoint = new ui.Panel();
    panelCheckpoint.flex = true;
    label = new ui.Label({
        text: 'Using Checkpoint'
    });
    label.class.add('left');
    panelCheckpoint.append(label);

    var labelCheckpoint = new ui.Label();
    labelCheckpoint.renderChanges = false;
    panelCheckpoint.append(labelCheckpoint);

    var panel = editor.call('picker:versioncontrol:createWidget', {
        title: 'Create a new branch',
        note: 'A new branch will create an independent line of development where you can work in isolation from other team members. You will lose any un-checkpointed progress by creating a new branch!',
        mainContents: [panelName, panelFrom, panelCheckpoint],
        buttons: {
            confirm: {
                text: 'Create New Branch',
                highlighted: true,
                onClick: function () {
                    createBranch();
                }
            }
        }
    });
    panel.class.add('create-branch');

    var createBranch = function () {
        if (panel.buttonConfirm.disabled) return;
        panel.emit('confirm', {
            name: fieldBranchName.value
        });
    };

    panel.on('hide', function () {
        labelBranch.text = '';
        labelCheckpoint.text = '';
        fieldBranchName.value = '';
        panel.buttonConfirm.disabled = true;
    });

    panel.on('show', function () {
        panel.checkpointId = null;
        panel.sourceBranch = null;
        fieldBranchName.focus();
    });

    fieldBranchName.on('change', function (value) {
        panel.buttonConfirm.disabled = !value;
    });

    panel.setSourceBranch = function (branch) {
        panel.sourceBranch = branch;
        labelBranch.text = branch.name;
    };

    panel.setCheckpointId = function (checkpointId) {
        panel.checkpointId = checkpointId;
        labelCheckpoint.text = checkpointId.substring(0, 7);
    };

    editor.method('picker:versioncontrol:widget:createBranch', function () {
        return panel;
    });
});
