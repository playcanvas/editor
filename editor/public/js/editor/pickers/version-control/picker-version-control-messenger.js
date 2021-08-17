editor.once('load', function () {
    'use strict';

    var currentCheckpointBeingCreated = null;

    var overlayBranchSwitched = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Refreshing browser window...',
        icon: editor.call('picker:versioncontrol:svg:completed', 50)
    });

    var overlayCreatingCheckpoint = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Please wait while the checkpoint is being created.',
        icon: editor.call('picker:versioncontrol:svg:spinner', 50)
    });

    var overlayRestoringCheckpoint = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Please wait while the checkpoint is restored.',
        icon: editor.call('picker:versioncontrol:svg:spinner', 50)
    });

    var overlayCheckpointRestored = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Refreshing browser window...',
        icon: editor.call('picker:versioncontrol:svg:completed', 50)
    });

    var overlayHardResetInProgress = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Please wait while hard reset to checkpoint is in progress.',
        icon: editor.call('picker:versioncontrol:svg:completed', 50)
    });

    var overlayHardResetDone = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Refreshing browser window...',
        icon: editor.call('picker:versioncontrol:svg:completed', 50)
    });

    var overlayBranchClosed = editor.call('picker:versioncontrol:createOverlay', {
        title: 'This branch has been closed.',
        message: 'Switching to master branch...',
        icon: editor.call('picker:versioncontrol:svg:spinner', 50)
    });

    var overlayMergeStopped = editor.call('picker:versioncontrol:createOverlay', {
        message: 'Refreshing browser...',
        icon: editor.call('picker:versioncontrol:svg:error', 50)
    });

    var overlayMergeCompleted = editor.call('picker:versioncontrol:createOverlay', {
        title: 'Merge completed.',
        message: 'Refreshing browser...',
        icon: editor.call('picker:versioncontrol:svg:completed', 50)
    });

    var overlayDeletingBranch = editor.call('picker:versioncontrol:createOverlay', {
        title: 'Deleting branch',
        message: 'Please wait while this branch is being deleted.',
        icon: editor.call('picker:versioncontrol:svg:spinner', 50)
    });

    var overlayDeletedBranch = editor.call('picker:versioncontrol:createOverlay', {
        title: 'This branch has been deleted.',
        message: 'Refreshing browser window...',
        icon: editor.call('picker:versioncontrol:svg:completed', 50)
    });

    // don't let the user's full name be too big
    var truncateFullName = function (fullName) {
        return fullName.length > 36 ? fullName.substring(0, 33) + '...' : fullName;
    };

    // If we are currently in a scene this will first request the
    // scene from the server. If the scene no longer exists then we will
    // refresh to the Project URL. If the scene exists then just refresh the browser window
    var refresh = function () {
        setTimeout(function () {
            if (config.scene && config.scene.id) {
                editor.call('scenes:get', config.scene.id, function (err, data) {
                    if (err || ! data) {
                        window.location = '/editor/project/' + config.project.id + window.location.search;
                    } else {
                        window.location.reload();
                    }
                });
            } else {
                window.location.reload();
            }
        }, 1000);
    };

    // show overlay when branch ended
    editor.on('messenger:branch.createEnded', function (data) {
        if (data.status === 'error' || data.user_id !== config.self.id) {
            return;
        }

        // if this is us then we need to refresh the browser
        config.self.branch.id = data.branch_id;
        overlayBranchSwitched.setTitle('Switched to branch "' + data.name + '"');
        overlayBranchSwitched.hidden = false;
        refresh();
    });

    // show overlay when the branch of this user has been changed
    editor.on('messenger:branch.switch', function (data) {
        if (data.project_id !== config.project.id) {
            return;
        }

        config.self.branch.id = data.branch_id;
        overlayBranchSwitched.setTitle('Switched to branch "' + data.name + '"');
        overlayBranchSwitched.hidden = false;
        refresh();
    });

    // Show overlay when checkpoint started being created
    editor.on('messenger:checkpoint.createStarted', function (data) {
        if (data.branch_id !== config.self.branch.id) return;

        currentCheckpointBeingCreated = data.checkpoint_id;
        overlayCreatingCheckpoint.setTitle(truncateFullName(data.user_full_name) + ' is creating a checkpoint.');
        overlayCreatingCheckpoint.hidden = false;
    });

    // If the checkpoint that was being created finished and we were showing an
    // overlay for it then hide that overlay
    editor.on('messenger:checkpoint.createEnded', function (data) {
        if (data.checkpoint_id !== currentCheckpointBeingCreated) return;
        currentCheckpointBeingCreated = null;
        overlayCreatingCheckpoint.hidden = true;

        // update latest checkpoint in branch
        if (data.status !== 'error' && data.branch_id === config.self.branch.id) {
            config.self.branch.latestCheckpointId = data.checkpoint_id;
        }
    });

    // show overlay when checkpoint starts being restored
    editor.on('messenger:checkpoint.revertStarted', function (data) {
        if (data.branch_id !== config.self.branch.id) return;
        overlayRestoringCheckpoint.setTitle(truncateFullName(data.user_full_name) + ' is restoring checkpoint ' + data.checkpoint_id.substring(0, 7));
        overlayRestoringCheckpoint.hidden = false;
    });

    // show overlay when checkpoint was restored
    editor.on('messenger:checkpoint.revertEnded', function (data) {
        if (data.branch_id !== config.self.branch.id) return;
        if (data.status === 'success') {
            overlayRestoringCheckpoint.hidden = true;
            overlayCheckpointRestored.setTitle(truncateFullName(data.user_full_name) + ' restored checkpoint ' + data.checkpoint_id.substring(0, 7));
            overlayCheckpointRestored.hidden = false;
            refresh();
        } else {
            // hide the overlay
            overlayRestoringCheckpoint.hidden = true;
        }
    });

    // show overlay when branch is deleting
    editor.on('messenger:branch.deleteStarted', function (data) {
        if (data.branch_id !== config.self.branch.id) return;
        overlayDeletingBranch.setTitle(truncateFullName(data.user_full_name) + ' is deleting this branch');
        overlayDeletingBranch.hidden = false;
    });

    // show overlay when branch finished deleting
    editor.on('messenger:branch.deleteEnded', function (data) {
        if (data.branch_id !== config.self.branch.id) return;
        if (data.status === 'success') {
            overlayDeletingBranch.hidden = true;
            overlayDeletedBranch.setTitle(truncateFullName(data.user_full_name) + ' deleted this branch');
            overlayDeletedBranch.hidden = false;
            refresh();
        } else {
            overlayDeletingBranch.hidden = true;
        }
    });

    // show overlay when hard reset starts
    editor.on('messenger:checkpoint.hardResetStarted', function (data) {
        if (data.branch_id !== config.self.branch.id) return;
        overlayHardResetInProgress.setTitle(truncateFullName(data.user_full_name) + ' is hard resetting to checkpoint ' + data.checkpoint_id.substring(0, 7));
        overlayHardResetInProgress.hidden = false;
    });

    // show overlay when hard reset finishes
    editor.on('messenger:checkpoint.hardResetEnded', function (data) {
        if (data.branch_id !== config.self.branch.id) return;
        if (data.status === 'success') {
            overlayHardResetInProgress.hidden = true;
            overlayHardResetDone.setTitle(truncateFullName(data.user_full_name) + ' performed hard reset to checkpoint ' + data.checkpoint_id.substring(0, 7));
            overlayHardResetDone.hidden = false;
            refresh();
        } else {
            // hide the overlay
            overlayHardResetInProgress.hidden = true;
        }
    });

    // show overlay if our current branch was closed
    editor.on('messenger:branch.close', function (data) {
        if (data.branch_id !== config.self.branch.id) return;

        overlayDeletingBranch.hidden = true;
        overlayBranchClosed.hidden = false;

        // check out master branch and then refresh the browser
        Ajax({
            url: '/api/branches/{{project.masterBranch}}/checkout',
            method: 'POST',
            auth: true
        })
        .on('load', refresh)
        .on('error', refresh);
    });

    // if a merge has started for our branch then show overlay
    editor.on('messenger:merge.new', function (data) {
        if (data.dst_branch_id !== config.self.branch.id) return;

        config.self.branch.merge = {
            id: data.merge_id,
            user: {
                id: data.user_id,
                fullName: data.user_full_name
            }
        };

        editor.call('picker:versioncontrol:mergeOverlay');
    });

    // store current merge progress
    editor.on('messenger:merge.setProgress', function (data) {
        if (data.dst_branch_id !== config.self.branch.id) return;

        if (config.self.branch.merge) {
            config.self.branch.merge.mergeProgressStatus = data.status;
        }

        // if merge finished
        if (data.status === MERGE_STATUS_APPLY_ENDED) {
            if (editor.call('picker:isOpen', 'conflict-manager')) return;

            // hide merge overlay and refresh
            editor.call('picker:versioncontrol:mergeOverlay:hide');
            overlayMergeCompleted.hidden = false;
            refresh();
        }
    });

    // show overlay if the current merge has been force stopped
    editor.on('messenger:merge.delete', function (data) {
        if (! config.self.branch.merge) return;
        if (config.self.branch.merge.id !== data.merge_id) return;

        editor.call('picker:versioncontrol:mergeOverlay:hide');

        var name = data.user.length > 33 ? data.user.substring(0, 30) + '...' : data.user;
        overlayMergeStopped.setTitle('Merge force stopped by ' + name);
        overlayMergeStopped.hidden = false;
        setTimeout(refresh, 1000); // delay this a bit more
    });

    // if we stopped the merge but the conflict manager is open then show the overlay behind the conflict manager
    overlayMergeStopped.on('show', function () {
        if (editor.call('picker:isOpen', 'conflict-manager')) {
            overlayMergeStopped.class.add('show-behind-picker');
        } else {
            overlayMergeStopped.class.remove('show-behind-picker');
        }
    });

    // check if our current branch is different than the one we have currently loaded
    // this can happen say if the branch is switch while the window is being refreshed
    function checkValidBranch() {
        if (!editor.call('permissions:read')) return;

        editor.call('branches:getCurrentBranch', function (status, data) {
            if (data && data.id !== config.self.branch.id) {
                console.log('Branch switched while refreshing. Reloading page...');
                refresh();
            }
        });
    }

    editor.on('messenger:connected', checkValidBranch);

    if (editor.call('messenger:isConnected')) {
        checkValidBranch();
    }
});
