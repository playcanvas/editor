editor.once('load', function () {
    var boxRestore = new ui.VersionControlSidePanelBox({
        header: 'RESTORING TO',
        createTargetCheckpoint: true,
        targetCheckpointHelp: 'Tick to create a checkpoint before restoring this branch. If you leave this unticked any changes will be discarded.'
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

    panel.createTargetCheckpoint = true;

    editor.method('picker:versioncontrol:widget:restoreCheckpoint', function () {
        return panel;
    });

    panel.setCheckpoint = function (checkpoint) {
        panel.checkpoint = checkpoint;
        boxRestore.setCheckpoint(checkpoint);
        panel.labelTitle.text = 'Restore checkpoint "' + checkpoint.id.substring(0, 7) + '" ?';
    };

    boxRestore.on('createTargetCheckpoint', function (value) {
        panel.createTargetCheckpoint = value;
    });

    panel.on('hide', function () {
        boxRestore.clear();
    });
});
