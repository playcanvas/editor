editor.once('load', function () {
    var boxBranch = new ui.VersionControlSidePanelBox();

    var labelIcon = new ui.Label({
        text: '&#57686;',
        unsafe: true
    });
    labelIcon.class.add('close-icon');

    var boxConfirm = new ui.VersionControlSidePanelBox({
        header: 'ARE YOU SURE?',
        noIcon: true
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
        if (e.keyCode === 13 && !panel.buttonConfirm.disabled) {
            panel.emit('confirm');
        }
    });

    boxConfirm.append(panelTypeName);

    var checkpointRequest = null;

    var panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Delete branch?',
        note: 'This action will delete all checkpoints and changes in this branch and cannot be undone!',
        mainContents: [boxConfirm.panel, labelIcon, boxBranch.panel],
        buttons: {
            cancel: {
                highlighted: true
            },
            confirm: {
                text: 'Delete Branch'
            }
        }
    });
    panel.class.add('close-branch');

    panel.buttonConfirm.disabled = true;
    fieldName.on('change', function () {
        if (!panel.branch) return;

        panel.buttonConfirm.disabled = fieldName.value.toLowerCase() !== panel.branch.name.toLowerCase();
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

            if (err) {
                console.error(err);
            }

            boxBranch.setCheckpoint(checkpoint);
        });
    };

    editor.method('picker:versioncontrol:widget:deleteBranch', function () {
        return panel;
    });
});
