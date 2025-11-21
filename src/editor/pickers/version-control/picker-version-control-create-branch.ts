import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box';
import { LegacyLabel } from '../../../common/ui/label';
import { LegacyPanel } from '../../../common/ui/panel';
import { LegacyTextField } from '../../../common/ui/text-field';

editor.once('load', () => {
    const boxFrom = new VersionControlSidePanelBox({
        headerNote: 'Branching from'
    });

    const labelIcon = new LegacyLabel({
        text: '&#58265;',
        unsafe: true
    });
    labelIcon.class.add('branch-icon');

    const boxNewBranch = new VersionControlSidePanelBox({
        headerNote: 'New branch'
    });

    const panelName = new LegacyPanel();
    panelName.flex = true;
    const label = new LegacyLabel({
        text: 'New Branch Name'
    });
    label.class.add('left');
    panelName.append(label);
    panelName.style.padding = '10px';

    const fieldBranchName = new LegacyTextField();
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

    const panel = editor.call('picker:versioncontrol:createSidePanel', {
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
        if (panel.buttonConfirm.disabled) {
            return;
        }
        panel.emit('confirm', {
            name: fieldBranchName.value,
            sourceBranchId: panel.sourceBranch.id
        });
    };

    panel.on('hide', () => {
        boxFrom.clear();
        boxNewBranch.header = ' ';
        fieldBranchName.value = '';
        panel.buttonConfirm.disabled = true;
    });

    panel.on('show', () => {
        panel.checkpoint = null;
        panel.sourceBranch = null;
        fieldBranchName.focus();
    });

    fieldBranchName.on('change', (value) => {
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

    editor.method('picker:versioncontrol:widget:createBranch', () => {
        return panel;
    });
});
