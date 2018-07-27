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

    // create vertical borders
    var verticalBorders = [];
    for (var i = 0; i < 2; i++) {
        var border = document.createElement('div');
        border.classList.add('vertical-border');
        border.classList.add('vertical-border-' + i);
        panelRight.append(border);
        verticalBorders.push(border);
    }

    // headers for each branch
    var panelTop = new ui.Panel();
    panelTop.flex = true;
    panelTop.class.add('top');
    panelRight.append(panelTop);

    var panelTopBase = new ui.Panel();
    panelTopBase.class.add('base');
    var label = new ui.Label({
        text: 'BASE'
    });
    label.renderChanges = false;
    panelTopBase.append(label);
    panelTop.append(panelTopBase);

    var panelTopTheirs = new ui.Panel();
    panelTopTheirs.class.add('theirs');
    var labelTopTheirs = new ui.Label({
        text: 'THEIRS'
    });
    label.renderChanges = false;
    panelTopTheirs.append(labelTopTheirs);
    panelTop.append(panelTopTheirs);

    var panelTopMine = new ui.Panel();
    panelTopMine.class.add('mine');
    var labelTopMine = new ui.Label({
        text: 'MINE'
    });
    label.renderChanges = false;
    panelTopMine.append(labelTopMine);
    panelTop.append(panelTopMine);

    // conflict panel
    var panelConflicts = new ui.Panel();
    panelConflicts.class.add('conflicts');
    panelRight.append(panelConflicts);

    // bottom panel with buttons
    var panelBottom = new ui.Panel();
    panelBottom.flex = true;
    panelBottom.class.add('bottom');

    var panelBottomBase = new ui.Panel();
    panelBottomBase.flex = true;
    panelBottomBase.class.add('base');
    panelBottom.append(panelBottomBase);

    var panelBottomTheirs = new ui.Panel();
    panelBottomTheirs.flex = true;
    panelBottomTheirs.class.add('theirs');
    panelBottom.append(panelBottomTheirs);

    var btnPickTheirs = new ui.Button({
        text: 'USE ALL FROM THIS BRANCH'
    });
    panelBottomTheirs.append(btnPickTheirs);
    btnPickTheirs.on('click', function () {
        if (resolver) {
            resolver.resolveUsingSource();
        }
    });

    var panelBottomMine = new ui.Panel();
    panelBottomMine.flex = true;
    panelBottomMine.class.add('mine');
    panelBottom.append(panelBottomMine);

    var btnPickMine = new ui.Button({
        text: 'USE ALL FROM THIS BRANCH'
    });
    panelBottomMine.append(btnPickMine);
    btnPickMine.on('click', function () {
        if (resolver) {
            resolver.resolveUsingDestination();
        }
    });

    panelRight.append(panelBottom);

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
    // the UI to resolve conflicts for an item
    var resolver = null;

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
        currentConflicts = {
            itemId: 565,
            itemType: 'scene',
            itemName: 'Untitled',
            data: [{
                id: 'id 1',
                path: 'name',
                baseValue: 'Untitled',
                srcValue: 'Source Value',
                dstValue: 'Target Value',
                useSrc: false,
                useDst: false
            }, {
                id: 'id 2',
                path: 'entities.28394859-2334-2342-234223422342.name',
                baseValue: 'Box',
                srcValue: 'This is a smaller name',
                dstValue: 'This is quite a larger name and it should wrap properly',
                useSrc: false,
                useDst: false
            }, {
                id: 'id 3',
                path: 'entities.28394859-2334-2342-234223422342.position',
                baseValue: [0, 1, 0],
                srcValue: [1, 1, 1],
                dstValue: [2, 3, 4],
                useSrc: false,
                useDst: false
            }, {
                id: 'id 4',
                path: 'entities.28394859-2334-2345-234223422342.tags',
                baseValue: ['tag 1', 'tag 2', 'tag 3'],
                srcValue: ['tag 1', 'tag 2', 'tag 3', 'tag 4', 'tag 5', 'tag 6'],
                dstValue: ['tag 1', 'tag 2'],
                useSrc: false,
                useDst: false
            }, {
                id: 'id 5',
                path: 'entities.28394852-2334-2345-234223422342.tags',
                baseValue: ['tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1 tag 1', 'tag 2', 'tag 3', 'tag 4', 'tag 5', 'tag 6', 'tag 7', 'tag 8', 'tag 9', 'tag 10', 'tag 11'],
                srcValue: ['tag 1 tag 1 tag 1 tag 1 tag 1 tag 1', 'tag 2', 'tag 3', 'tag 4', 'tag 5', 'tag 6'],
                dstValue: ['tag 1', 'tag 2'],
                useSrc: false,
                useDst: false
            }, {
                id: 'id 6',
                path: 'entities.28394852-2334-2345-234223422342.name',
                baseValue: 'Box',
                srcValue: 'Box Source',
                dstValue: 'Box Dest',
                useSrc: false,
                useDst: false
            }]
        };

        // debug data
        resolver = editor.call('picker:conflictManager:showSceneConflicts', panelConflicts, currentConflicts);

        // if a scrollbar was rendered then adjust the vertical borders
        // var scrollBarWidth = panelConflicts.element.offsetWidth - panelConflicts.element.clientWidth;
        // for (var i = 0; i < verticalBorders.length; i++) {
        //     verticalBorders[i].style.left = (i+1) * (panelConflicts.element.clientWidth / 3) + 'px';
        // }
    };

    var showMainProgress = function (icon, text) {
        [spinnerIcon, completedIcon, errorIcon].forEach(function (i) {
            if (icon === i) {
                i.classList.remove('hidden');
            } else {
                i.classList.add('hidden');
            }
        });

        for (var i = 0; i < verticalBorders.length; i++) {
            verticalBorders[i].classList.add('hidden');
        }

        labelMainProgress.hidden = false;
        labelMainProgress.text = text;

        panelTop.hidden = true;
        panelConflicts.hidden = true;
        panelBottom.hidden = true;
    };

    var hideMainProgress = function () {
        spinnerIcon.classList.add('hidden');
        completedIcon.classList.add('hidden');
        errorIcon.classList.add('hidden');
        labelMainProgress.hidden = true;

        for (var i = 0; i < verticalBorders.length; i++) {
            verticalBorders[i].classList.remove('hidden');
        }

        panelTop.hidden = false;
        panelConflicts.hidden = false;
        panelBottom.hidden = false;
    };

    // // Complete merge button click
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

        labelTopTheirs.text = data.sourceBranchName;
        labelTopMine.text = data.destinationBranchName;

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

        if (resolver) {
            resolver.destroy();
            resolver = null;
        }

        // editor-blocking picker closed
        editor.emit('picker:close', 'conflict-manager');
    });

    // show conflict manager
    editor.method('picker:conflictManager', function (data) {
        mergeData = data;
        overlay.hidden = false;
    });
});
