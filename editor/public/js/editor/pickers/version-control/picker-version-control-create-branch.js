editor.once('load', function () {
    'use strict';

    var boxFrom = new ui.VersionControlSidePanelBox({
        headerNote: 'Branching from'
    });

    var labelIcon = new ui.Label({
        text: '&#58265;',
        unsafe: true
    });
    labelIcon.class.add('branch-icon');

    var boxNewBranch = new ui.VersionControlSidePanelBox({
        headerNote: 'New branch'
    });

    var panelName = new ui.Panel();
    panelName.flex = true;
    var label = new ui.Label({
        text: 'New Branch Name'
    });
    label.class.add('left');
    panelName.append(label);
    panelName.style.padding = '10px';

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

    boxNewBranch.append(panelName);

    var panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Create a new branch',
        note: 'A new branch will create an independent line of development where you can work in isolation from other team members.',
        mainContents: [boxFrom.panel, labelIcon, boxNewBranch.panel],
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
            name: fieldBranchName.value,
            sourceBranchId: panel.sourceBranch.id
        });
    };

    panel.on('hide', function () {
        boxFrom.clear();
        boxNewBranch.header = ' ';
        fieldBranchName.value = '';
        panel.buttonConfirm.disabled = true;
    });

    panel.on('show', function () {
        panel.checkpoint = null;
        panel.sourceBranch = null;
        fieldBranchName.focus();
    });

    fieldBranchName.on('change', function (value) {
        panel.buttonConfirm.disabled = !value;
        boxNewBranch.header = value || ' ';
    });

    panel.setSourceBranch = function (branch) {
        panel.sourceBranch = branch;
        boxFrom.header = branch.name;
    };

    panel.setCheckpoint = function (checkpoint) {
        panel.checkpoint = checkpoint;
        boxFrom.setCheckpoint(checkpoint);
    };

    editor.method('picker:versioncontrol:widget:createBranch', function () {
        return panel;
    });
});
