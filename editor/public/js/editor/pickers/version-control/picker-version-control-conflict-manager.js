editor.once('load', function () {
    'use strict';

    // overlay
    var root = editor.call('layout.root');
    var overlay = new ui.Overlay();
    overlay.clickable = false;
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

    // main progress text
    var labelMainProgress = new ui.Label();
    labelMainProgress.class.add('progress-text');
    labelMainProgress.renderChanges = false;
    labelMainProgress.hidden = true;
    panelRight.append(labelMainProgress);

    // main progress icon
    var spinnerIcon = editor.call('picker:versioncontrol:svg:spinner', 64);
    spinnerIcon.classList.add('progress-icon');
    spinnerIcon.classList.add('hidden');
    spinnerIcon.classList.add('spin');
    var completedIcon = editor.call('picker:versioncontrol:svg:completed', 64);
    completedIcon.classList.add('progress-icon');
    completedIcon.classList.add('hidden');
    var errorIcon = editor.call('picker:versioncontrol:svg:error', 64);
    errorIcon.classList.add('progress-icon');
    errorIcon.classList.add('hidden');
    panelRight.innerElement.appendChild(spinnerIcon);
    panelRight.innerElement.appendChild(completedIcon);
    panelRight.innerElement.appendChild(errorIcon);

    // panel for data diffs
    var panelDiffs = new ui.Panel('MERGE CONFLICTS');
    panelDiffs.class.add('diffs');
    panelDiffs.flex = true;
    panelRight.append(panelDiffs);

    // 'mine' diffs panel
    var panelMineDiffs = new ui.Panel();
    panelDiffs.append(panelMineDiffs);

    // 'mine' object icon
    var iconMine = new ui.Label();
    iconMine.class.add('icon-type');
    panelMineDiffs.append(iconMine);

    // 'mine' object name
    var labelMine = new ui.Label();
    labelMine.renderChanges = false;
    labelMine.class.add('name');
    panelMineDiffs.append(labelMine);

    // 'theirs' diffs panel
    var panelTheirsDiffs = new ui.Panel();
    panelDiffs.append(panelTheirsDiffs);

    // 'theirs' object icon
    var iconTheirs = new ui.Label();
    iconTheirs.class.add('icon-type');
    panelTheirsDiffs.append(iconTheirs);

    // 'theirs' object name
    var labelTheirs = new ui.Label();
    labelTheirs.renderChanges = false;
    labelTheirs.class.add('name');
    panelTheirsDiffs.append(labelTheirs);


    // panel for picking mine or theirs
    var panelPick = new ui.Panel();
    panelPick.flex = true;
    panelPick.class.add('pick');
    panelRight.append(panelPick);

    // pick 'mine' panel
    var panelMinePick = new ui.Panel();
    panelMinePick.flex = true;
    panelPick.append(panelMinePick);

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

    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', function () {
        editor.call('picker:confirm', 'Closing the conflict manager will stop the merge. Are you sure?', function () {
            showMainProgress(spinnerIcon, 'Stopping merge');
            editor.call('branches:forceStopMerge', config.self.branch.merge.id, function (err) {
                if (err) {
                    showMainProgress(errorIcon, err);
                } else {
                    showMainProgress(completedIcon, 'Merge stopped. Refreshing browser');
                    setTimeout(function () {
                        window.location.reload();
                    }, 1000);
                }
            });
        });
    });
    panel.headerElement.appendChild(btnClose.element);

    // the current conflict we are editing
    var currentConflicts = null;
    // the merge data that we requested from the server
    var mergeData = null;

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
        labelIcon.class.add('icon');
        labelIcon.class.add(isConflictGroupResolved(data) ? 'resolved' : 'conflict');

        panel.append(labelIcon);
        item.icon = labelIcon;

        var panelInfo = new ui.Panel();
        panel.append(panelInfo);

        // name
        var labelName = new ui.Label({
            text: data.itemName
        });
        labelName.class.add('name');
        panelInfo.append(labelName);

        // type
        var labelType = new ui.Label({
            text: data.assetType || data.itemType
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
        currentConflicts = data;
        // panelMineDiffs.style.marginRight = 0;

        // show icon
        iconMine.element.classList = 'ui-label icon-type';
        iconMine.class.add('type-' + (data.assetType || data.itemType));
        iconTheirs.element.classList = 'ui-label icon-type';
        iconTheirs.class.add('type-' + (data.assetType || data.itemType));

        // show object name
        labelMine.text = data.itemName;
        labelTheirs.text = data.itemName;

        if (isConflictGroupResolved(data)) {
            showPickOverlay(data.data[0].useDst ? 'mine' : 'theirs'); // for now just use the resolve field of the first item
        } else {
            hidePickOverlay();
        }

        // for (var i = 0; i < data.conflicts.length; i++) {
        //     var conflict = data.conflicts[i];
        //     addConflictField(conflict.name, conflict.mine, panelMineDiffs);
        //     addConflictField(conflict.name, conflict.theirs, panelTheirsDiffs);
        // }


        // adjust margin of the left diffs panel to account for the width of the scrollbar (if any)
        // var scrollBarWidth = panelDiffs.element.clientWidth - panelMineDiffs.innerElement.clientWidth - panelTheirsDiffs.innerElement.clientWidth;
        // panelMineDiffs.style.marginRight = scrollBarWidth + 'px';
    };

    // // Add a conflicted field to a panel (either mine or theirs)
    // var addConflictField = function (name, value, panel) {
    //     var panelEntry = new ui.Panel();

    //     var labelName = new ui.Label({
    //         text: name
    //     });
    //     labelName.class.add('name');
    //     panelEntry.append(labelName);

    //     var labelValue = new ui.Label({
    //         text: value
    //     });
    //     labelValue.class.add('value');
    //     panelEntry.append(labelValue);

    //     panel.append(panelEntry);
    // };

    var markResolved = function (mine) {
        showPickOverlay(mine ? 'mine' : 'theirs');

        currentConflicts.data.forEach(function (conflict) {
            conflict[mine ? 'useDst' : 'useSrc'] = true;
        });
        currentConflicts.listItem.icon.class.remove('conflict');
        currentConflicts.listItem.icon.class.add('resolved');
        btnComplete.disabled = ! checkAllResolved();

        var resolveData = {};
        resolveData[mine ? 'useDst' : 'useSrc'] = true;
        editor.call('branches:resolveConflicts',
            mergeData.id,
            currentConflicts.data.map(function (conflict) {
                return conflict.id;
            }),
            resolveData
        );
    };

    var markUnresolved = function () {
        hidePickOverlay();
        btnComplete.disabled = true;

        if (! currentConflicts) return;

        currentConflicts.data.forEach(function (conflict) {
            conflict.useSrc = false;
            conflict.useDst = false;
            conflict.useMergedFile = false;
        });
        currentConflicts.listItem.icon.class.add('conflict');
        currentConflicts.listItem.icon.class.remove('resolved');

        editor.call('branches:resolveConflicts',
            mergeData.id,
            currentConflicts.data.map(function (conflict) {
                return conflict.id;
            }), {
                revert: true
            }
        );
    };

    var isConflictGroupResolved = function (group) {
        var resolved = true;
        for (var i = 0; i < group.data.length; i++) {
            if (! group.data[i].useSrc && ! group.data[i].useDst && ! group.data[i].useMergedFile) {
                resolved = false;
                break;
            }
        }
        return resolved;
    };

    var checkAllResolved = function () {
        var result = true;

        for (var i = 0; i < mergeData.conflicts.length; i++) {
            if (! isConflictGroupResolved(mergeData.conflicts[i])) {
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

    var showMainProgress = function (icon, text) {
        [spinnerIcon, completedIcon, errorIcon].forEach(function (i) {
            if (icon === i) {
                i.classList.remove('hidden');
            } else {
                i.classList.add('hidden');
            }
        });

        labelMainProgress.hidden = false;
        labelMainProgress.text = text;

        panelDiffs.hidden = true;
        panelPick.hidden = true;
        overlaySelected.classList.add('hidden');
    };

    var hideMainProgress = function () {
        spinnerIcon.classList.add('hidden');
        completedIcon.classList.add('hidden');
        errorIcon.classList.add('hidden');
        labelMainProgress.hidden = true;

        panelDiffs.hidden = false;
        panelPick.hidden = false;
    };

    // Pick mine click handler
    btnPickMine.on('click', function () {
        if (overlaySelected.classList.contains('theirs') || overlaySelected.classList.contains('hidden')) {
            markResolved(true);
        } else {
            markUnresolved();
        }
    });

    // Pick theirs click handler
    btnPickTheirs.on('click', function () {
        if (! overlaySelected.classList.contains('theirs') || overlaySelected.classList.contains('hidden')) {
            markResolved(false);
        } else {
            markUnresolved();
        }
    });

    // Complete merge button click
    btnComplete.on('click', function () {
        listItems.selected = [];
        btnComplete.disabled = true;
        showMainProgress(spinnerIcon, 'Completing merge...');
        editor.call('branches:applyMerge', mergeData.id, function (err) {
            if (err) {
                // if there was an error show it in the UI and then go back to the conflicts
                showMainProgress(errorIcon, err);
                setTimeout(function () {
                    hideMainProgress();
                    btnComplete.disabled = false;
                    listItems.innerElement.firstChild.ui.selected = true;
                }, 1000);
            } else {
                // if no error then refresh the browser
                showMainProgress(completedIcon, 'Merge complete - refreshing browser...');
                setTimeout(function () {
                    window.location.reload();
                }, 1000);
            }
        });
    });

    var onMergeDataLoaded = function (data) {
        mergeData = data;
        panelMineDiffs.header = data.destinationBranchName;
        panelTheirsDiffs.header = data.sourceBranchName;
        if (! mergeData.conflicts.length) {
            btnComplete.disabled = false;
            return showMainProgress(completedIcon, 'No conflicts found - Click Complete Merge');
        }

        hideMainProgress();

        for (var i = 0; i < mergeData.conflicts.length; i++) {
            var item = createLeftListItem(mergeData.conflicts[i]);
            if (i === 0) {
                item.selected = true;
            }
        }

        btnComplete.disabled = ! checkAllResolved();
    };

    // load and show data
    overlay.on('show', function () {
        // editor-blocking picker opened
        editor.emit('picker:open', 'conflict-manager');

        showMainProgress(spinnerIcon, 'Loading conflicts...');

        if (! mergeData) {
            editor.call('branches:getMerge', config.self.branch.merge.id, function (err, data) {
                if (err) {
                    return showMainProgress(errorIcon, err);
                }

                onMergeDataLoaded(data);
            });
        } else {
            onMergeDataLoaded(mergeData);
        }
    });

    // clean up
    overlay.on('hide', function () {
        mergeData = null;
        listItems.clear();
        panelMineDiffs.clear();
        panelTheirsDiffs.clear();

        // editor-blocking picker closed
        editor.emit('picker:close', 'conflict-manager');
    });

    // show conflict manager
    editor.method('picker:conflictManager', function (data) {
        mergeData = data;
        overlay.hidden = false;
    });
});
