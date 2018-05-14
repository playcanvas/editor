editor.once('load', function () {
    'use strict';

    var panel = editor.call('picker:versioncontrol:createWidget', {
        note: 'By restoring you will lose all of your un-checkpointed progress.',
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
        panel.labelTitle.text = 'Restore current branch to checkpoint ' + '"' + checkpoint.id + '" ?';
    };
});