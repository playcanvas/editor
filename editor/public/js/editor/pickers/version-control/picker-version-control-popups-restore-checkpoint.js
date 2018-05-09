editor.once('load', function () {
    'use strict';

    var popup = editor.call('picker:versioncontrol:createPopup', {
        title: 'RESTORE CHECKPOINT',
        confirmText: 'RESTORE CHECKPOINT'
    });

    var labelMessage = new ui.Label();
    labelMessage.renderChanges = false;
    labelMessage.class.add('message');
    popup.append(labelMessage);

    var labelNote = new ui.Label({
        text: 'By restoring this checkpoint you will lose all of your un-checkpointed progress.'
    });
    popup.append(labelNote);

    editor.method('picker:versioncontrol:restoreCheckpoint', function (checkpoint) {
        labelMessage.text = 'Revert to checkpoint "'  + checkpoint.id + '" ?';
        popup.show();

        var evtConfirm = popup.once('confirm', function () {
            // restore checkpoint 
            console.log('restore', checkpoint.id);
        });

        // clean up event (e.g. if popup is cancelled)
        popup.on('hide', function () {
            if (evtConfirm) {
                evtConfirm.unbind();
                evtConfirm = null;
            }
        });
    });
});