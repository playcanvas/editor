editor.once('load', function () {
    'use strict';

    if (!editor.call('users:hasFlag', 'hasCheckpoints') || config.project.settings.useLegacyScripts) {
        return;
    }

    var projectUserSettings = editor.call('settings:projectUser');
    var branches = {}; // branches by id

    var branchesSkip = 0;

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
    // var panelBranchesTop = new ui.Panel();
    // panelBranchesTop.class.add('branches-top');
    // panelBranchesTop.flex = true;
    // panelBranchesContainer.append(panelBranchesTop);

    // branches filter
    var panelBranchesFilter = new ui.Panel();
    panelBranchesFilter.class.add('branches-filter');
    panelBranchesFilter.flex = true;
    panelBranchesContainer.append(panelBranchesFilter);

    // filter
    var fieldBranchesFilter = new ui.SelectField({
        options: [{
            v: 'open', t: 'Open Branches'
        }, {
            v: 'closed', t: 'Closed Branches'
        }]
    });
    fieldBranchesFilter.value = 'open';
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
    var panelCheckpoints = editor.call('picker:versioncontrol:widget:checkpoints');
    panelRight.append(panelCheckpoints);

    panelCheckpoints.on('checkpoint:new', function () {
        showRightSidePanel(panelCreateCheckpoint);
    });

    panelCheckpoints.on('checkpoint:restore', function (checkpoint) {
        showRightSidePanel(panelRestoreCheckpoint);
        panelRestoreCheckpoint.setCheckpoint(checkpoint);
    });

    panelCheckpoints.on('checkpoint:branch', function (checkpoint) {
        showRightSidePanel(panelCreateBranch);
        panelCreateBranch.setSourceBranch(panelCheckpoints.branch);
        panelCreateBranch.setCheckpointId(checkpoint.id);
    });

    // new checkpoint panel
    var panelCreateCheckpoint = editor.call('picker:versioncontrol:widget:createCheckpoint');
    panelCreateCheckpoint.hidden = true;
    panelRight.append(panelCreateCheckpoint);

    // create checkpoint progress
    var panelCreateCheckpointProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Creating checkpoint',
        finishText: 'Checkpoint created',
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

    // close branch panel
    var panelCloseBranch = editor.call('picker:versioncontrol:widget:closeBranch');
    panelCloseBranch.hidden = true;
    panelRight.append(panelCloseBranch);

    // close progress
    var panelCloseBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Closing branch',
        finishText: 'Branch closed',
        errorText: 'Failed to close branch'
    });
    panelCloseBranchProgress.hidden = true;
    panelRight.append(panelCloseBranchProgress);

    // Close branch
    panelCloseBranch.on('cancel', function () {
        showCheckpoints();
    });
    panelCloseBranch.on('confirm', function (data) {
        togglePanels(false);
        showRightSidePanel(panelCloseBranchProgress);

        editor.call('branches:close', panelCloseBranch.branch.id, function (err) {
            panelCloseBranchProgress.finish(err);
            // if there was an error re-add the item to the list
            if (err) {
                togglePanels(true);
            } else {
                // remove item from list
                setTimeout(function () {
                    togglePanels(true);
                    var item = getBranchListItem(panelCloseBranch.branch);
                    if (item) {
                        var nextItem = item.selected ? (item.element.nextSibling || item.element.previousSibling) : null;
                        listBranches.remove(item);

                        // select next or previous sibling
                        if (nextItem) {
                            nextItem.ui.selected = true;
                        }
                    }

                    showCheckpoints();
                }, 1000);
            }
        });
    });

    // open branch progress panel
    var panelOpenBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Opening branch',
        finishText: 'Branch opened',
        errorText: 'Failed to open branch'
    });
    panelOpenBranchProgress.hidden = true;
    panelRight.append(panelOpenBranchProgress);

    // merge branches panel
    var panelMergeBranches = editor.call('picker:versioncontrol:widget:mergeBranches');
    panelMergeBranches.hidden = true;
    panelRight.append(panelMergeBranches);

    // merge branches progress
    var panelMergeBranchesProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Attempting to auto merge branches',
        finishText: 'Merge completed - refreshing the browser',
        errorText: 'Unable to auto merge'
    });
    panelMergeBranchesProgress.hidden = true;
    panelRight.append(panelMergeBranchesProgress);

    // Merge branches
    panelMergeBranches.on('cancel', function () {
        showCheckpoints();
    });
    panelMergeBranches.on('confirm', function () {
        var sourceBranchId = panelMergeBranches.sourceBranch.id;
        var targetBranchId = panelMergeBranches.targetBranch.id;

        togglePanels(false);
        showRightSidePanel(panelMergeBranchesProgress);
        editor.call('branches:merge', sourceBranchId, targetBranchId, function (err, data) {
            panelMergeBranchesProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                // if there are merge conflicts then show
                // conflict manager
                if (data.conflicts) {
                    panelMergeBranchesProgress.setMessage('Unable to auto merge - opening conflict manager')
                    setTimeout(function () {
                        editor.call('picker:project:close');
                        editor.call('picker:conflictManager', data);
                    }, 1500);
                } else {
                    // otherwise merge was successful
                    // so refresh
                    refreshBrowser();
                }
            }
        });
    });

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

    // Restore checkpoints
    panelRestoreCheckpoint.on('cancel', function () {
        showCheckpoints();
    });
    panelRestoreCheckpoint.on('confirm', function () {
        togglePanels(false);
        showRightSidePanel(panelRestoreCheckpointProgress);

        editor.call('checkpoints:restore', panelRestoreCheckpoint.checkpoint.id, config.self.branch.id, function (err, data) {
            panelRestoreCheckpointProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                refreshBrowser();
            }
        });
    });

    // switch branch progress
    var panelSwitchBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Switching branch',
        finishText: 'Switched branch - refreshing the browser',
        errorText: 'Failed to switch branch'
    });
    panelSwitchBranchProgress.hidden = true;
    panelRight.append(panelSwitchBranchProgress);

    var showRightSidePanel = function (panel) {
        // hide all right side panels first
        var p = panelRight.innerElement.firstChild;
        while (p && p.ui) {
            p.ui.hidden = true;
            p = p.nextSibling;
        }

        // show specified panel
        if (panel) {
            panel.hidden = false;
        }
    };

    var showCheckpoints = function () {
        showRightSidePanel(panelCheckpoints);
    };

    // new branch button
    // var btnNewBranch = new ui.Button({
    //     text: 'NEW BRANCH'
    // });
    // btnNewBranch.flexGrow = 1;
    // btnNewBranch.class.add('icon', 'create');
    // panelBranchesTop.append(btnNewBranch);

    // branch for which context menu is open
    var contextBranch = null;

    // branches context menu
    var menuBranches = new ui.Menu();

    // when the branches context menu is closed 'unclick' dropdowns
    menuBranches.on('open', function (open) {
        if (open || ! contextBranch) return;

        var item = document.getElementById('branch-' + contextBranch.id);
        if (! item) return;

        var dropdown = item.querySelector('.clicked');
        if (! dropdown) return;

        dropdown.classList.remove('clicked');
        dropdown.innerHTML = '&#57689;';

        if (! open) {
            contextBranch = null;
        }
    });

    // checkout branch
    var menuBranchesSwitchTo = new ui.MenuItem({
        text: 'Switch To',
        value: 'switch-branch'
    });
    menuBranches.append(menuBranchesSwitchTo);

    // switch to branch
    menuBranchesSwitchTo.on('select', function () {
        if (contextBranch) {
            togglePanels(false);
            showRightSidePanel(panelSwitchBranchProgress);
            editor.call('branches:checkout', contextBranch.id, function (err, data) {
                panelSwitchBranchProgress.finish(err);
                if (err) {
                    togglePanels(true);
                } else {
                    refreshBrowser();
                }
            });
        }
    });

    // merge branch
    var menuBranchesMerge = new ui.MenuItem({
        text: 'Merge',
        value: 'merge-branch'
    });
    menuBranches.append(menuBranchesMerge);

    // merge branch
    menuBranchesMerge.on('select', function () {
        if (contextBranch) {
            showRightSidePanel(panelMergeBranches);
            panelMergeBranches.setSourceBranch(contextBranch);
            panelMergeBranches.setTargetBranch(config.self.branch);
        }
    });


    // close branch
    var menuBranchesClose = new ui.MenuItem({
        text: 'Close',
        value: 'close-branch'
    });
    menuBranches.append(menuBranchesClose);

    // close branch
    menuBranchesClose.on('select', function () {
        if (contextBranch) {
            showRightSidePanel(panelCloseBranch);
            panelCloseBranch.setBranch(contextBranch);
        }
    });

    // open branch
    var menuBranchesOpen = new ui.MenuItem({
        text: 'Re-Open',
        value: 'open-branch'
    });
    menuBranches.append(menuBranchesOpen);

    // open branch
    menuBranchesOpen.on('select', function () {
        if (! contextBranch) return;

        var branch = contextBranch;

        togglePanels(false);
        showRightSidePanel(panelOpenBranchProgress);

        editor.call('branches:open', branch.id, function (err) {
            panelOpenBranchProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                setTimeout(function () {
                    var item = getBranchListItem(branch);
                    if (item) {
                        var wasSelected = item.selected;
                        var nextItem = item.element.nextSibling || item.element.previousSibling;

                        // remove branch from the list
                        listBranches.remove(item);
                        // select next or previous item
                        if (nextItem && wasSelected) {
                            nextItem.ui.selected = true;
                        } else if (! nextItem) {
                            // if no more items exist in the list then view the open list
                            showRightSidePanel(null);
                            fieldBranchesFilter.value = 'open';
                        }
                    }

                    togglePanels(true);
                }, 1000);
            }
        });
    });

    // Filter context menu items
    menuBranches.on('open', function () {
        menuBranchesClose.hidden = ! contextBranch || contextBranch.closed || contextBranch.id === config.project.masterBranch || contextBranch.id === projectUserSettings.get('branch');
        menuBranchesOpen.hidden = ! contextBranch || ! contextBranch.closed;
        menuBranchesSwitchTo.hidden = ! contextBranch || contextBranch.id === projectUserSettings.get('branch') || contextBranch.closed;
        menuBranchesMerge.hidden = menuBranchesSwitchTo.hidden;
    });

    editor.call('layout.root').append(menuBranches);


    var createBranchListItem = function (branch) {
        var item = new ui.ListItem({
            allowDeselect: false
        });
        item.element.id = 'branch-' + branch.id;

        var panel = new ui.Panel();
        item.element.appendChild(panel.element);

        var labelIcon = new ui.Label({
            text: '&#58208;',
            unsafe: true
        });
        labelIcon.class.add('icon');
        panel.append(labelIcon);

        var labelName = new ui.Label({
            text: branch.name
        });
        labelName.class.add('name');
        panel.append(labelName);

        var labelDate = new ui.Label({
            text: 'Created ' + editor.call('datetime:convert', branch.created)
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

            if (panelCheckpoints.hidden) {
                showCheckpoints();
            }

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
        item.on('select', function () {
            selectBranch(branch);
        });

        // if this is our current branch then change the status icon
        // and hide the dropdown button because it doesn't currently
        // have any available actions for the current branch
        if (branch.id === config.self.branch.id) {
            labelIcon.class.add('active');
            dropdown.hidden = true;
        }
    };

    var getBranchListItem = function (branch) {
        var item = document.getElementById('branch-' + branch.id);
        return item && item.ui;
    };

    var selectBranch = function (branch) {
        showCheckpoints();

        panelCheckpoints.setBranch(branch);
        panelCheckpoints.loadCheckpoints();
    };

    // show create branch panel
    // btnNewBranch.on('click', function () {
    //     showRightSidePanel(panelCreateBranch);
    //     panelCreateBranch.setSourceBranch(config.self.branch);
    //     if (config.self.branch.latestCheckpointId) {
    //         panelCreateBranch.setCheckpointId(config.self.branch.latestCheckpointId);
    //     }
    // });

    // Create checkpoint
    panelCreateCheckpoint.on('cancel', showCheckpoints);
    panelCreateCheckpoint.on('confirm', function (data) {
        togglePanels(false);
        showRightSidePanel(panelCreateCheckpointProgress);

        editor.call('checkpoints:create', data.description, function (err, checkpoint) {
            panelCreateCheckpointProgress.finish(err);
            if (! err) {
                setTimeout(function () {
                    // update latest checkpoint in current branches
                    if (branches[config.self.branch.id]) {
                        branches[config.self.branch.id].latestCheckpointId = checkpoint.id;
                    }

                    config.self.branch.latestCheckpointId = checkpoint.id;

                    // add new checkpoint to checkpoint list
                    if (panelCheckpoints.branch.id === config.self.branch.id) {
                        var existingCheckpoints = panelCheckpoints.checkpoints || [];
                        existingCheckpoints.unshift(checkpoint);
                        panelCheckpoints.setCheckpoints(existingCheckpoints);
                    }

                    togglePanels(true);
                    showCheckpoints();
                },  1000);
            } else {
                togglePanels(true);
            }
        });
    });

    // Create branch
    panelCreateBranch.on('cancel', showCheckpoints);
    panelCreateBranch.on('confirm', function (data) {
        togglePanels(false);

        showRightSidePanel(panelCreateBranchProgress);

        var data = {
            name: data.name,
            projectId: config.project.id,
            sourceBranchId: panelCheckpoints.branch.id,
        };

        if (panelCreateBranch.checkpointId) {
            data.sourceCheckpointId = panelCreateBranch.checkpointId;
        }

        editor.call('branches:create', data, function (err, branch) {
            panelCreateBranchProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                refreshBrowser();
            }
        });
    });

    // Enable or disable the clickable parts of this picker
    var togglePanels = function (enabled) {
        editor.call('picker:project:setClosable', enabled);
        editor.call('picker:project:toggleLeftPanel', enabled);
        // panelBranchesTop.disabled = !enabled;
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
        // clear current branches
        listBranches.clear();
        // clear branch from checkpoints so that checkpoints are also hidden
        panelCheckpoints.setBranch(null);

        editor.call('branches:list', {
            limit: 20,
            skip: branchesSkip,
            closed: fieldBranchesFilter.value === 'closed'
        }, function (err, data) {
            branches = {};

            if (err) {
                return console.error(err);
            }

            if (! data.result[0]) return;

            // convert array to dict
            branches = data.result.reduce(function (map, branch) {
                map[branch.id] = branch;
                return map;
            }, {});

            var selected = data.result[0];
            data.result.forEach(function (branch) {
                createBranchListItem(branch);
                if (branch.id === config.self.branch.id) {
                    selected = branch;
                }
            });

            if (selected) {
                var item = getBranchListItem(selected);
                if (item) {
                    item.selected = true;
                }
            }
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
        showRightSidePanel(null);

        // clear checkpoint
        panelCheckpoints.setCheckpoints(null);
        panelCheckpoints.toggleLoadMore(false);

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', function (state) {
        if (state && ! panel.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    editor.method('picker:versioncontrol', function () {
        editor.call('picker:project', 'version control');
    });

});
