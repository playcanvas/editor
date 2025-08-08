import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyPanel } from '../../../common/ui/panel.ts';
import { LegacyTextField } from '../../../common/ui/text-field.ts';
import { handleCallback } from '../../../common/utils.ts';

editor.once('load', () => {
    const boxBranch = new VersionControlSidePanelBox();

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

    editor.method('picker:versioncontrol:widget:deleteBranch', () => {
        return panel;
    });
});
