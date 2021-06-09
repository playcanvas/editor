editor.once('load', function () {
    'use strict';

    if (config.project.settings.useLegacyScripts) {
        return;
    }

    var refreshBrowser = function () {
        // Do this in a timeout to give some time to the user
        // to read any information messages.
        // Also file picker-version-control-messenger.js will actually
        // refresh the browser first - so this is here really to make sure
        // the browser is refreshed if for some reason the messenger fails to deliver the message.
        // That's why the timeout here is larger than what's in picker-version-control-messenger
        setTimeout(function () {
            window.location.reload();
        }, 2000);
    };

    var events = [];

    var projectUserSettings = editor.call('settings:projectUser');
    var branches = {}; // branches by id

    var branchesSkip = null;
    var selectedBranch = null;
    var showNewCheckpointOnLoad = false;

    // main panel
    var panel = new ui.Panel();
    panel.class.add('picker-version-control');
    editor.call('picker:project:registerMenu', 'version control', 'Version Control', panel);
    panel.flex = true;

    // hide version control picker if we are not part of the team
    if (! editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'version control', false);
    }
    editor.on('permissions:set', function () {
        editor.call('picker:project:toggleMenu', 'version control', editor.call('permissions:read'));
    });

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
            v: 'favorite', t: 'Favorite Branches'
        }, {
            v: 'closed', t: 'Closed Branches'
        }]
    });
    fieldBranchesFilter.value = 'favorite';
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

    var loadMoreListItem = new ui.ListItem();
    loadMoreListItem.hidden = true;
    loadMoreListItem.class.add('load-more');
    var btnLoadMoreBranches = new ui.Button({
        text: 'LOAD MORE'
    });
    loadMoreListItem.element.append(btnLoadMoreBranches.element);
    btnLoadMoreBranches.on('click', function (e) {
        e.stopPropagation(); // do not select parent list item on click
        loadBranches();
    });

    // right side container panel
    var panelRight = new ui.Panel();
    panelRight.class.add('side-panel');
    panelRight.flex = true;
    panelRight.flexGrow = 1;
    panel.append(panelRight);

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

    // checkpoints panel
    var panelCheckpoints = editor.call('picker:versioncontrol:widget:checkpoints');
    panelRight.append(panelCheckpoints);

    var panelDiffCheckpoints = editor.call('picker:versioncontrol:widget:diffCheckpoints');
    panelDiffCheckpoints.hidden = true;
    panel.append(panelDiffCheckpoints);

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
        panelCreateBranch.setCheckpoint(checkpoint);
    });

    panelCheckpoints.on('checkpoint:diff', function () {
        panelDiffCheckpoints.hidden = false;
    });

    editor.on('checkpoint:diff:select', function (branch, checkpoint) {
        var numSelected = panelDiffCheckpoints.getSelectedCount();
        panel.class.remove('diff-checkpoints-selected-' + numSelected);
        panelDiffCheckpoints.onCheckpointSelected(branch, checkpoint);
        numSelected = panelDiffCheckpoints.getSelectedCount();
        if (numSelected) {
            panel.class.add('diff-checkpoints-selected-' + numSelected);
        }
    });

    editor.on('checkpoint:diff:deselect', function (branch, checkpoint) {
        var numSelected = panelDiffCheckpoints.getSelectedCount();
        panel.class.remove('diff-checkpoints-selected-' + numSelected);
        panelDiffCheckpoints.onCheckpointDeselected(branch, checkpoint);
        numSelected = panelDiffCheckpoints.getSelectedCount();
        if (numSelected) {
            panel.class.add('diff-checkpoints-selected-' + numSelected);
        }
    });

    panelDiffCheckpoints.on('show', function () {
        panel.class.add('diff-mode');
        panelCheckpoints.toggleDiffMode(true);
    });

    panelDiffCheckpoints.on('hide', function () {
        panel.class.remove('diff-mode');
        panelCheckpoints.toggleDiffMode(false);
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

    // generate diff progress panel
    var panelGenerateDiffProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Getting changes',
        finishText: 'Showing changes',
        errorText: 'Failed to get changes'
    });
    panelGenerateDiffProgress.hidden = true;
    panelRight.append(panelGenerateDiffProgress);

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

    // Enable or disable the clickable parts of this picker
    var togglePanels = function (enabled) {
        editor.call('picker:project:setClosable', enabled && config.scene.id);
        editor.call('picker:project:toggleLeftPanel', enabled);
        // panelBranchesTop.disabled = !enabled;
        panelBranches.disabled = !enabled;
        panelBranchesFilter.disabled = !enabled;
    };

    var createCheckpoint = function (branchId, description, callback) {
        togglePanels(false);
        showRightSidePanel(panelCreateCheckpointProgress);

        editor.call('checkpoints:create', branchId, description, function (err, checkpoint) {
            panelCreateCheckpointProgress.finish(err);
            if (err) {
                return togglePanels(true);
            }

            callback(checkpoint);
        });
    };

    var showCheckpoints = function () {
        showRightSidePanel(panelCheckpoints);
    };

    // Close branch
    panelCloseBranch.on('cancel', function () {
        showCheckpoints();
    });
    panelCloseBranch.on('confirm', function (data) {
        togglePanels(false);

        var close = function () {
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
                        showCheckpoints();
                    }, 1000);
                }
            });
        };

        if (panelCloseBranch.createTargetCheckpoint) {
            // take a checkpoint first
            createCheckpoint(panelCloseBranch.branch.id, 'Checkpoint before closing branch "' + panelCloseBranch.branch.name + '"', close);
        } else {
            close();
        }

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
        finishText: 'Merge ready - Opening Merge Review',
        errorText: 'Unable to auto merge'
    });
    panelMergeBranchesProgress.hidden = true;
    panelRight.append(panelMergeBranchesProgress);

    // Merge branches
    panelMergeBranches.on('cancel', function () {
        showCheckpoints();
    });
    panelMergeBranches.on('confirm', function () {
        var sourceBranch = panelMergeBranches.sourceBranch;
        var destinationBranch = panelMergeBranches.destinationBranch;
        var createSourceCheckpoint = panelMergeBranches.createSourceCheckpoint;
        var createTargetCheckpoint = panelMergeBranches.createTargetCheckpoint;

        togglePanels(false);

        var merge = function () {
            showRightSidePanel(panelMergeBranchesProgress);

            let evtOnMergeCreated = editor.on('messenger:merge.new', data => {
                if (data.dst_branch_id !== config.self.branch.id) return;

                evtOnMergeCreated.unbind();
                evtOnMergeCreated = null;

                editor.call('branches:getMerge', data.merge_id, (err, data) => {
                    config.self.branch.merge = data;

                    editor.call('picker:project:close');
                    editor.call('picker:versioncontrol:mergeOverlay:hide'); // hide this in case it's open
                    editor.call('picker:conflictManager');
                });
            });

            editor.call('branches:merge', sourceBranch.id, destinationBranch.id, (err) => {
                if (err) {
                    console.error(err);
                }

                // if we have already hidden this panel then just return
                if (panel.hidden) return;

                // otherwise show error
                if (err && !/Request timed out/.test(err)) {
                    panelMergeBranchesProgress.finish(err);
                    togglePanels(true);

                    if (evtOnMergeCreated) {
                        evtOnMergeCreated.unbind();
                        evtOnMergeCreated = null;
                    }
                }
            });
        };

        var checkpointDescription = function (srcBranch, dstBranch) {
            return `Checkpoint before merging branch "${srcBranch.name}" [${srcBranch.latestCheckpointId.substring(0, 7)}] into "${dstBranch.name}" [${dstBranch.latestCheckpointId.substring(0, 7)}]`;
        };

        if (createSourceCheckpoint) {
            // take a checkpoint in the source branch first
            createCheckpoint(sourceBranch.id, checkpointDescription(sourceBranch, destinationBranch), () => {
                if (createTargetCheckpoint) {
                    // take a checkpoint in the target branch first
                    createCheckpoint(config.self.branch.id, checkpointDescription(sourceBranch, destinationBranch), merge);
                } else {
                    merge();
                }
            });

        } else if (createTargetCheckpoint) {
            // take a checkpoint in the target branch first
            createCheckpoint(config.self.branch.id, checkpointDescription(sourceBranch, destinationBranch), merge);
        } else {
            merge();
        }
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

        var restore = function () {
            showRightSidePanel(panelRestoreCheckpointProgress);

            editor.call('checkpoints:restore', panelRestoreCheckpoint.checkpoint.id, config.self.branch.id, function (err, data) {
                panelRestoreCheckpointProgress.finish(err);
                if (err) {
                    togglePanels(true);
                } else {
                    refreshBrowser();
                }
            });
        };

        if (panelRestoreCheckpoint.createTargetCheckpoint) {
            // take a checkpoint first
            createCheckpoint(config.self.branch.id, 'Checkpoint before restoring "' + panelRestoreCheckpoint.checkpoint.id.substring(0, 7) + '"', restore);
        } else {
            restore();
        }

    });

    // switch branch progress
    var panelSwitchBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Switching branch',
        finishText: 'Switched branch - refreshing the browser',
        errorText: 'Failed to switch branch'
    });
    panelSwitchBranchProgress.hidden = true;
    panelRight.append(panelSwitchBranchProgress);

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
    menuBranches.class.add('version-control');

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
            menuBranches.contextBranchIsFavorite = false;
        }
    });

    // favorite branch
    var menuBranchesFavorite = new ui.MenuItem({
        text: 'Favorite This Branch',
        value: 'favorite-branch'
    });
    menuBranches.append(menuBranchesFavorite);

    // favorite branch
    menuBranchesFavorite.on('select', function () {
        if (!contextBranch) return;
        if (menuBranches.contextBranchIsFavorite) {
            var index = projectUserSettings.get('favoriteBranches').indexOf(contextBranch.id);
            if (index >= 0)
                projectUserSettings.remove('favoriteBranches', index);
        } else {
            projectUserSettings.insert('favoriteBranches', contextBranch.id);
        }
    });

    // checkout branch
    var menuBranchesSwitchTo = new ui.MenuItem({
        text: 'Switch To This Branch',
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
        text: 'Merge Into Current Branch',
        value: 'merge-branch'
    });
    menuBranches.append(menuBranchesMerge);

    // merge branch
    menuBranchesMerge.on('select', function () {
        if (contextBranch) {
            showRightSidePanel(panelMergeBranches);
            panelMergeBranches.setSourceBranch(contextBranch);
            panelMergeBranches.setDestinationBranch(config.self.branch);
        }
    });


    // close branch
    var menuBranchesClose = new ui.MenuItem({
        text: 'Close This Branch',
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
        text: 'Re-Open This Branch',
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
                // do this in a timeout to give time for the
                // success message to appear
                setTimeout(function () {
                    togglePanels(true);
                    showCheckpoints();
                }, 1000);
            }
        });
    });

    // Filter context menu items
    menuBranches.on('open', function () {
        var writeAccess = editor.call('permissions:write');

        menuBranchesFavorite.text = (menuBranches.contextBranchIsFavorite ? 'Unf' : 'F') + 'avorite This Branch';

        menuBranchesClose.hidden = !writeAccess || !contextBranch || contextBranch.closed || contextBranch.id === config.project.masterBranch || contextBranch.id === projectUserSettings.get('branch');
        menuBranchesOpen.hidden = !writeAccess || !contextBranch || !contextBranch.closed;

        menuBranchesFavorite.hidden = !writeAccess || !contextBranch || contextBranch.id === projectUserSettings.get('branch');
        menuBranchesSwitchTo.hidden = !contextBranch || contextBranch.id === projectUserSettings.get('branch') || contextBranch.closed;
        menuBranchesMerge.hidden = !writeAccess || !contextBranch || contextBranch.id === projectUserSettings.get('branch') || contextBranch.closed;
    });

    editor.call('layout.root').append(menuBranches);

    // Select specified branch and show its checkpoints
    var selectBranch = function (branch) {
        selectedBranch = branch;
        showCheckpoints();

        panelCheckpoints.setBranch(branch);
        panelCheckpoints.loadCheckpoints();
    };

    var createBranchListItem = function (branch) {
        var item = new ui.ListItem({
            allowDeselect: false
        });
        item.branch = branch;
        item.element.id = 'branch-' + branch.id;

        var panel = new ui.Panel();
        item.element.appendChild(panel.element);

        var labelIcon = new ui.Label({
            text: '&#58208;',
            unsafe: true
        });
        labelIcon.class.add('icon');
        // TODO: should this be a css class? feels bad to made another class just for this fontSize change
        labelIcon.style.fontSize = '8px';
        panel.append(labelIcon);

        var labelName = new ui.Label({
            text: branch.name
        });
        labelName.class.add('name', 'selectable');
        panel.append(labelName);

        var labelBranchId = new ui.Label({
            text: branch.id
        });
        labelBranchId.class.add('branch-id', 'selectable');
        panel.append(labelBranchId);

        // dropdown
        var dropdown = new ui.Button({
            text: '&#57689;'
        });
        dropdown.branch = branch;
        dropdown.class.add('dropdown');
        panel.append(dropdown);

        Object.defineProperty(item, 'isFavorite', {
            get: function () {
                return this._isFavorite;
            },
            set: function (value) {
                if (value !== this._isFavorite) {
                    this._isFavorite = Boolean(value);
                    labelIcon.text = this._isFavorite ? '&#9733;' : '&#58208;';
                    labelIcon.style.fontSize = this._isFavorite ? '10px' : '8px';
                }
            }
        });

        const favorites = projectUserSettings.get('favoriteBranches');
        item.isFavorite = favorites && favorites.includes(branch.id);

        dropdown.on('click', function (e) {
            e.stopPropagation();

            if (panelCheckpoints.hidden) {
                showCheckpoints();
            }

            if (panelBranches.disabled) return;

            dropdown.class.add('clicked');
            dropdown.element.innerHTML = '&#57687;';

            contextBranch = branch;
            menuBranches.contextBranchIsFavorite = item.isFavorite;
            menuBranches.open = true;
            var rect = dropdown.element.getBoundingClientRect();
            menuBranches.position(rect.right - menuBranches.innerElement.clientWidth, rect.bottom);
        });

        listBranches.append(item);

        // select branch
        item.on('select', function () {
            selectBranch(branch);
        });

        // if we are currently showing an error and we click
        // on a branch that is already selected then hide the error
        // and show the checkpoints
        var wasItemSelectedBeforeClick = false;
        item.element.addEventListener('mousedown', function () {
            wasItemSelectedBeforeClick = item.selected;
        });
        item.element.addEventListener('mouseup', function () {
            if (! wasItemSelectedBeforeClick || ! item.selected) return;
            wasItemSelectedBeforeClick = false;

            if (editor.call('picker:versioncontrol:isErrorWidgetVisible')) {
                showCheckpoints();
            }
        });

        // if this is our current branch then change the status icon
        // and hide the dropdown button because it doesn't currently
        // have any available actions for the current branch
        if (branch.id === config.self.branch.id) {
            labelIcon.class.add('active');
            dropdown.hidden = true;
        }
    };

    // Get the list item for a branch
    var getBranchListItem = function (branchId) {
        var item = document.getElementById('branch-' + branchId);
        return item && item.ui;
    };

    var updateBranchFavorite = function (branchId) {
        const item = getBranchListItem(branchId);
        if (item)
            item.isFavorite = projectUserSettings.get('favoriteBranches').includes(item.branch.id);
    };

    function viewDiff(srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId) {
        panelDiffCheckpoints.hidden = true;

        togglePanels(false);
        showRightSidePanel(panelGenerateDiffProgress);
        editor.call('diff:create', srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId, function (err, diff) {
            panelGenerateDiffProgress.finish(err);

            togglePanels(true);

            if (!err && diff.numConflicts === 0) {
                panelGenerateDiffProgress.setMessage("There are no changes");
                setTimeout(function () {
                    showCheckpoints();
                }, 1500);
            } else if (! err) {
                editor.call('picker:project:close');
                editor.call('picker:versioncontrol:mergeOverlay:hide'); // hide this in case it's open
                editor.call('picker:diffManager', diff);
            }
        });
    }

    panelDiffCheckpoints.on('diff',  viewDiff);
    panelCheckpoints.on('diff', viewDiff);

    // show create branch panel
    // btnNewBranch.on('click', function () {
    //     showRightSidePanel(panelCreateBranch);
    //     panelCreateBranch.setSourceBranch(config.self.branch);
    //     if (config.self.branch.latestCheckpointId) {
    //         panelCreateBranch.setCheckpointId(config.self.branch.latestCheckpointId);
    //     }
    // });

    // Create checkpoint
    panelCreateCheckpoint.on('cancel', function () {
        // we need to load the checkpoints if we cancel creating checkpoints
        // because initially we might have opened this picker by showing the create checkpoint
        // panel without having a chance to load the checkpoints first
        if (! panelCheckpoints.checkpoints)  {
            selectBranch(selectedBranch);
        } else {
            showCheckpoints();
        }
    });
    panelCreateCheckpoint.on('confirm', function (data) {
        createCheckpoint(config.self.branch.id, data.description, function (checkpoint) {
            setTimeout(function () {
                togglePanels(true);

                // show checkpoints unless they haven't been loaded yet in which
                // case re-select the branch which reloads the checkpoints
                if (! panelCheckpoints.checkpoints) {
                    selectBranch(selectedBranch);
                } else {
                    showCheckpoints();
                }
            },  1000);
        });
    });

    // Create branch
    panelCreateBranch.on('cancel', showCheckpoints);
    panelCreateBranch.on('confirm', function (data) {
        togglePanels(false);
        showRightSidePanel(panelCreateBranchProgress);

        var params = {
            name: data.name,
            projectId: config.project.id,
            sourceBranchId: panelCheckpoints.branch.id
        };

        if (panelCreateBranch.checkpoint) {
            params.sourceCheckpointId = panelCreateBranch.checkpoint.id;
        }

        editor.call('branches:create', params, function (err, branch) {
            panelCreateBranchProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                refreshBrowser();
            }
        });
    });

    var loadBranches = function () {
        // change status of loading button
        btnLoadMoreBranches.disabled = true;
        btnLoadMoreBranches.text = 'LOADING...';

        // if we are reloading
        // clear branch from checkpoints so that checkpoints are also hidden
        if (! branchesSkip) {
            panelCheckpoints.setBranch(null);
            selectedBranch = null;
        }

        // request branches from server
        editor.call('branches:list', {
            limit: 40,
            skip: branchesSkip,
            closed: fieldBranchesFilter.value === 'closed',
            favorite: fieldBranchesFilter.value === 'favorite'
        }, function (err, data) {
            if (err) {
                return log.error(err);
            }

            // change status of loading button
            btnLoadMoreBranches.disabled = false;
            btnLoadMoreBranches.text = 'LOAD MORE';
            loadMoreListItem.hidden = !data.pagination.hasMore;


            // if we are re-loading the branch list then clear the current items
            if (! branchesSkip) {
                listBranches.clear();
                branches = {};

                // create current branch as first item
                if (fieldBranchesFilter.value !== 'closed') {
                    createBranchListItem(config.self.branch);
                }
            }

            // use last item as a marker for loading the next batch of branches
            var lastItem = data.result[data.result.length - 1];
            branchesSkip = lastItem ? lastItem.id : null;

            if (! data.result[0]) return;

            // convert array to dict
            branches = data.result.reduce(function (map, branch) {
                map[branch.id] = branch;
                return map;
            }, branches);

            var selected = selectedBranch;

            // create list items for each branch
            data.result.forEach(function (branch) {
                // skip the current branch as we've already
                // created that first
                if (branch.id !== config.self.branch.id) {
                    createBranchListItem(branch);
                }
            });

            // if we didn't find a proper selection then select our branch
            if (! selected) {
                selected = config.self.branch;
            }

            if (selected) {
                var item = getBranchListItem(selected.id);
                if (item) {
                    item.selected = true;
                }
            }

            // add load more list item in the end
            listBranches.append(loadMoreListItem);

            // show new checkpoint panel if necessary
            if (showNewCheckpointOnLoad) {
                showNewCheckpointOnLoad = false;
                showRightSidePanel(panelCreateCheckpoint);
            }
        });
    };

    // When the filter changes clear our branch list and reload branches
    fieldBranchesFilter.on('change', function () {
        branchesSkip = null;
        listBranches.clear();
        loadBranches();
    });

    // on show
    panel.on('show', function () {
        showCheckpoints();

        // load and create branches
        branchesSkip = null;
        selectedBranch = null;
        loadBranches();

        events.push(editor.on('permissions:writeState', function (writeEnabled) {
            // hide all dropdowns if we no longer have write access
            panelBranches.innerElement.querySelectorAll('.dropdown').forEach(function (dropdown) {
                dropdown.ui.hidden = ! writeEnabled || dropdown.ui.branch.id === config.self.branch.id;
            });
        }));

        // when a checkpoint is created add it to the list
        events.push(editor.on('messenger:checkpoint.createEnded', function (data) {
            if (data.status === 'error') return;

            // update latest checkpoint in current branches
            if (branches[data.branch_id]) {
                branches[data.branch_id].latestCheckpointId = data.checkpoint_id;
            }

            // add new checkpoint to checkpoint list
            // but only if the checkpoints panel has loaded its checkpoints.
            // Otherwise do not add it but wait until the panel is shown and all of its checkpoints
            // (including the new one) are loaded
            if (panelCheckpoints.branch.id === data.branch_id) {
                var existingCheckpoints = panelCheckpoints.checkpoints;
                if (existingCheckpoints) {
                    existingCheckpoints.unshift({
                        id: data.checkpoint_id,
                        user: {
                            id: data.user_id,
                            fullName: data.user_full_name
                        },
                        createdAt: new Date(data.created_at),
                        description: data.description
                    });
                    panelCheckpoints.setCheckpoints(existingCheckpoints);
                }
            }
        }));

        // when a branch is unfavorited remove it from the list and select the next one
        events.push(projectUserSettings.on('favoriteBranches:remove', function (branchId) {
            // only handle when viewing favorites and when branch isn't current branch
            if (fieldBranchesFilter.value !== 'favorite' || config.self.branch.id === branchId) {
                return;
            }

            // we are seeing the favorite branches view so remove this branch from the list
            // and select the next branch
            var item = getBranchListItem(branchId);
            if (! item) return;

            var nextItem = null;
            if (item.selected) {
                if (item.element.nextSibling !== loadMoreListItem.element) {
                    nextItem = item.element.nextSibling;
                }

                if (! nextItem) {
                    nextItem = item.element.previousSibling;
                }
            }

            listBranches.remove(item);

            // select next or previous sibling
            if (nextItem && nextItem !== loadMoreListItem.element) {
                nextItem.ui.selected = true;
            }
        }));

        // when a branch is closed remove it from the list and select the next one
        events.push(editor.on('messenger:branch.close', function (data) {
            if (fieldBranchesFilter.value === 'closed') {
                return;
            }

            // we are seeing the open branches view so remove this branch from the list
            // and select the next branch
            var item = getBranchListItem(data.branch_id);
            if (! item) return;

            var nextItem = null;
            if (item.selected) {
                if (item.element.nextSibling !== loadMoreListItem.element) {
                    nextItem = item.element.nextSibling;
                }

                if (! nextItem) {
                    nextItem = item.element.previousSibling;
                }
            }

            listBranches.remove(item);

            // select next or previous sibling
            if (nextItem && nextItem !== loadMoreListItem.element) {

                // if the progress panel is open it means we are the ones
                // closing the branch (or some other branch..) - so wait a bit
                // so that we can show the progress end message before selecting another branch
                if (! panelCloseBranchProgress.hidden) {
                    setTimeout(function () {
                        nextItem.ui.selected = true;
                    }, 500);
                } else {
                    // otherwise immediately select the next branch
                    nextItem.ui.selected = true;
                }
            }
        }));

        events.push(editor.on('messenger:branch.open', function (data) {
            if (fieldBranchesFilter.value === 'open') {
                return;
            }

            // we are seeing the closed branches list so remove this
            // branch from this list and select the next one or if there
            // are no more branches in this list then view the open branches
            var item = getBranchListItem(data.branch_id);
            if (! item) return;

            var wasSelected = item.selected;
            var nextItem = null;
            if (item.element.nextSibling !== loadMoreListItem.element) {
                nextItem = item.element.nextSibling;
            }

            if (! nextItem) {
                nextItem = item.element.previousSibling;
            }

            // remove branch from the list
            listBranches.remove(item);

            // select next or previous item
            var selectNext = function () {
                if (nextItem && wasSelected) {
                    nextItem.ui.selected = true;
                } else if (! nextItem) {
                    // if no more items exist in the list then view the open list
                    showRightSidePanel(null);
                    fieldBranchesFilter.value = 'open';
                }
            };

            // if the progress panel is open it means we are the ones
            // opening the branch (or some other branch..) - so wait a bit
            // so that we can show the progress end message before selecting another branch
            if (! panelOpenBranchProgress.hidden) {
                setTimeout(selectNext, 500);
            } else {
                // otherwise immediately select the next branch
                selectNext();
            }

        }));

        events.push(projectUserSettings.on('favoriteBranches:insert', updateBranchFavorite));
        events.push(projectUserSettings.on('favoriteBranches:remove', updateBranchFavorite));

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', function () {
        showRightSidePanel(null);

        // clear checkpoint
        panelCheckpoints.setCheckpoints(null);
        panelCheckpoints.toggleLoadMore(false);

        // hide diff panel
        panelDiffCheckpoints.hidden = true;

        showNewCheckpointOnLoad = false;

        events.forEach(function (evt) {
            evt.unbind();
        });
        events.length = 0;

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // Prevent viewport hovering when the picker is shown
    editor.on('viewport:hover', function (state) {
        if (state && ! panel.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // Show the picker
    editor.method('picker:versioncontrol', function () {
        editor.call('picker:project', 'version control');
    });

    // hotkey to create new checkpoint
    editor.call('hotkey:register', 'new-checkpoint', {
        key: 's',
        ctrl: true,
        callback: function (e) {
            if (! editor.call('permissions:write')) return;
            if (editor.call('picker:isOpen:otherThan', 'project')) {
                return;
            }

            if (panel.hidden) {
                showNewCheckpointOnLoad = true;
                editor.call('picker:versioncontrol');
            } else {
                showRightSidePanel(panelCreateCheckpoint);
            }
        }
    });
});
