editor.once('load', function () {
    'use strict';

    var panel = new ui.Panel();
    panel.class.add('checkpoints-container');

    // checkpoints top
    var panelCheckpointsTop = new ui.Panel();
    panelCheckpointsTop.class.add('checkpoints-top');
    panelCheckpointsTop.flexGrow = 1;
    panel.append(panelCheckpointsTop);

    // current branch history
    var labelBranchHistory = new ui.Label();
    labelBranchHistory.renderChanges = false;
    labelBranchHistory.class.add('branch-history');
    panelCheckpointsTop.append(labelBranchHistory);

    // new checkpoint button
    var btnNewCheckpoint = new ui.Button({
        text: 'NEW CHECKPOINT'
    });
    btnNewCheckpoint.class.add('icon', 'create');
    panelCheckpointsTop.append(btnNewCheckpoint);

    // checkpoints main panel
    var panelCheckpoints = new ui.Panel();
    panelCheckpoints.class.add('checkpoints');
    panelCheckpoints.flexGrow = 1;
    panel.append(panelCheckpoints);

    // checkpoints list
    var listCheckpoints = new ui.List();
    panelCheckpoints.append(listCheckpoints);

    // checkpoints for which context menu is currenty open
    var currentCheckpoint = null;

    // checkpoints context menu
    var menuCheckpoints = new ui.Menu();

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

    // functions
    panel.setBranch = function (branch) {
        labelBranchHistory.text = "'" + branch.name + "'" + ' checkpoints';
        listCheckpoints.clear();
        panelCheckpoints.element.scrollTop = 0;
        panel.branch = branch;
    };

    panel.setCheckpoints = function (checkpoints) {
        checkpoints.forEach(createCheckpointListItem);
    };

    var createCheckpointListItem = function (checkpoint) {
        var item = new ui.ListItem();
        item.element.id = 'checkpoint-' + checkpoint.id;

        var panel = new ui.Panel();
        panel.flex = true;
        item.element.appendChild(panel.element);

        var imgUser = new Image();
        imgUser.src = '/api/users/' + checkpoint.user.id + '/thumbnail?size=28';
        panel.append(imgUser);

        var panelInfo = new ui.Panel();
        panelInfo.class.add('info');
        panelInfo.flex = true;
        panel.append(panelInfo);

        var panelTopRow = new ui.Panel();
        panelTopRow.flexGrow = 1;
        panelTopRow.class.add('top-row');
        panelInfo.append(panelTopRow);

        var labelDesc = new ui.Label({
            text: checkpoint.description
        });
        labelDesc.class.add('desc');
        panelTopRow.append(labelDesc);

        var btnMore = new ui.Button({
            text: '...read more'
        });
        btnMore.on('click', function () {
            if (labelDesc.class.contains('more')) {
                labelDesc.class.remove('more');
                btnMore.text = '...read more';
            } else {
                labelDesc.class.add('more');
                btnMore.text = '...read less';
            }
        });
        panelTopRow.append(btnMore);

        var panelBottomRow = new ui.Panel();
        panelBottomRow.flexGrow = 1;
        panelBottomRow.class.add('bottom-row');
        panelInfo.append(panelBottomRow)

        var labelId = new ui.Label({
            text: checkpoint.id.substring(0, 7)
        });
        labelId.class.add('id');
        panelBottomRow.append(labelId);

        var labelInfo = new ui.Label({
            text: 'created by ' + checkpoint.user.fullName + ', ' + editor.call('datetime:convert', checkpoint.created)
        });
        labelInfo.class.add('info');
        panelBottomRow.append(labelInfo);

        // dropdown
        var dropdown = new ui.Button({
            text: '&#57689;'
        });
        dropdown.class.add('dropdown');
        panel.append(dropdown);

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

        // hide more button if necessary - do this here because the element
        // must exist in the DOM before scrollWidth / clientWidth are available
        btnMore.hidden = labelDesc.element.scrollWidth <= labelDesc.element.clientWidth;
    };

    // show create checkpoint panel
    btnNewCheckpoint.on('click', function () {
        panel.emit('checkpoint:new');
    });

    // restore checkpoint
    menuCheckpointsRestore.on('select', function () {
        panel.emit('checkpoint:restore', currentCheckpoint);
    });

    // branch from checkpoint
    menuCheckpointsBranch.on('select', function () {
        panel.emit('checkpoint:branch', currentCheckpoint);
    });

    // when the checkpoints context menu is closed 'unclick' dropdowns
    menuCheckpoints.on('open', function (open) {
        if (open || ! currentCheckpoint) return;
        var item = document.getElementById('checkpoint-' + currentCheckpoint.id);
        currentCheckpoint = null;
        if (! item) return;

        var dropdown = item.querySelector('.clicked');
        if (! dropdown) return;

        dropdown.classList.remove('clicked');
        dropdown.innerHTML = '&#57689;';
    });

    // Return checkpoints container panel
    editor.method('picker:versioncontrol:widget:checkpoints', function () {
        return panel;
    });
});
