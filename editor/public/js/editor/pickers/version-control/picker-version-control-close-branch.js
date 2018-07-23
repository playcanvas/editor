editor.once('load', function () {
    'use strict';

    var boxBranch = new ui.VersionControlSidePanelBox({

        discardChanges: true,
        discardChangesHelp: 'If you choose to not discard your changes, a checkpoint will be created before closing the branch.'
    });

    var labelIcon = new ui.Label({
        text: '&#57686;',
        unsafe: true
    });
    labelIcon.class.add('close-icon');

    var boxConfirm = new ui.VersionControlSidePanelBox({
        header: 'ARE YOU SURE?',
        noIcon: true,
    });

    var panelTypeName = new ui.Panel();
    panelTypeName.flex = true;
    panelTypeName.style.padding = '10px';

    var label = new ui.Label({
        text: 'Type branch name to confirm:'
    });
    label.class.add('small');
    panelTypeName.append(label);

    var fieldName = new ui.TextField();
    fieldName.renderChanges = false;
    fieldName.flexGrow = 1;
    fieldName.keyChange = true;
    panelTypeName.append(fieldName);

    fieldName.elementInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13 && ! panel.buttonConfirm.disabled) {
            panel.emit('confirm');
        }
    });

    boxConfirm.append(panelTypeName);

    var checkpointRequest = null;

    var panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Close branch?',
        note: 'You will no longer be able to work on this branch unless you re-open it again.',
        mainContents: [boxConfirm.panel, labelIcon, boxBranch.panel],
        buttons: {
            confirm: {
                highlighted: true,
                text: 'Close Branch'
            }
        }
    });
    panel.class.add('close-branch');

    panel.buttonConfirm.disabled = true;
    fieldName.on('change', function () {
        if (! panel.branch) return;

        panel.buttonConfirm.disabled = fieldName.value.toLowerCase() !== panel.branch.name.toLowerCase();
    });

    boxBranch.on('discardChanges', function (value) {
        panel.discardChanges = value;
    });

    panel.on('show', function () {
        fieldName.focus();
    });

    panel.on('hide', function () {
        fieldName.value = '';
        panel.buttonConfirm.disabled = true;
        boxBranch.clear();
        if (checkpointRequest) {
            checkpointRequest.abort();
            checkpointRequest = null;
        }
    });

    panel.setBranch = function (branch) {
        panel.branch = branch;
        boxBranch.header = branch.name;

        if (checkpointRequest) {
            checkpointRequest.abort();
        }

        checkpointRequest = editor.call('checkpoints:get', branch.latestCheckpointId, function (err, checkpoint) {
            checkpointRequest = null;
            boxBranch.setCheckpoint(checkpoint);
        });
    };

    editor.method('picker:versioncontrol:widget:closeBranch', function () {
        return panel;
    });
});
