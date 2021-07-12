editor.once('load', function () {
    'use strict';

    var events = [];

    var projectUserSettings = editor.call('settings:projectUser');

    var diffMode = false;

    var panel = new ui.Panel();
    panel.class.add('checkpoints-container');

    // checkpoints top
    var panelCheckpointsTop = new ui.Panel();
    panelCheckpointsTop.class.add('checkpoints-top');
    panel.append(panelCheckpointsTop);

    // current branch history
    var labelBranchName = new ui.Label({
        text: 'Branch'
    });
    labelBranchName.renderChanges = false;
    labelBranchName.class.add('branch-history', 'selectable');
    panelCheckpointsTop.append(labelBranchName);

    var labelBranchCheckpoints = new ui.Label({
        text: 'Checkpoints'
    });
    labelBranchCheckpoints.renderChanges = false;
    labelBranchCheckpoints.class.add('info');
    panelCheckpointsTop.append(labelBranchCheckpoints);

    var panelBranchActions = new ui.Panel();
    panelBranchActions.class.add('branch-actions', 'flex');
    panel.append(panelBranchActions);

    // add branch to favorites
    var btnFavorite = new ui.Button({
        text: 'Favorite'
    });
    btnFavorite.class.add('icon', 'favorite');
    panelBranchActions.append(btnFavorite);

    // open diff checkpoints panel
    var btnDiff = new ui.Button({
        text: 'View Diff'
    });
    btnDiff.class.add('icon', 'diff');
    panelBranchActions.append(btnDiff);

    // new checkpoint button
    var btnNewCheckpoint = new ui.Button({
        text: 'Checkpoint'
    });
    btnNewCheckpoint.class.add('icon', 'create');
    panelBranchActions.append(btnNewCheckpoint);

    var toggleTopButtons = function () {
        btnFavorite.disabled = ! panel.branch || panel.branch.closed || ! editor.call('permissions:write');
        btnNewCheckpoint.disabled = ! editor.call('permissions:write') || ! panel.branch || panel.branch.id !== config.self.branch.id;
    };

    toggleTopButtons();

    // checkpoints main panel
    var panelCheckpoints = new ui.Panel();
    panelCheckpoints.class.add('checkpoints');
    panel.append(panelCheckpoints);

    // checkpoints list
    var listCheckpoints = new ui.List();
    panelCheckpoints.append(listCheckpoints);

    // used to group displayed checkpoints into days
    var lastCheckpointDateDisplayed = null;

    // load more checkpoints list item
    var listItemLoadMore = new ui.ListItem();
    listItemLoadMore.class.add('load-more');
    listItemLoadMore.hidden = true;
    var btnLoadMore = new ui.Button({
        text: 'LOAD MORE'
    });
    listItemLoadMore.element.appendChild(btnLoadMore.element);

    // checkpoints for which context menu is currently open
    var currentCheckpoint = null;

    var currentCheckpointListRequest = null;
    var checkpointsSkip = null;

    // checkpoints context menu
    var menuCheckpoints = new ui.Menu();
    menuCheckpoints.class.add('version-control');

    // view changes between this checkpoint and previous
    var menuCheckpointsViewChanges = new ui.MenuItem({
        text: 'View Changes',
        value: 'view-changes'
    });
    menuCheckpoints.append(menuCheckpointsViewChanges);

    // restore checkpoint
    var menuCheckpointsRestore = new ui.MenuItem({
        text: 'Restore',
        value: 'restore-checkpoint'
    });
    menuCheckpoints.append(menuCheckpointsRestore);

    // branch from checkpoint
    var menuCheckpointsBranch = new ui.MenuItem({
        text: 'New Branch',
        value: 'new-branch'
    });
    menuCheckpoints.append(menuCheckpointsBranch);

    editor.call('layout.root').append(menuCheckpoints);

    // loading checkpoints icon
    var spinner = editor.call('picker:versioncontrol:svg:spinner', 64);
    spinner.classList.add('hidden');
    spinner.classList.add('spinner');
    panelCheckpoints.innerElement.appendChild(spinner);

    // Set the current branch of the panel
    panel.setBranch = function (branch) {
        // make sure we don't have any running checkpoint:list requests
        currentCheckpointListRequest = null;

        labelBranchName.text = branch && branch.name ? branch.name : 'Branch';
        panel.branch = branch;

        panel.updateFavorite();
        panel.setCheckpoints(null);
        panel.toggleLoadMore(false);

        toggleTopButtons();
    };

    panel.updateFavorite = function () {
        panel.branchIsFavorite = panel.branch && panel.branch.id && projectUserSettings.get('favoriteBranches').includes(panel.branch.id);
        btnFavorite.text = panel.branchIsFavorite ? 'Unfavorite' : 'Favorite';
    };

    // Set the checkpoints to be displayed
    panel.setCheckpoints = function (checkpoints) {
        listCheckpoints.clear();
        panelCheckpoints.element.scrollTop = 0;
        lastCheckpointDateDisplayed = null;

        var length = checkpoints && checkpoints.length;
        if (length && panel.branch && !panel.branch.closed) {
            createCurrentStateUi();
        }

        // create checkpoints
        panel.checkpoints = checkpoints;
        if (length) {
            checkpoints.forEach(createCheckpointListItem);
            checkpointsSkip = checkpoints[checkpoints.length - 1].id;
        } else {
            checkpointsSkip = null;
        }


        listCheckpoints.append(listItemLoadMore);
    };

    // Show button to load more checkpoints or not
    panel.toggleLoadMore = function (toggle) {
        listItemLoadMore.hidden = !toggle;
    };

    panel.loadCheckpoints = function () {
        btnLoadMore.disabled = true;
        btnLoadMore.text = 'LOADING...';

        var params = {
            branch: panel.branch.id,
            limit: 20
        };

        if (checkpointsSkip) {
            params.skip = checkpointsSkip;
        } else {
            // hide list of checkpoints and show spinner
            listCheckpoints.hidden = true;
            spinner.classList.remove('hidden');
        }

        // list checkpoints but make sure in the response
        // that the results are from this request and not another
        // Happens sometimes when this request takes a long time
        var request = editor.call('checkpoints:list', params, function (err, data) {
            if (request !== currentCheckpointListRequest || panel.hidden || panel.parent.hidden) {
                return;
            }

            btnLoadMore.disabled = false;
            btnLoadMore.text = 'LOAD MORE';

            // show list of checkpoints and hide spinner
            listCheckpoints.hidden = false;
            spinner.classList.add('hidden');

            currentCheckpointListRequest = null;

            if (err) {
                return log.error(err);
            }

            if (params.skip) {
                data.result = panel.checkpoints.concat(data.result);
            }

            panel.setCheckpoints(data.result);
            panel.toggleLoadMore(data.pagination.hasMore);
        });

        currentCheckpointListRequest = request;
    };

    var createCheckpointWidget = function (checkpoint) {
        var panelWidget = new ui.Panel();
        panelWidget.class.add('checkpoint-widget');
        panelWidget.flex = true;

        var imgUser = new Image();
        imgUser.src = '/api/users/' + checkpoint.user.id + '/thumbnail?size=28';
        imgUser.classList.add('noSelect');
        panelWidget.append(imgUser);

        var panelInfo = new ui.Panel();
        panelInfo.class.add('info');
        panelInfo.flex = true;
        panelWidget.append(panelInfo);

        var panelTopRow = new ui.Panel();
        panelTopRow.flexGrow = 1;
        panelTopRow.class.add('top-row');
        panelInfo.append(panelTopRow);

        var descWithoutNewLine = checkpoint.description;
        var newLineIndex = descWithoutNewLine.indexOf('\n');
        if (newLineIndex >= 0) {
            descWithoutNewLine = descWithoutNewLine.substring(0, newLineIndex);
        }
        var labelDesc = new ui.Label({
            text: descWithoutNewLine
        });
        labelDesc.renderChanges = false;
        labelDesc.class.add('desc', 'selectable');
        panelTopRow.append(labelDesc);

        var btnMore = new ui.Button({
            text: '...read more'
        });
        btnMore.on('click', function () {
            if (labelDesc.class.contains('more')) {
                labelDesc.class.remove('more');
                labelDesc.text = descWithoutNewLine;
                labelDesc.style.whiteSpace = '';
                btnMore.text = '...read more';
            } else {
                labelDesc.class.add('more');
                labelDesc.text = checkpoint.description;
                labelDesc.style.whiteSpace = 'pre-wrap';
                btnMore.text = '...read less';
            }
        });

        panelTopRow.append(btnMore);

        var panelBottomRow = new ui.Panel();
        panelBottomRow.flexGrow = 1;
        panelBottomRow.class.add('bottom-row');
        panelInfo.append(panelBottomRow);

        var labelInfo = new ui.Label({
            text: editor.call('datetime:convert', checkpoint.createdAt) +
                  ' - ' +
                  checkpoint.id.substring(0, 7) +
                  (checkpoint.user.fullName ? ' by ' + checkpoint.user.fullName : '')
        });
        labelInfo.class.add('info', 'selectable');
        panelBottomRow.append(labelInfo);


        // hide more button if necessary - do this here because the element
        // must exist in the DOM before scrollWidth / clientWidth are available,
        // Users of this widget need to call this function once the panel has been added to the DOM
        panelWidget.onAddedToDom = function () {
            btnMore.hidden = labelDesc.element.scrollWidth <= labelDesc.element.clientWidth && newLineIndex < 0;
        };

        return panelWidget;
    };

    var createCheckpointSectionHeader = function (title) {
        var header = document.createElement('div');
        header.classList.add('date');
        header.classList.add('selectable');
        header.textContent = title;
        listCheckpoints.innerElement.appendChild(header);
        return header;
    };

    var createCheckpointListItem = function (checkpoint) {
        // add current date if necessary
        var date = (new Date(checkpoint.createdAt)).toDateString();
        if (lastCheckpointDateDisplayed !== date) {
            lastCheckpointDateDisplayed = date;

            if (lastCheckpointDateDisplayed === (new Date()).toDateString()) {
                createCheckpointSectionHeader('Today');
            } else {
                var parts = lastCheckpointDateDisplayed.split(' ');
                createCheckpointSectionHeader(parts[0] + ', ' + parts[1] + ' ' + parts[2] + ', ' + parts[3]);
            }
        }

        var item = new ui.ListItem();
        item.element.id = 'checkpoint-' + checkpoint.id;

        var panelListItem = createCheckpointWidget(checkpoint);
        item.element.appendChild(panelListItem.element);

        // dropdown
        var dropdown = new ui.Button({
            text: '&#57689;'
        });
        dropdown.class.add('dropdown');
        panelListItem.append(dropdown);

        if (! editor.call('permissions:write') || diffMode) {
            dropdown.hidden = true;
        }

        dropdown.on('click', function (e) {
            e.stopPropagation();

            currentCheckpoint = checkpoint;

            dropdown.class.add('clicked');
            dropdown.element.innerHTML = '&#57687;';

            menuCheckpoints.open = true;
            var rect = dropdown.element.getBoundingClientRect();
            menuCheckpoints.position(rect.right - menuCheckpoints.innerElement.clientWidth, rect.bottom);
        });

        // select
        var checkboxSelect = new ui.Checkbox();
        checkboxSelect.class.add('tick');
        panelListItem.append(checkboxSelect);
        checkboxSelect.value = editor.call('picker:versioncontrol:widget:diffCheckpoints:isCheckpointSelected', panel.branch, checkpoint);

        var suppressCheckboxEvents = false;
        checkboxSelect.on('change', function (value) {
            if (suppressCheckboxEvents) return;
            if (value) {
                editor.emit('checkpoint:diff:select', panel.branch, checkpoint);
            } else {
                editor.emit('checkpoint:diff:deselect', panel.branch, checkpoint);
            }
        });

        events.push(editor.on('checkpoint:diff:deselect', function (deselectedBranch, deselectedCheckpoint) {
            if (deselectedCheckpoint && deselectedCheckpoint.id === checkpoint.id) {
                suppressCheckboxEvents = true;
                checkboxSelect.value = false;
                suppressCheckboxEvents = false;
            }
        }));

        listCheckpoints.append(item);

        if (!panelCheckpoints.hidden) {
            panelListItem.onAddedToDom();
        }
    };

    // Creates a list item for the current state visible only in diffMode
    var createCurrentStateListItem = function () {
        var item = new ui.ListItem();
        var panelItem = new ui.Panel();
        // panelItem.class.add('checkpoint-widget');
        panelItem.flex = true;

        var label = new ui.Label({
            text: 'Changes made since the last checkpoint'
        });
        panelItem.append(label);

        // shortcut button to view changes
        var btnViewChanges = new pcui.Button({
            text: 'VIEW CHANGES',
            size: 'small',
            class: 'btn-view-changes'
        });
        btnViewChanges.style.width = '110px';
        panelItem.append(btnViewChanges);
        btnViewChanges.on('click', () => {
            panel.emit('diff',
                panel.branch.id,
                null,
                panel.branch.id,
                panel.branch.latestCheckpointId
            );
        });

        // select
        var checkboxSelect = new ui.Checkbox();
        checkboxSelect.class.add('tick');
        panelItem.append(checkboxSelect);
        checkboxSelect.value = editor.call('picker:versioncontrol:widget:diffCheckpoints:isCheckpointSelected', panel.branch, null);

        var suppressCheckboxEvents = false;
        checkboxSelect.on('change', function (value) {
            if (suppressCheckboxEvents) return;
            if (value) {
                editor.emit('checkpoint:diff:select', panel.branch, null);
            } else {
                editor.emit('checkpoint:diff:deselect', panel.branch, null);
            }
        });

        events.push(editor.on('checkpoint:diff:deselect', function (deselectedBranch, deselectedCheckpoint) {
            if (!deselectedCheckpoint && deselectedBranch && deselectedBranch.id === panel.branch.id) {
                suppressCheckboxEvents = true;
                checkboxSelect.value = false;
                suppressCheckboxEvents = false;
            }
        }));

        listCheckpoints.append(item);

        item.element.appendChild(panelItem.element);

        return item;
    };

    var createCurrentStateUi = function () {
        var currentStateHeader = createCheckpointSectionHeader('CURRENT STATE');
        currentStateHeader.classList.add('current-state');
        var currentStateListItem = createCurrentStateListItem();
        currentStateListItem.class.add('current-state');
    };

    btnFavorite.on('click', function () {
        if (!panel.branch) return;
        if (panel.branchIsFavorite) {
            var index = projectUserSettings.get('favoriteBranches').indexOf(panel.branch.id);
            if (index >= 0)
                projectUserSettings.remove('favoriteBranches', index);
        } else {
            projectUserSettings.insert('favoriteBranches', panel.branch.id);
        }
    });

    // show create checkpoint panel
    btnNewCheckpoint.on('click', function () {
        panel.emit('checkpoint:new');
    });

    // generate diff
    btnDiff.on('click', function () {
        panel.emit('checkpoint:diff');
    });

    // load more button
    btnLoadMore.on('click', function () {
        panel.loadCheckpoints();
    });

    // restore checkpoint
    menuCheckpointsRestore.on('select', function () {
        panel.emit('checkpoint:restore', currentCheckpoint);
    });

    // branch from checkpoint
    menuCheckpointsBranch.on('select', function () {
        panel.emit('checkpoint:branch', currentCheckpoint);
    });

    // view changes in checkpoint
    menuCheckpointsViewChanges.on('select', function () {
        let previousCheckpoint = null;

        // Find the previous checkpoint to current checkpoint
        for (let i = 0, len = panel.checkpoints.length - 1; i < len; i++) {
            if (currentCheckpoint.id === panel.checkpoints[i].id) {
                previousCheckpoint = panel.checkpoints[i + 1];
                break;
            }
        }

        if (previousCheckpoint) {
            panel.emit('diff',
                panel.branch.id,
                currentCheckpoint.id,
                panel.branch.id,
                previousCheckpoint.id
            );
        } else {
            log.error(`Trying to view changes in checkpoint: '${currentCheckpoint.id}'. Cannot find previous checkpoint to diff against.`);
        }
    });

    menuCheckpoints.on('open', function (open) {
        if (! currentCheckpoint) return;

        // filter menu options
        if (open) {
            menuCheckpointsRestore.hidden = panel.branch.id !== config.self.branch.id || ! editor.call('permissions:write');
            menuCheckpointsBranch.hidden = ! editor.call('permissions:write');

            // Don't show view changes if this is the last checkpoint in the list
            // because we can't get the previous checkpoint id until the user loads
            // more checkpoints and this also protects us trying to view changes from
            // the first checkpoint in a branch
            var lastPanelCheckpoint = panel.checkpoints[panel.checkpoints.length - 1];
            menuCheckpointsViewChanges.hidden = currentCheckpoint.id === lastPanelCheckpoint.id;
        }

        // when the checkpoints context menu is closed 'unclick' dropdowns
        if (! open) {
            var item = document.getElementById('checkpoint-' + currentCheckpoint.id);
            currentCheckpoint = null;
            if (! item) return;

            var dropdown = item.querySelector('.clicked');
            if (! dropdown) return;

            dropdown.classList.remove('clicked');
            dropdown.innerHTML = '&#57689;';
        }
    });

    panel.on('show', function () {
        toggleTopButtons();

        events.push(editor.on('permissions:writeState', function (writeEnabled) {
            // hide all dropdowns if we no longer have write access
            panel.innerElement.querySelectorAll('.dropdown').forEach(function (dropdown) {
                dropdown.ui.hidden = ! writeEnabled;
            });

            // hide new checkpoint button if we no longer have write access
            toggleTopButtons();
        }));

        events.push(projectUserSettings.on('favoriteBranches:insert', panel.updateFavorite));
        events.push(projectUserSettings.on('favoriteBranches:remove', panel.updateFavorite));

        if (!panelCheckpoints.hidden) {
            // go through all the checkpoint list items and call onAddedToDom() to recalculate
            // whether we need to show read more or not
            var listItems = listCheckpoints.element.querySelectorAll('.checkpoint-widget');
            for (let i = 0, len = listItems.length; i < len; i++) {
                var item = listItems[i].ui;
                item.onAddedToDom();
            }
        }
    });

    // clean up
    panel.on('hide', function () {
        if (currentCheckpointListRequest) {
            currentCheckpointListRequest.abort();
            currentCheckpointListRequest = null;
        }

        // restore state of buttons
        btnLoadMore.disabled = false;
        btnLoadMore.text = 'LOAD MORE';
        listCheckpoints.hidden = false;
        spinner.classList.add('hidden');

        events.forEach(function (evt) {
            evt.unbind();
        });
        events.length = 0;
    });

    // Toggles diff mode for the checkpoint view.
    panel.toggleDiffMode = function (enabled) {
        diffMode = enabled;
        btnFavorite.disabled = enabled;
        btnNewCheckpoint.disabled = enabled;
        btnDiff.disabled = enabled;
    };

    // Return checkpoints container panel
    editor.method('picker:versioncontrol:widget:checkpoints', function () {
        return panel;
    });

    // Creates single widget for a checkpoint useful for other panels
    // that show checkpoints
    editor.method('picker:versioncontrol:widget:checkpoint', createCheckpointWidget);
});
