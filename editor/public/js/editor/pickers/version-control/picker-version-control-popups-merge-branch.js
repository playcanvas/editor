editor.once('load', function () {
    'use strict';

    var popup = editor.call('picker:versioncontrol:createPopup', {
        title: 'MERGE BRANCH',
        confirmText: 'MERGE BRANCH'
    });

    var labelMessage = new ui.Label();
    labelMessage.renderChanges = false;
    labelMessage.class.add('message');
    popup.append(labelMessage);

    var labelNote = new ui.Label({
        text: 'Beginning the merge process will lock other active users\' sessions.'
    });
    labelNote.class.add('note');
    popup.append(labelNote);

    editor.method('picker:versioncontrol:mergeBranch', function (branch) {
        labelMessage.text = 'Merge branch "' + branch.name + '" into current branch';
        popup.show();

        var evtConfirm = popup.once('confirm', function () {
            // merge
            console.log('merge', branch.id);
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