editor.once('load', function () {
    'use strict';

    var panelFrom = new ui.Panel(' ');
    panelFrom.flexGrow = 1;
    panelFrom.class.add('branch');

    var labelHeader = new ui.Label({
        text: 'Merge from'
    });
    labelHeader.class.add('header-note');
    panelFrom.headerElement.appendChild(labelHeader.element);

    var labelArrow = new ui.Label({
        text: '&#57704;',
        unsafe: true
    });
    labelArrow.class.add('arrow');

    var panelInto = new ui.Panel(' ');
    panelInto.flexGrow = 1;
    panelInto.class.add('branch');

    labelHeader = new ui.Label({
        text: 'Merge to'
    });
    labelHeader.class.add('header-note');
    panelInto.headerElement.appendChild(labelHeader.element);

    var panelDiscard = new ui.Panel();
    panelDiscard.class.add('discard');
    panelDiscard.flexGrow = 1;
    var label = new ui.Label({
        text: 'Discard un-checkpointed changes?'
    });
    panelDiscard.append(label);

    var checkboxDiscardChanges = new ui.Checkbox();
    checkboxDiscardChanges.class.add('tick');
    panelDiscard.append(checkboxDiscardChanges);

    var labelDiscardHelp = new ui.Label({
        text: '&#57656;',
        unsafe: true
    });
    labelDiscardHelp.class.add('help');
    panelDiscard.append(labelDiscardHelp);

    var checkpointRequests = [];

    var panel = editor.call('picker:versioncontrol:createWidget', {
        title: 'Merge branches',
        note: 'Beginning the merge process will lock other active users\' sessions in the current branch.',
        mainContents: [panelFrom, labelArrow, panelInto],
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

    var tooltip = Tooltip.attach({
        target: labelDiscardHelp.element,
        text: 'If you choose not to discard your changes then a new checkpoint will be created before merging.',
        align: 'top',
        root: editor.call('layout.root')
    });
    tooltip.class.add('discard-merge-tooltip');

    checkboxDiscardChanges.on('change', function (value) {
        panel.discardChanges = value;
    });

    panel.on('hide', function () {
        checkboxDiscardChanges.value = false;
        panel.setSourceBranch(null);
        panel.setDestinationBranch(null);

        var checkpointPanel = panelFrom.innerElement.querySelector('.checkpoint-widget');
        if (checkpointPanel) {
            checkpointPanel.ui.destroy();
        }

        checkpointPanel = panelInto.innerElement.querySelector('.checkpoint-widget');
        if (checkpointPanel) {
            checkpointPanel.ui.destroy();
        }

        panelInto.remove(panelDiscard);

        checkpointRequests.forEach(function (request) {
            request.abort();
        });
        checkpointRequests.length = 0;
    });

    var setBranchInfo = function (branch, isSourceBranch) {
        var panelField = isSourceBranch ? 'sourceBranch' : 'destinationBranch';
        panel[panelField] = branch;

        if (! branch) return;

        var branchPanel = isSourceBranch ? panelFrom : panelInto;
        branchPanel.header = branch.name;

        var request = editor.call('checkpoints:get', branch.latestCheckpointId, function (err, checkpoint) {
            var idx = checkpointRequests.indexOf(request);
            checkpointRequests.splice(idx, 1);

            var panel = editor.call('picker:versioncontrol:widget:checkpoint', checkpoint);
            branchPanel.append(panel);
            panel.onAddedToDom();

            if (! isSourceBranch) {
                panelInto.append(panelDiscard);
            }
        });
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
