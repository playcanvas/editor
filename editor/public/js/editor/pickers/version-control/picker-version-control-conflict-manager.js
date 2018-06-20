editor.once('load', function () {
    'use strict';

    // overlay
    var root = editor.call('layout.root');
    var overlay = new ui.Overlay();
    overlay.hidden = true;
    overlay.class.add('picker-conflict-manager');
    root.append(overlay);

    // main panel
    var panel = new ui.Panel('CONFLICT MANAGER');
    panel.flex = true;
    overlay.append(panel);

    // left panel
    var panelLeft = new ui.Panel();
    panelLeft.flex = true;
    panelLeft.class.add('left');
    panel.append(panelLeft);

    // list of conflicted items
    var listItems = new ui.List();
    listItems.flexGrow = 1;
    panelLeft.append(listItems);

    // complete merge button
    var btnComplete = new ui.Button({
        text: 'COMPLETE MERGE'
    });
    btnComplete.disabled = true;
    panelLeft.append(btnComplete);

    // right panel
    var panelRight = new ui.Panel();
    panelRight.class.add('right');
    panelRight.flex = true;
    panelRight.flexGrow = 1;
    panel.append(panelRight);

    // // panel for file diffs
    // var panelFiles = new ui.Panel();
    // panelFiles.class.add('file-diffs');
    // panelFiles.flex = true;
    // panelRight.append(panelFiles);

    // // 'mine' file panel
    // var panelMineFile = new ui.Panel();
    // panelMineFile.flexGrow = 1;
    // panelMineFile.class.add('file');
    // panelFiles.append(panelMineFile);

    // // 'theirs' file panel
    // var panelTheirsFile = new ui.Panel();
    // panelTheirsFile.flexGrow = 1;
    // panelTheirsFile.class.add('file');
    // panelFiles.append(panelTheirsFile);

    // panel for data diffs
    var panelDiffs = new ui.Panel('MERGE CONFLICTS');
    panelDiffs.class.add('diffs');
    panelDiffs.flex = true;
    panelRight.append(panelDiffs);

    // 'mine' diffs panel
    var panelMineDiffs = new ui.Panel();
    panelDiffs.append(panelMineDiffs);

    // 'theirs' diffs panel
    var panelTheirsDiffs = new ui.Panel();
    panelDiffs.append(panelTheirsDiffs);

    // panel for picking mine or theirs
    var panelPick = new ui.Panel();
    panelPick.flex = true;
    panelPick.class.add('pick');
    panelRight.append(panelPick);

    // pick 'mine' panel
    var panelMinePick = new ui.Panel();
    panelMinePick.flex = true;
    panelPick.append(panelMinePick);

    // download 'mine' raw button
    var btnDownloadMine = new ui.Button({
        text: 'DOWNLOAD RAW'
    });
    btnDownloadMine.flexGrow = 1;
    panelMinePick.append(btnDownloadMine);

    // pick button
    var btnPickMine = new ui.Button({
        text: 'USE MINE'
    });
    btnPickMine.flexGrow = 10;
    panelMinePick.append(btnPickMine);

    // pick 'theirs' panel
    var panelTheirsPick = new ui.Panel();
    panelTheirsPick.flex = true;
    panelPick.append(panelTheirsPick);

    // download 'theirs' raw button
    var btnDownloadTheirs = new ui.Button({
        text: 'DOWNLOAD RAW'
    });
    btnDownloadTheirs.flexGrow = 1;
    panelTheirsPick.append(btnDownloadTheirs);

    // pick button
    var btnPickTheirs = new ui.Button({
        text: 'USE THEIRS'
    });
    btnPickTheirs.flexGrow = 10;
    panelTheirsPick.append(btnPickTheirs);

    // selected overlay
    var overlaySelected = document.createElement('div');
    overlaySelected.classList.add('selected-overlay', 'hidden');
    panelRight.append(overlaySelected);

    // the current conflict we are editing
    var currentConflict = null;
    // the merge data that we requested from the server
    var mergeData = null;

    // debug data
    mergeData = [{
        id: '1',
        type: 'texture',
        name: 'some texture',
        conflicts: [{
            name: 'name',
            mine: 'my texture',
            theirs: 'their texture'
        }, {
            name: 'path',
            mine: [1, 2, 3],
            theirs: [1]
        }],
    }, {
        id: '2',
        type: 'model',
        name: 'some model',
        conflicts: [{
            name: 'file.size',
            mine: 500,
            theirs: 600
        }, {
            name: 'file.hash',
            mine: 'sjdsdsjsdjfl23423432',
            theirs: 'sgdbdsjsdjfl23423432',
        }, {
            name: 'name',
            mine: 'my scene',
            theirs: 'their scene'
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }]
    }, {
        id: '3',
        type: 'scene',
        name: 'scene 1',
        conflicts: [{
            name: 'name',
            mine: 'my scene',
            theirs: 'their scene'
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }, {
            name: 'entities.34322526-1ac8-11e7-b461-784f436c1506.position',
            mine: [0, 0, 0],
            theirs: [1, 0, 0]
        }]
    }, {
        id: 'project_437',
        type: 'settings',
        name: 'project settings',
        conflicts: [{
            name: 'width',
            mine: 1280,
            theirs: 720
        }]
    }];



    // Enable / Disable the file conflict views for 'mine' and 'theirs'
    // var toggleFilePanels = function (enabled) {
    //     if (enabled) {
    //         // show file panels and make diffs half height
    //         // panelFiles.hidden = false;
    //         panelDiffs.class.remove('full-height');
    //     } else {
    //         // hide file panels and make diffs full height
    //         // panelFiles.hidden = true;
    //         panelDiffs.class.add('full-height');
    //     }
    // };

    var createLeftListItem = function (data) {
        var item = new ui.ListItem();

        // add some links between the item and the data
        item.conflict = data;
        data.listItem = item;

        var panel = new ui.Panel();
        item.element.appendChild(panel.element);

        // icon
        var labelIcon = new ui.Label({
            text: '&#58208;',
            unsafe: true
        });
        labelIcon.class.add('icon', 'conflict');
        panel.append(labelIcon);
        item.icon = labelIcon;

        var panelInfo = new ui.Panel();
        panel.append(panelInfo);

        // name
        var labelName = new ui.Label({
            text: data.name
        });
        labelName.class.add('name');
        panelInfo.append(labelName);

        // type
        var labelType = new ui.Label({
            text: data.type
        });
        labelType.class.add('type');
        panelInfo.append(labelType);

        listItems.append(item);

        item.on('select', function () {
            showConflicts(data);
        });

        return item;
    };

    var showConflicts = function (data) {
        currentConflict = data;
        switch (data.type) {
            case 'scene':
                showSceneConflicts(data);
                break;
            case 'settings':
                showSettingsConflicts(data);
                break;
            default:
                showAssetConflicts(data);
                break;
        }
    };


    var showSceneConflicts = function (data) {
        // toggleFilePanels(false);
        showDataConflicts(data);
    };

    var showSettingsConflicts = function (data) {
        // toggleFilePanels(false);
        showDataConflicts(data);
    };

    var showAssetConflicts = function (data) {
        // toggleFilePanels(true);
        showDataConflicts(data);
    };

    var showDataConflicts = function (data) {
        panelMineDiffs.clear();
        panelMineDiffs.style.marginRight = 0;
        panelTheirsDiffs.clear();

        if (data.resolved) {
            showPickOverlay(data.resolved);
        } else {
            hidePickOverlay();
        }

        for (var i = 0; i < data.conflicts.length; i++) {
            var conflict = data.conflicts[i];
            addConflictField(conflict.name, conflict.mine, panelMineDiffs);
            addConflictField(conflict.name, conflict.theirs, panelTheirsDiffs);
        }


        // adjust margin of the left diffs panel to account for the width of the scrollbar (if any)
        var scrollBarWidth = panelDiffs.element.clientWidth - panelMineDiffs.innerElement.clientWidth - panelTheirsDiffs.innerElement.clientWidth;
        panelMineDiffs.style.marginRight = scrollBarWidth + 'px';
    }

    // Add a conflicted field to a panel (either mine or theirs)
    var addConflictField = function (name, value, panel) {
        var panelEntry = new ui.Panel();

        var labelName = new ui.Label({
            text: name
        });
        labelName.class.add('name');
        panelEntry.append(labelName);

        var labelValue = new ui.Label({
            text: value
        });
        labelValue.class.add('value');
        panelEntry.append(labelValue);

        panel.append(panelEntry);
    };

    var pickNone = function () {
        if (currentConflict) {
            currentConflict.resolved = null;
            markUnresolved(currentConflict);
        }

        hidePickOverlay();
    };

    var pickMine = function () {
        currentConflict.resolved = 'mine';
        showPickOverlay('mine');
        markResolved(currentConflict);
    };

    var pickTheirs = function () {
        currentConflict.resolved = 'theirs';
        showPickOverlay('theirs');
        markResolved(currentConflict);
    };

    var markResolved = function (conflict) {
        conflict.listItem.icon.class.remove('conflict');
        conflict.listItem.icon.class.add('resolved');
    };

    var markUnresolved = function (conflict) {
        conflict.listItem.icon.class.add('conflict');
        conflict.listItem.icon.class.remove('resolved');
    };

    var checkAllResolved = function () {
        var result = true;

        for (var i = 0; i < mergeData.length; i++) {
            if (! mergeData[i].resolved) {
                return false;
            }
        }

        return result;
    };

    var showPickOverlay = function (cls) {
        overlaySelected.classList.remove('hidden');
        overlaySelected.classList.remove('theirs');
        overlaySelected.classList.remove('mine');
        overlaySelected.classList.add(cls);
    };

    var hidePickOverlay = function () {
        overlaySelected.classList.add('hidden');
        overlaySelected.classList.remove('theirs');
    };

    btnPickMine.on('click', function () {
        if (overlaySelected.classList.contains('theirs') || overlaySelected.classList.contains('hidden')) {
            pickMine();
        } else {
            pickNone();
        }
    });

    btnPickTheirs.on('click', function () {
        if (! overlaySelected.classList.contains('theirs') || overlaySelected.classList.contains('hidden')) {
            pickTheirs();
        } else {
            pickNone();
        }
    });


    // show data
    overlay.on('show', function () {
        for (var i = 0; i < mergeData.length; i++) {
            var item = createLeftListItem(mergeData[i]);
            if (i === 0) {
                item.selected = true;
            }
        }
    });

    // clean up
    overlay.on('hide', function () {
        listItems.clear();
        panelMineDiffs.clear();
        panelTheirsDiffs.clear();
    });

    // show conflict manager
    editor.method('picker:conflictManager', function () {
        overlay.hidden = false;
    });

});
