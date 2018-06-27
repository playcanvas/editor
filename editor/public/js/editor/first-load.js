(function() {
    // first load
    document.addEventListener('DOMContentLoaded', function() {
        editor.call('status:text', 'loading');
        editor.emit('load');
        editor.call('status:text', 'starting');
        editor.emit('start');

        editor.call('status:text', 'ready');

        // if there is a merge in progress for our branch
        var merge = config.self.branch.merge;
        if (merge) {
            // if this user started it then show the conflict manager
            // otherwise if another user started then show the merge in progress overlay
            if (merge.userId === config.self.id && merge.hasConflicts) {
                editor.call('picker:conflictManager');
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
