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
    panelBranchesContainer.resizable = 'right';
    panelBranchesContainer.resizeMin = 280;
    panelBranchesContainer.resizeMax = 400;
    panelBranchesContainer.flex = true;

    // branches top
    var panelBranchesTop = new ui.Panel();
    panelBranchesTop.class.add('branches-top');
    panelBranchesTop.flex = true;
    panelBranchesContainer.append(panelBranchesTop);
    
    // branches main panel
    var panelBranches = new ui.Panel();
    panelBranches.class.add('branches');
    panelBranches.flexGrow = 1;
    panelBranchesContainer.append(panelBranches);

    // branches list
    var listBranches = new ui.List();
    panelBranches.append(listBranches);

    // checkpoints container panel
    var panelCheckpointsContainer = new ui.Panel();
    panelCheckpointsContainer.class.add('checkpoints-container');
    panelCheckpointsContainer.flex = true;
    panelCheckpointsContainer.flexGrow = 1;
    panel.append(panelCheckpointsContainer);

    // checkpoints top
    var panelCheckpointsTop = new ui.Panel();
    panelCheckpointsTop.class.add('checkpoints-top');
    panelCheckpointsContainer.append(panelCheckpointsTop);
    
    // checkpoints main panel
    var panelCheckpoints = new ui.Panel();
    panelCheckpoints.class.add('checkpoints');
    panelCheckpoints.flexGrow = 1;
    panelCheckpointsContainer.append(panelCheckpoints);

    // checkpoints list
    var listCheckpoints = new ui.List();
    panelCheckpoints.append(listCheckpoints);

    // new branch button
    var btnNewBranch = new ui.Button({
        text: 'NEW BRANCH'
    });
    btnNewBranch.flexGrow = 1;
    btnNewBranch.class.add('icon', 'create');
    panelBranchesTop.append(btnNewBranch);

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

    // current branch for which context menu is open
    var currentBranch = null;

    // branches context menu
    var menuBranches = new ui.Menu();

    // checkout branch
    var menuBranchesSwitchTo = new ui.MenuItem({
        text: 'Switch To',
        value: 'switch-branch'
    });
    menuBranchesSwitchTo.on('select', function () {
        if (currentBranch) {
            checkoutBranch(currentBranch);
        }
    });
    menuBranches.append(menuBranchesSwitchTo);

    // merge branch
    var menuBranchesMerge = new ui.MenuItem({
        text: 'Merge',
        value: 'merge-branch'
    });
    menuBranchesMerge.on('select', function () {
        if (currentBranch) {
            mergeBranch(currentBranch);
        }
    });
    menuBranches.append(menuBranchesMerge);

    editor.call('layout.root').append(menuBranches);

    // current checkpoint for which context menu is open
    var currentCheckpoint = null;

    // checkpoints context menu
    var menuCheckpoints = new ui.Menu();

    // restore checkpoint
    var menuCheckpointsRestore = new ui.MenuItem({
        text: 'Restore',
        value: 'restore-checkpoint'
    });
    menuCheckpointsRestore.on('select', function () {
        if (currentCheckpoint) {
            restoreCheckpoint(currentCheckpoint);
        }
    });
    menuCheckpoints.append(menuCheckpointsRestore);

    editor.call('layout.root').append(menuCheckpoints);

    // TODO
    var loadBranches = function (callback) {
        var result = [{
            id: 0,
            name: 'master',
            created: new Date(),
            modified: new Date()
        }];
        for (var i = 1; i < 15; i++) {
            result.push({
                id: i,
                name: 'feature-' + i,
                created: new Date('2017/1/1'),
                modified: new Date('2017/1/1'),
            })
        }
        return callback(result);
    };

    var loadCheckpoints = function (branch, callback) {
        return callback([{
            id: 1,
            created: new Date(),
            user: {
                id: 1,
                fullName: 'Vaios Kalpias'
            },
            description: 'This is the description of the checkpoint'
        }, {
            id: 2,
            created: new Date('2017/1/1'),
            user: {
                id: 2,
                fullName: 'Dave Evans'
            },
            description: 'This is the description of the checkpoint. This is a longer description to see what happens when we need to wrap it or hide part of it...'
        }, {
            id: 3,
            created: new Date(),
            user: {
                id: 1,
                fullName: 'Vaios Kalpias'
            },
            description: 'This is the description of the checkpoint'
        }, {
            id: 4,
            created: new Date('2017/1/1'),
            user: {
                id: 2,
                fullName: 'Dave Evans'
            },
            description: 'This is the description of the checkpoint. This is a longer description to see what happens when we need to wrap it or hide part of it...'
        }, {
            id: 5,
            created: new Date(),
            user: {
                id: 1,
                fullName: 'Vaios Kalpias'
            },
            description: 'This is the description of the checkpoint'
        }, {
            id: 6,
            created: new Date('2017/1/1'),
            user: {
                id: 2,
                fullName: 'Dave Evans'
            },
            description: 'This is the description of the checkpoint. This is a longer description to see what happens when we need to wrap it or hide part of it...'
        }]);
    };

    // Checks out specified branch
    var checkoutBranch = function (branch) {

    };

    // Merges specified branch into current branch
    var mergeBranch = function (branch) {
        editor.call('picker:versioncontrol:mergeBranch', branch);
    };

    // Restore specified checkpoint
    var restoreCheckpoint = function (checkpoint) {
        editor.call('picker:versioncontrol:restoreCheckpoint', checkpoint);
    };

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

        dropdown.on('click', function () {
            dropdown.class.add('clicked');
            dropdown.element.innerHTML = '&#57687;';

            currentBranch = branch;
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

    var createCheckpointListItem = function (checkpoint) {
        var item = new ui.ListItem();
        item.element.id = 'checkpoint-' + checkpoint.id;

        var panel = new ui.Panel();
        item.element.appendChild(panel.element);

        var labelDate = new ui.Label({
            text: editor.call('datetime:convert', checkpoint.created)
        });
        labelDate.class.add('date');
        panel.append(labelDate);

        var labelName = new ui.Label({
            text: 'by ' + checkpoint.user.fullName
        });
        labelName.class.add('full-name');
        panel.append(labelName);

        var labelDesc = new ui.Label({
            text: checkpoint.description
        });
        labelDesc.class.add('desc');
        panel.append(labelDesc);

        // dropdown
        var dropdown = new ui.Button({
            text: '&#57689;'
        });
        dropdown.class.add('dropdown');
        panel.append(dropdown);

        dropdown.on('click', function () {
            currentCheckpoint = checkpoint;

            dropdown.class.add('clicked');
            dropdown.element.innerHTML = '&#57687;';

            menuCheckpoints.open = true;
            var rect = dropdown.element.getBoundingClientRect();
            menuCheckpoints.position(rect.right - menuCheckpoints.innerElement.clientWidth, rect.bottom);
        });


        listCheckpoints.append(item);
    };

    var selectBranch = function (branch) {
        var item = document.getElementById('branch-' + branch.id);
        if (! item || ! item.ui) return;
        listBranches.selected = [item.ui];

        labelBranchHistory.text = "'" + branch.name + "'" + ' history';
        listCheckpoints.clear();
        panelCheckpoints.element.scrollTop = 0;
        loadCheckpoints(branch, function (checkpoints) {
            checkpoints.forEach(createCheckpointListItem);
        });
    };

    // when the branches context menu is closed 'unclick' dropdowns    
    menuBranches.on('open', function (open) {
        if (open || ! currentBranch) return;
        var item = document.getElementById('branch-' + currentBranch.id);
        currentBranch = null;
        if (! item) return;

        var dropdown = item.querySelector('.clicked');
        if (! dropdown) return;

        dropdown.classList.remove('clicked');
        dropdown.innerHTML = '&#57689;';
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

    // on show
    panel.on('show', function () {
        // load and create branches
        loadBranches(function (branches) {
            if (! branches[0]) return;

            branches.forEach(createBranchListItem);
            selectBranch(branches[0]);
        });

        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', false);
    });

    // on hide
    panel.on('hide', function () {
        if (editor.call('viewport:inViewport'))
            editor.emit('viewport:hover', true);
    });

    editor.on('viewport:hover', function(state) {
        if (state && ! panel.hidden) {
            setTimeout(function() {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

});
