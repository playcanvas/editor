editor.once('load', function () {
    'use strict';

    var hasBranchesFlag = editor.call('users:hasFlag', 'hasBranches');

    var events = [];

    var panel = new ui.Panel();
    panel.class.add('checkpoints-container');

    // checkpoints top
    var panelCheckpointsTop = new ui.Panel();
    panelCheckpointsTop.class.add('checkpoints-top');
    panel.append(panelCheckpointsTop);

    // current branch history
    var labelBranchHistory = new ui.Label();
    labelBranchHistory.renderChanges = false;
    labelBranchHistory.class.add('branch-history', 'selectable');
    panelCheckpointsTop.append(labelBranchHistory);

    // new checkpoint button
    var btnNewCheckpoint = new ui.Button({
        text: 'NEW CHECKPOINT'
    });
    btnNewCheckpoint.class.add('icon', 'create');
    panelCheckpointsTop.append(btnNewCheckpoint);

    var toggleNewCheckpointButton = function () {
        btnNewCheckpoint.hidden = ! editor.call('permissions:write') || ! panel.branch || panel.branch.id !== config.self.branch.id;
    };

    toggleNewCheckpointButton();

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

    // checkpoints for which context menu is currenty open
    var currentCheckpoint = null;

    var currentCheckpointListRequest = null;
    var checkpointsSkip = null;

    // checkpoints context menu
    var menuCheckpoints = new ui.Menu();
    menuCheckpoints.class.add('version-control');

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

        panel.branch = branch;
        if (branch) {
            if (hasBranchesFlag) {
                var name = branch.name.length > 25 ? branch.name.substring(0, 22) + '...' : branch.name;
                labelBranchHistory.text = "'" + name + "' checkpoints";
            } else {
                labelBranchHistory.text = 'checkpoints';
            }
        } else {
            labelBranchHistory.text = '';
        }
        panel.setCheckpoints(null);
        panel.toggleLoadMore(false);

        toggleNewCheckpointButton();
    };

    // Set the checkpoints to be displayed
    panel.setCheckpoints = function (checkpoints) {
        listCheckpoints.clear();
        panelCheckpoints.element.scrollTop = 0;
        lastCheckpointDateDisplayed = null;

        panel.checkpoints = checkpoints;
        if (checkpoints && checkpoints.length) {
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
            btnLoadMore.disabled = false;
            btnLoadMore.text = 'LOAD MORE';

            // show list of checkpoints and hide spinner
            listCheckpoints.hidden = false;
            spinner.classList.add('hidden');

            if (request !== currentCheckpointListRequest || panel.hidden || panel.parent.hidden) {
                return;
            }

            currentCheckpointListRequest = null;

            if (err) {
                return console.error(err);
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
        var panel = new ui.Panel();
        panel.class.add('checkpoint-widget');
        panel.flex = true;

        var imgUser = new Image();
        imgUser.src = '/api/users/' + checkpoint.user.id + '/thumbnail?size=28';
        imgUser.classList.add('noSelect');
        panel.append(imgUser);

        var panelInfo = new ui.Panel();
        panelInfo.class.add('info');
        panelInfo.flex = true;
        panel.append(panelInfo);

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

        var labelId = new ui.Label({
            text: checkpoint.id.substring(0, 7)
        });
        labelId.class.add('id', 'selectable');
        panelBottomRow.append(labelId);

        var labelInfo = new ui.Label({
            text: 'created by ' + (checkpoint.user.fullName || 'missing') + ', ' + editor.call('datetime:convert', checkpoint.createdAt)
        });
        labelInfo.class.add('info', 'selectable');
        panelBottomRow.append(labelInfo);


        // hide more button if necessary - do this here because the element
        // must exist in the DOM before scrollWidth / clientWidth are available,
        // Users of this widget need to call this function once the panel has been added to the DOM
        panel.onAddedToDom = function () {
            btnMore.hidden = labelDesc.element.scrollWidth <= labelDesc.element.clientWidth && newLineIndex < 0;
        };

        return panel;
    };

    var createCheckpointListItem = function (checkpoint) {
        // add current date if necessary
        var date = (new Date(checkpoint.createdAt)).toDateString();
        if (lastCheckpointDateDisplayed !== date) {
            lastCheckpointDateDisplayed = date;

            var dateHeader = document.createElement('div');
            dateHeader.classList.add('date');
            dateHeader.classList.add('selectable');
            if (lastCheckpointDateDisplayed === (new Date()).toDateString()) {
                dateHeader.textContent = 'Today';
            } else {
                var parts = lastCheckpointDateDisplayed.split(' ');
                dateHeader.textContent = parts[0] + ', ' + parts[1] + ' ' + parts[2] + ', ' + parts[3];
            }
            listCheckpoints.innerElement.appendChild(dateHeader);
        }

        var item = new ui.ListItem();
        item.element.id = 'checkpoint-' + checkpoint.id;

        var panel = createCheckpointWidget(checkpoint);
        item.element.appendChild(panel.element);

        // dropdown
        var dropdown = new ui.Button({
            text: '&#57689;'
        });
        dropdown.class.add('dropdown');
        panel.append(dropdown);

        if (! editor.call('permissions:write')) {
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

        listCheckpoints.append(item);

        panel.onAddedToDom();
    };

    // show create checkpoint panel
    btnNewCheckpoint.on('click', function () {
        panel.emit('checkpoint:new');
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

    menuCheckpoints.on('open', function (open) {
        if (! currentCheckpoint) return;

        // filter menu options
        if (open) {
            menuCheckpointsRestore.hidden = panel.branch.id !== config.self.branch.id || ! editor.call('permissions:write');
            menuCheckpointsBranch.hidden = ! editor.call('users:hasFlag', 'hasBranches') || ! editor.call('permissions:write');
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
        toggleNewCheckpointButton();

        events.push(editor.on('permissions:writeState', function (writeEnabled) {
            // hide all dropdowns if we no longer have write access
            panel.innerElement.querySelectorAll('.dropdown').forEach(function (dropdown) {
                dropdown.ui.hidden = ! writeEnabled;
            });

            // hide new checkpoint button if we no longer have write access
            toggleNewCheckpointButton();
        }));
    });

    // clean up
    panel.on('hide', function () {
        events.forEach(function (evt) {
            evt.unbind();
        });
        events.length = 0;
    });

    // Return checkpoints container panel
    editor.method('picker:versioncontrol:widget:checkpoints', function () {
        return panel;
    });

    // Creates single widget for a checkpoint useful for other panels
    // that show checkpoints
    editor.method('picker:versioncontrol:widget:checkpoint', createCheckpointWidget);
});
