(function () {
    // first load
    document.addEventListener('DOMContentLoaded', function () {
        editor.emit('load');
        editor.call('status:text', 'starting');
        editor.emit('start');

        editor.call('status:text', 'ready');

        // if there is a merge in progress for our branch
        var merge = config.self.branch.merge;
        if (merge) {
            // if this user started it then show the conflict manager
            // otherwise if another user started then show the merge in progress overlay
            if (merge.user.id === config.self.id) {
                switch (merge.mergeProgressStatus) {
                    case MERGE_STATUS_AUTO_STARTED:
                    case MERGE_STATUS_APPLY_STARTED:
                        editor.call('picker:conflictManager');
                        break;
                    case MERGE_STATUS_READY_FOR_REVIEW:
                        editor.call('picker:diffManager');
                        break;
                    default:
                        if (merge.hasConflicts) {
                            editor.call('picker:conflictManager');
                        } else {
                            editor.call('picker:diffManager');
                        }
                        break;
                }
            } else {
                editor.call('picker:versioncontrol:mergeOverlay');
            }
        } else {
            // open picker if no scene is loaded
            if (!config.scene.id) {
                editor.call('picker:scene');
            }
        }
    }, false);
})();
