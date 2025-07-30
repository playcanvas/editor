import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { handleCallback } from '../../../common/utils.ts';

editor.once('load', () => {
    const boxFrom = new VersionControlSidePanelBox({
        headerNote: 'Merge from',
        createSourceCheckpoint: true,
        sourceCheckpointHelp: 'Tick to create a checkpoint in the source branch before merging.',
        closeSourceBranch: true,
        closeSourceBranchHelp: 'Tick to close the source branch after merging.'
    });

    const labelArrow = new LegacyLabel({
        text: '&#57704;',
        unsafe: true
    });
    labelArrow.class.add('arrow');

    const boxInto = new VersionControlSidePanelBox({
        headerNote: 'Merge to',
        createTargetCheckpoint: true,
        targetCheckpointHelp: 'Tick to create a checkpoint in the target branch before merging. If you leave this unticked any changes in the target branch will be discarded.'
    });

    // holds pending requests to get checkpoints
    const checkpointRequests = [];

    const panel = editor.call('picker:versioncontrol:createSidePanel', {
        title: 'Merge branches',
        note: 'Beginning the merge process will lock other active users\' sessions in the current branch.',
        mainContents: [boxFrom.panel, labelArrow, boxInto.panel],
        buttons: {
            cancel: {
                highlighted: true
            },
            confirm: {
                text: 'START MERGE'
            }
        }
    });
    panel.createTargetCheckpoint = true;
    panel.createSourceCheckpoint = false;
    panel.class.add('merge-branches');

    boxFrom.on('createSourceCheckpoint', (value) => {
        panel.createSourceCheckpoint = value;
    });

    boxFrom.on('closeSourceBranch', (value) => {
        panel.closeSourceBranch = value;
    });

    boxInto.on('createTargetCheckpoint', (value) => {
        panel.createTargetCheckpoint = value;
    });

    panel.on('hide', () => {
        panel.setSourceBranch(null);
        panel.setDestinationBranch(null);

        boxFrom.clear();
        boxInto.clear();

        // abort all pending requests
        checkpointRequests.forEach((request) => {
            request.abort();
        });
        checkpointRequests.length = 0;
    });

    const setBranchInfo = function (branch, isSourceBranch) {
        const panelField = isSourceBranch ? 'sourceBranch' : 'destinationBranch';
        panel[panelField] = branch;

        if (!branch) return;

        const box = isSourceBranch ? boxFrom : boxInto;
        box.header = branch.name;

        if (isSourceBranch && box.panelSourceClose) {
            // do not show close branch if branch is permanent (like master)
            box.panelSourceClose.hidden = branch.permanent;
        }

        // get checkpoint from server
        var request = handleCallback(editor.api.globals.rest.checkpoints.checkpointGet({
            checkpointId: branch.latestCheckpointId
        }), (err, checkpoint) => {
            // remove request from pending array
            const idx = checkpointRequests.indexOf(request);
            checkpointRequests.splice(idx, 1);

            box.setCheckpoint(checkpoint);
        });

        // add the request to the pending array
        checkpointRequests.push(request);
    };

    panel.setSourceBranch = function (sourceBranch) {
        setBranchInfo(sourceBranch, true);
    };
    panel.setDestinationBranch = function (destinationBranch) {
        setBranchInfo(destinationBranch, false);
    };

    editor.method('picker:versioncontrol:widget:mergeBranches', () => {
        return panel;
    });
});
