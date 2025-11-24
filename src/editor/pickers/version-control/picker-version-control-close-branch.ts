import { LegacyLabel } from '@/common/ui/label';
import { LegacyPanel } from '@/common/ui/panel';
import { LegacyTextField } from '@/common/ui/text-field';
import { handleCallback } from '@/common/utils';

import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box';

editor.once('load', () => {
    const boxBranch = new VersionControlSidePanelBox({
        createTargetCheckpoint: true,
        targetCheckpointHelp: 'Tick to create a checkpoint before closing this branch. If you leave this unticked any changes will be discarded.'
    });

    const labelIcon = new LegacyLabel({
        text: '&#57686;',
        unsafe: true
    });
    labelIcon.class.add('close-icon');

    const boxConfirm = new VersionControlSidePanelBox({
        header: 'ARE YOU SURE?',
        noIcon: true
    });

    const panelTypeName = new LegacyPanel();
    panelTypeName.flex = true;
    panelTypeName.style.padding = '10px';

    const label = new LegacyLabel({
        text: 'Type branch name to confirm:'
    });
    label.class.add('small');
    panelTypeName.append(label);

    const fieldName = new LegacyTextField();
    fieldName.renderChanges = false;
    fieldName.flexGrow = 1;
    fieldName.keyChange = true;
    panelTypeName.append(fieldName);

    fieldName.elementInput.addEventListener('keydown', (e) => {
        if (e.keyCode === 13 && !panel.buttonConfirm.disabled) {
            panel.emit('confirm');
        }
    });

    boxConfirm.append(panelTypeName);

    let checkpointRequest = null;

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

    panel.createTargetCheckpoint = true;

    panel.buttonConfirm.disabled = true;
    fieldName.on('change', () => {
        if (!panel.branch) {
            return;
        }

        panel.buttonConfirm.disabled = fieldName.value.toLowerCase() !== panel.branch.name.toLowerCase();
    });

    boxBranch.on('createTargetCheckpoint', (value) => {
        panel.createTargetCheckpoint = value;
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

    panel.setBranch = function (branch) {
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

    editor.method('picker:versioncontrol:widget:closeBranch', () => {
        return panel;
    });
});
