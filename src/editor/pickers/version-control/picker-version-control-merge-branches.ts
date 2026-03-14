import { Label } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';

import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box';

editor.once('load', () => {
    const boxFrom = new VersionControlSidePanelBox({
        headerNote: 'Merge from',
        createSourceCheckpoint: true,
        sourceCheckpointHelp: 'Tick to create a checkpoint in the source branch before merging.',
        closeSourceBranch: true,
        closeSourceBranchHelp: 'Tick to close the source branch after merging.'
    });

    const labelArrow = new Label({
        text: '\uE168',
        class: 'arrow'
    });

    const boxInto = new VersionControlSidePanelBox({
        headerNote: 'Merge to',
        createTargetCheckpoint: true,
        targetCheckpointHelp: 'Tick to create a checkpoint in the target branch before merging. If you leave this unticked any changes in the target branch will be discarded.'
    });

    const checkpointRequests: { abort: () => void }[] = [];

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

        checkpointRequests.forEach((request) => {
            request.abort();
        });
        checkpointRequests.length = 0;
    });

    const setBranchInfo = (branch: Record<string, unknown> | null, isSourceBranch: boolean) => {
        const panelField = isSourceBranch ? 'sourceBranch' : 'destinationBranch';
        panel[panelField] = branch;

        if (!branch) {
            return;
        }

        const box = isSourceBranch ? boxFrom : boxInto;
        box.header = branch.name;

        if (isSourceBranch && box.panelSourceClose) {
            box.panelSourceClose.hidden = branch.permanent;
        }

        const request = handleCallback(editor.api.globals.rest.checkpoints.checkpointGet({
            checkpointId: branch.latestCheckpointId
        }), (err, checkpoint) => {
            const idx = checkpointRequests.indexOf(request);
            checkpointRequests.splice(idx, 1);

            box.setCheckpoint(checkpoint);
        });

        checkpointRequests.push(request);
    };

    panel.setSourceBranch = (sourceBranch: Record<string, unknown> | null) => {
        setBranchInfo(sourceBranch, true);
    };
    panel.setDestinationBranch = (destinationBranch: Record<string, unknown> | null) => {
        setBranchInfo(destinationBranch, false);
    };

    editor.method('picker:versioncontrol:widget:mergeBranches', () => {
        return panel;
    });
});
