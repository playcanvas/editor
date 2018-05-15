editor.once('load', function () {
    'use strict';

    if (!editor.call('users:hasFlag', 'hasCheckpoints')) {
        return;
    }

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-version-control');
    editor.call('picker:project:registerMenu', 'version control', 'Version Control', panel);
    panel.flex = true;

    // branches container panel
    var panelBranchesContainer = new ui.Panel();
    panelBranchesContainer.class.add('branches-container');
    panel.append(panelBranchesContainer);
    panelBranchesContainer.flex = true;

    // branches top
    var panelBranchesTop = new ui.Panel();
    panelBranchesTop.class.add('branches-top');
    panelBranchesTop.flex = true;
    panelBranchesContainer.append(panelBranchesTop);

    // branches filter
    var panelBranchesFilter = new ui.Panel();
    panelBranchesFilter.class.add('branches-filter');
    panelBranchesFilter.flex = true;
    panelBranchesContainer.append(panelBranchesFilter);

    // filter
    var fieldBranchesFilter = new ui.SelectField({
        options: [{
            v: 'active', t: 'Active Branches'
        }, {
            v: 'archived', t: 'Archived Branches'
        }]
    });
    fieldBranchesFilter.value = 'active';
    fieldBranchesFilter.flexGrow = 1;
    panelBranchesFilter.append(fieldBranchesFilter);

    // branches main panel
    var panelBranches = new ui.Panel();
    panelBranches.class.add('branches');
    panelBranches.flexGrow = 1;
    panelBranchesContainer.append(panelBranches);

    // branches list
    var listBranches = new ui.List();
    panelBranches.append(listBranches);

    // right side container panel
    var panelRight = new ui.Panel();
    panelRight.class.add('side-panel');
    panelRight.flex = true;
    panelRight.flexGrow = 1;
    panel.append(panelRight);

    // checkpoints panel
    var panelCheckpointsContainer = editor.call('picker:versioncontrol:widget:checkpoints');
    panelRight.append(panelCheckpointsContainer);

    // new checkpoint panel
    var panelCreateCheckpoint = editor.call('picker:versioncontrol:widget:createCheckpoint');
    panelCreateCheckpoint.hidden = true;
    panelRight.append(panelCreateCheckpoint);

    // create checkpoint progress
    var panelCreateCheckpointProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Creating checkpoint',
        finishText: 'Checkpoint created - refreshing the browser',
        errorText: 'Failed to create new checkpoint'
    });
    panelCreateCheckpointProgress.hidden = true;
    panelRight.append(panelCreateCheckpointProgress);

    // new branch panel
    var panelCreateBranch = editor.call('picker:versioncontrol:widget:createBranch');
    panelCreateBranch.hidden = true;
    panelRight.append(panelCreateBranch);

    // create branch progress
    var panelCreateBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Creating branch',
        finishText: 'Branch created - refreshing the browser',
        errorText: 'Failed to create new branch'
    });
    panelCreateBranchProgress.hidden = true;
    panelRight.append(panelCreateBranchProgress);

    // archive branch panel
    var panelArchiveBranch = editor.call('picker:versioncontrol:widget:archiveBranch');
    panelArchiveBranch.hidden = true;
    panelRight.append(panelArchiveBranch);

    // merge branches panel
    var panelMergeBranches = editor.call('picker:versioncontrol:widget:mergeBranches');
    panelMergeBranches.hidden = true;
    panelRight.append(panelMergeBranches);

    // restore checkpoint panel
    var panelRestoreCheckpoint = editor.call('picker:versioncontrol:widget:restoreCheckpoint');
    panelRestoreCheckpoint.hidden = true;
    panelRight.append(panelRestoreCheckpoint);

    // restore branch progress
    var panelRestoreCheckpointProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Restoring checkpoint',
        finishText: 'Checkpoint restored - refreshing the browser',
        errorText: 'Failed to restore checkpoint'
    });
    panelRestoreCheckpointProgress.hidden = true;
    panelRight.append(panelRestoreCheckpointProgress);

    // switch branch progress
    var panelSwitchBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Switching branch',
        finishText: 'Switched branch - refreshing the browser',
        errorText: 'Failed to switch branch'
    });
    panelSwitchBranchProgress.hidden = true;
    panelRight.append(panelSwitchBranchProgress);

    // contains all possible panels that go to the right
    var allRightPanels = [
        panelCheckpointsContainer,
        panelCreateCheckpoint,
        panelCreateCheckpointProgress,
        panelRestoreCheckpoint,
        panelRestoreCheckpointProgress,
        panelCreateBranch,
        panelCreateBranchProgress,
        panelArchiveBranch,
        panelMergeBranches,
        panelSwitchBranchProgress
    ];

    // new branch button
    var btnNewBranch = new ui.Button({
        text: 'NEW BRANCH'
    });
    btnNewBranch.flexGrow = 1;
    btnNewBranch.class.add('icon', 'create');
    panelBranchesTop.append(btnNewBranch);

    // branch for which context menu is open
    var contextBranch = null;
    // current branch (TODO)
    var currentBranch = {
        id: 1,
        name: 'master',
        created: new Date()
    };

    // branches context menu
    var menuBranches = new ui.Menu();

    // checkout branch
    var menuBranchesSwitchTo = new ui.MenuItem({
        text: 'Switch To',
        value: 'switch-branch'
    });
    menuBranches.append(menuBranchesSwitchTo);

    // merge branch
    var menuBranchesMerge = new ui.MenuItem({
        text: 'Merge',
        value: 'merge-branch'
    });
    menuBranches.append(menuBranchesMerge);

    // archive branch
    var menuBranchesArchive = new ui.MenuItem({
        text: 'Archive',
        value: 'archive-branch'
    });
    menuBranches.append(menuBranchesArchive);

    editor.call('layout.root').append(menuBranches);

    var branchesSkip = 0;
    var checkpointsSkip = 0;

    var createBranchListItem = function (branch) {
        var item = new ui.ListItem();
        item.element.id = 'branch-' + branch.id;

        var panel = new ui.Panel();
        item.element.appendChild(panel.element);

        var labelIcon = new ui.Label({
            text: '&#58208;'
        });
        labelIcon.class.add('icon');
        panel.append(labelIcon);

        var labelName = new ui.Label({
            text: branch.name
        });
        labelName.class.add('name');
        panel.append(labelName);

        var labelDate = new ui.Label({
            text: 'Updated ' + editor.call('datetime:convert', branch.modified)
        });
        labelDate.class.add('date');
        panel.append(labelDate);

        // dropdown
        var dropdown = new ui.Button({
            text: '&#57689;'
        });
        dropdown.class.add('dropdown');
        panel.append(dropdown);

        dropdown.on('click', function (e) {
            e.stopPropagation();

            if (panelBranches.disabled) return;

            dropdown.class.add('clicked');
            dropdown.element.innerHTML = '&#57687;';

            contextBranch = branch;
            menuBranches.open = true;
            var rect = dropdown.element.getBoundingClientRect();
            menuBranches.position(rect.right - menuBranches.innerElement.clientWidth, rect.bottom);
        });

        listBranches.append(item);

        // select branch
        item.on('click', function () {
            selectBranch(branch);
        });
    };

    var selectBranch = function (branch) {
        showCheckpoints();

        var item = document.getElementById('branch-' + branch.id);
        if (! item || ! item.ui) return;
        listBranches.selected = [item.ui];

        panelCheckpointsContainer.setBranch(branch);

        editor.call('checkpoints:list', {
            branch: branch.id,
            limit: 20
        }, function (err, data) {
            if (err) {
                return console.error(err);
            }

            panelCheckpointsContainer.setCheckpoints(data);
        });
    };

    var showCheckpoints = function () {
        showRightSidePanel(panelCheckpointsContainer);
    };

    var showRightSidePanel = function (panel) {
        allRightPanels.forEach(function (p) {
            p.hidden = p !== panel;
        });
    };

    // show create branch panel
    btnNewBranch.on('click', function () {
        showRightSidePanel(panelCreateBranch);
        // TODO: panelCreateBranch.setCheckpoint( latestCheckpointInCurrentBranch )
    });


    // archive branch
    menuBranchesArchive.on('select', function () {
        if (contextBranch) {
            showRightSidePanel(panelArchiveBranch);
            panelArchiveBranch.setBranch(contextBranch);
        }
    });

    // merge branch
    menuBranchesMerge.on('select', function () {
        if (contextBranch) {
            showRightSidePanel(panelMergeBranches);
            panelMergeBranches.setBranches(contextBranch, currentBranch);
        }
    });

    // switch to branch
    menuBranchesSwitchTo.on('select', function () {
        if (contextBranch) {
            // TODO switch branch
            showRightSidePanel(panelSwitchBranchProgress);
            setTimeout(function() {
                panelSwitchBranchProgress.finish();
                setTimeout(function () {
                    document.location.reload();
                }, 1000);
            }, 1000);
        }
    });

    panelCheckpointsContainer.on('checkpoint:new', function () {
        showRightSidePanel(panelCreateCheckpoint);
    });

    panelCheckpointsContainer.on('checkpoint:restore', function (checkpoint) {
        showRightSidePanel(panelRestoreCheckpoint);
        panelRestoreCheckpoint.setCheckpoint(checkpoint);
    });

    panelCheckpointsContainer.on('checkpoint:branch', function (checkpoint) {
        showRightSidePanel(panelCreateBranch);
        panelCreateBranch.setCheckpoint(checkpoint);
    })

    // Create checkpoint
    panelCreateCheckpoint.on('cancel', showCheckpoints);
    panelCreateCheckpoint.on('confirm', function (data) {
        togglePanels(false);
        showRightSidePanel(panelCreateCheckpointProgress);

        editor.call('checkpoints:create', data.description, function (err) {
            panelCreateCheckpointProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                refreshBrowser();
            }
        });
    });

    // Create branch
    panelCreateBranch.on('cancel', showCheckpoints);
    panelCreateBranch.on('confirm', function (data) {
        togglePanels(false);

        showRightSidePanel(panelCreateBranchProgress);

        editor.call('branches:create', data.name, function (err, branch) {
            panelCreateBranchProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                refreshBrowser();
            }
        });
    });

    // Archive branch
    panelArchiveBranch.on('cancel', showCheckpoints);
    panelArchiveBranch.on('confirm', function (data) {
        // TODO Archive branch
    });

    // Merge branches
    panelMergeBranches.on('cancel', showCheckpoints);
    panelMergeBranches.on('confirm', function () {
        // TODO Merge branches
    });

    // Restore checkpoints
    panelRestoreCheckpoint.on('cancel', showCheckpoints);
    panelRestoreCheckpoint.on('confirm', function () {
        togglePanels(false);
        showRightSidePanel(panelRestoreCheckpointProgress);

        editor.call('checkpoints:restore', panelRestoreCheckpoint.checkpoint.id, function (err, data) {
            panelRestoreCheckpointProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                refreshBrowser();
            }
        });
    });

    // when the branches context menu is closed 'unclick' dropdowns
    menuBranches.on('open', function (open) {
        if (open || ! contextBranch) return;
        var item = document.getElementById('branch-' + contextBranch.id);
        contextBranch = null;
        if (! item) return;

        var dropdown = item.querySelector('.clicked');
        if (! dropdown) return;

        dropdown.classList.remove('clicked');
        dropdown.innerHTML = '&#57689;';
    });

    // Enable or disable the clickable parts of this picker
    var togglePanels = function (enabled) {
        editor.call('picker:project:setClosable', enabled);
        editor.call('picker:project:toggleLeftPanel', enabled);
        panelBranchesTop.disabled = !enabled;
        panelBranches.disabled = !enabled;
        panelBranchesFilter.disabled = !enabled;
    };

    var refreshBrowser = function () {
        // do this in a timeout to give some time to the user
        // to read any information messages
        setTimeout(function () {
            document.location.reload();
        }, 1000);
    };

    var reloadBranches = function () {
        listBranches.clear();

        editor.call('branches:list', {
            limit: 20,
            skip: branchesSkip,
            archived: fieldBranchesFilter.value === 'archived'
        }, function (err, data) {
            if (err) {
                return console.error(err);
            }

            if (! data.result[0]) return;

            data.result.forEach(createBranchListItem);
            selectBranch(data.result[0]);
        });
    };

    fieldBranchesFilter.on('change', reloadBranches);

    // on show
    panel.on('show', function () {
        showCheckpoints();

        // load and create branches
        reloadBranches();

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', function(state) {
        if (state && ! panel.hidden) {
            setTimeout(function() {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

});
