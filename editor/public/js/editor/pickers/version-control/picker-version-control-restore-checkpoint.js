editor.once('load', function () {
    'use strict';

    var boxRestore = new ui.VersionControlSidePanelBox({
        header: 'RESTORING TO',
        discardChanges: true,
        discardChangesHelp: 'If you choose not to discard your changes then a checkpoint will be created first, before restoring.'
    });

    var panel = editor.call('picker:versioncontrol:createSidePanel', {
        mainContents: [boxRestore.panel],
        buttons: {
            cancel: {
                highlighted: true
            },
            confirm: {
                text: 'Restore Checkpoint'
            }
        }
    });
    panel.class.add('restore-checkpoint');

    editor.method('picker:versioncontrol:widget:restoreCheckpoint', function () {
        return panel;
    });

    panel.setCheckpoint = function (checkpoint) {
        panel.checkpoint = checkpoint;
        boxRestore.setCheckpoint(checkpoint);
        panel.labelTitle.text = 'Restore checkpoint "' + checkpoint.id.substring(0, 7) + '" ?';
    };

    boxRestore.on('discardChanges', function (value) {
        panel.discardChanges = value;
    });

    panel.on('hide', function () {
        boxRestore.clear();
    });
});
