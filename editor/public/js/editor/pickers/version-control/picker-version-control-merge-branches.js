editor.once('load', function () {
    'use strict';

    var boxFrom = new ui.VersionControlSidePanelBox({
        headerNote: 'Merge from'
    });

    var labelArrow = new ui.Label({
        text: '&#57704;',
        unsafe: true
    });
    labelArrow.class.add('arrow');

    var boxInto = new ui.VersionControlSidePanelBox({
        headerNote: 'Merge to',
        discardChanges: true,
        discardChangesHelp: 'If you choose not to discard your changes then a new checkpoint will be created before merging.'
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
    panel.class.add('merge-branches');

    boxInto.on('discardChanges', function (value) {
        panel.discardChanges = value;
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
