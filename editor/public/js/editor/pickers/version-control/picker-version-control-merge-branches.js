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
    labelFrom.class.add('right');
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
    labelInto.class.add('right');
    labelInto.renderChanges = false;
    panelInto.append(labelInto);

    var panel = editor.call('picker:versioncontrol:createWidget', {
        title: 'Merge branches',
        note: 'Beginning the merge process will lock other active users\' sessions in the current branch. Make sure to notify them.',
        mainContents: [panelFrom, panelInto],
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

    panel.on('hide', function () {
        panel.setSourceBranch(null);
        panel.setTargetBranch(null);
    });

    panel.setSourceBranch = function (sourceBranch) {
        panel.sourceBranch = sourceBranch;
        labelFrom.text = sourceBranch ? sourceBranch.name : '';
    }
    panel.setTargetBranch = function (targetBranch) {
        panel.targetBranch = targetBranch;
        labelInto.text = targetBranch ? targetBranch.name : '';
    };

    editor.method('picker:versioncontrol:widget:mergeBranches', function () {
        return panel;  
    });
});