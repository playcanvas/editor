editor.once('load', function () {
    'use strict';

    var panelFrom = new ui.Panel();
    panelFrom.flexGrow = 1;
    var label = new ui.Label({
        text: 'Merging From'
    });
    label.class.add('left');
    panelFrom.append(label);

    var labelFrom = new ui.Label();
    labelFrom.class.add('right', 'selectable');
    labelFrom.renderChanges = false;
    panelFrom.append(labelFrom);

    var panelInto = new ui.Panel();
    panelInto.flexGrow = 1;
    label = new ui.Label({
        text: 'Merging Into'
    });
    label.class.add('left');
    panelInto.append(label);

    var labelInto = new ui.Label();
    labelInto.class.add('right', 'selectable');
    labelInto.renderChanges = false;
    panelInto.append(labelInto);

    var panelDiscard = new ui.Panel();
    panelDiscard.flexGrow = 1;
    label = new ui.Label({
        text: 'Discard changes since last checkpoint?'
    });
    label.class.add('left');
    panelDiscard.append(label);

    var checkboxDiscardChanges = new ui.Checkbox();
    checkboxDiscardChanges.class.add('tick');
    panelDiscard.append(checkboxDiscardChanges);


    var panel = editor.call('picker:versioncontrol:createWidget', {
        title: 'Merge branches',
        note: 'Beginning the merge process will lock other active users\' sessions in the current branch.',
        mainContents: [panelFrom, panelInto, panelDiscard],
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

    checkboxDiscardChanges.on('change', function (value) {
        panel.discardChanges = value;
    });

    panel.on('hide', function () {
        checkboxDiscardChanges.value = false;
        panel.setSourceBranch(null);
        panel.setDestinationBranch(null);
    });

    panel.setSourceBranch = function (sourceBranch) {
        panel.sourceBranch = sourceBranch;
        labelFrom.text = sourceBranch ? sourceBranch.name : '';
    };
    panel.setDestinationBranch = function (destinationBranch) {
        panel.destinationBranch = destinationBranch;
        labelInto.text = destinationBranch ? destinationBranch.name : '';
    };

    editor.method('picker:versioncontrol:widget:mergeBranches', function () {
        return panel;
    });
});
