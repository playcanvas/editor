import { Container, Label, TextInput } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';

import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box';

editor.once('load', () => {
    const boxBranch = new VersionControlSidePanelBox();

    const labelIcon = new Label({
        text: '\uE156',
        class: 'close-icon'
    });

    const boxConfirm = new VersionControlSidePanelBox({
        header: 'ARE YOU SURE?',
        noIcon: true
    });

    const panelTypeName = new Container({ flex: true });
    const label = new Label({
        text: 'Type branch name to confirm:',
        class: 'small'
    });
    panelTypeName.append(label);

    const fieldName = new TextInput({
        renderChanges: false,
        flexGrow: 1,
        keyChange: true
    });
    panelTypeName.append(fieldName);

    fieldName.on('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !panel.buttonConfirm.disabled) {
            panel.emit('confirm');
        }
    });

    boxConfirm.append(panelTypeName);

    let checkpointRequest: { abort: () => void } | null = null;

    const panel = editor.call('picker:versioncontrol:createSidePanel', {
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
    fieldName.on('change', () => {
        if (!panel.branch) {
            return;
        }

        panel.buttonConfirm.disabled = fieldName.value.toLowerCase() !== panel.branch.name.toLowerCase();
    });

    panel.on('show', () => {
        fieldName.focus();
    });

    panel.on('hide', () => {
        fieldName.value = '';
        panel.buttonConfirm.disabled = true;
        boxBranch.clear();
        if (checkpointRequest) {
            checkpointRequest.abort();
            checkpointRequest = null;
        }
    });

    panel.setBranch = (branch: Record<string, unknown>) => {
        panel.branch = branch;
        boxBranch.header = branch.name;

        if (checkpointRequest) {
            checkpointRequest.abort();
        }

        checkpointRequest = handleCallback(editor.api.globals.rest.checkpoints.checkpointGet({
            checkpointId: branch.latestCheckpointId
        }), (err, checkpoint) => {
            checkpointRequest = null;

            if (err && !(err instanceof ProgressEvent)) {
                console.error(err);
            }

            boxBranch.setCheckpoint(checkpoint);
        });
    };

    editor.method('picker:versioncontrol:widget:deleteBranch', () => {
        return panel;
    });
});
