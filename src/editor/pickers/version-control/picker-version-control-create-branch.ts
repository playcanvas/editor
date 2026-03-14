import { Container, Label, TextInput } from '@playcanvas/pcui';

import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box';

editor.once('load', () => {
    const boxFrom = new VersionControlSidePanelBox({
        headerNote: 'Branching from'
    });

    const labelIcon = new Label({
        text: '\uE399',
        class: 'branch-icon'
    });

    const boxNewBranch = new VersionControlSidePanelBox({
        headerNote: 'New branch'
    });

    const panelName = new Container({ flex: true });
    const label = new Label({
        text: 'New Branch Name',
        class: 'left'
    });
    panelName.append(label);

    const fieldBranchName = new TextInput({
        keyChange: true,
        renderChanges: false,
        flexGrow: 1
    });
    panelName.append(fieldBranchName);

    fieldBranchName.on('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
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
                onClick: () => createBranch()
            }
        }
    });
    panel.class.add('create-branch');

    const createBranch = () => {
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

    panel.setSourceBranch = (branch: Record<string, unknown>) => {
        panel.sourceBranch = branch;
        boxFrom.header = branch.name;
    };

    panel.setCheckpoint = (checkpoint: Record<string, unknown>) => {
        panel.checkpoint = checkpoint;
        boxFrom.setCheckpoint(checkpoint);
    };

    editor.method('picker:versioncontrol:widget:createBranch', () => {
        return panel;
    });
});
