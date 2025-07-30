import { VersionControlSidePanelBox } from './ui/version-control-side-panel-box.ts';

editor.once('load', () => {
    const boxRestore = new VersionControlSidePanelBox({
        header: 'RESTORING TO',
        createTargetCheckpoint: true,
        targetCheckpointHelp: 'Tick to create a checkpoint before restoring this branch. If you leave this unticked any changes will be discarded.'
    });

    const panel = editor.call('picker:versioncontrol:createSidePanel', {
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

    editor.method('picker:versioncontrol:widget:restoreCheckpoint', () => {
        return panel;
    });

    panel.setCheckpoint = function (checkpoint) {
        panel.checkpoint = checkpoint;
        boxRestore.setCheckpoint(checkpoint);
        panel.labelTitle.text = `Restore checkpoint "${checkpoint.id.substring(0, 7)}" ?`;
    };

    boxRestore.on('createTargetCheckpoint', (value) => {
        panel.createTargetCheckpoint = value;
    });

    panel.on('hide', () => {
        boxRestore.clear();
    });
});
