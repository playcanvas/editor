editor.once('load', function () {
    'use strict';

    var boxFrom = new ui.VersionControlSidePanelBox({
        headerNote: 'Merge from',
        createSourceCheckpoint: true,
        sourceCheckpointHelp: 'Tick to create a checkpoint in the source branch before merging.'
    });

    var labelArrow = new ui.Label({
        text: '&#57704;',
        unsafe: true
    });
    labelArrow.class.add('arrow');

    var boxInto = new ui.VersionControlSidePanelBox({
        headerNote: 'Merge to',
        createTargetCheckpoint: true,
        targetCheckpointHelp: 'Tick to create a checkpoint in the target branch before merging. If you leave this unticked any changes in the target branch will be discarded.'
    });

    // holds pending requests to get checkpoints
    var checkpointRequests = [];

    var panel = editor.call('picker:versioncontrol:createSidePanel', {
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

    boxFrom.on('createSourceCheckpoint', function (value) {
        panel.createSourceCheckpoint = value;
    });

    boxInto.on('createTargetCheckpoint', function (value) {
        panel.createTargetCheckpoint = value;
    });

    panel.on('hide', function () {
        panel.setSourceBranch(null);
        panel.setDestinationBranch(null);

        boxFrom.clear();
        boxInto.clear();

        // abort all pending requests
        checkpointRequests.forEach(function (request) {
            request.abort();
        });
        checkpointRequests.length = 0;
    });

    var setBranchInfo = function (branch, isSourceBranch) {
        var panelField = isSourceBranch ? 'sourceBranch' : 'destinationBranch';
        panel[panelField] = branch;

        if (! branch) return;

        var box = isSourceBranch ? boxFrom : boxInto;
        box.header = branch.name;

        // get checkpoint from server
        var request = editor.call('checkpoints:get', branch.latestCheckpointId, function (err, checkpoint) {
            // remove request from pending array
            var idx = checkpointRequests.indexOf(request);
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

    editor.method('picker:versioncontrol:widget:mergeBranches', function () {
        return panel;
    });
});
