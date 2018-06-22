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

    var overlayBranchClosed = editor.call('picker:versioncontrol:createOverlay', {
        title: 'This branch has been closed.',
        message: 'Switching to master branch...',
        icon: editor.call('picker:versioncontrol:svg:spinner', 50)
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

    // show overlay if our current branch was closed
    editor.on('messenger:branch.close', function (data) {
        if (data.branch_id !== config.self.branch.id) return;

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
});
