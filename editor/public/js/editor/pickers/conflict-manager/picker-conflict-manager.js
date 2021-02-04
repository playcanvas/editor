editor.once('load', function () {
    'use strict';

    var LAYOUT_NONE = 0;
    var LAYOUT_FIELDS_ONLY = 1;
    var LAYOUT_FIELDS_AND_FILE_CONFLICTS = 2;
    var LAYOUT_FILE_CONFLICTS_ONLY = 3;

    var layoutMode = LAYOUT_NONE;

    // if true then we are showing a diff instead of a merge
    var diffMode = false;

    var evtMessengerMergeComplete = null;
    var evtMessengerMergeProgress = null;

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

    // review merge button
    var btnReview = new ui.Button({
        text: 'REVIEW MERGE'
    });
    btnReview.disabled = true;
    panelLeft.append(btnReview);

    // complete merge button
    var btnComplete = new ui.Button({
        text: 'COMPLETE MERGE'
    });
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

    // main progress icons
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

    var panelDest = new ui.Panel();
    panelDest.class.add('mine');
    var labelTopMine = new ui.Label({
        text: 'DEST'
    });
    labelTopMine.renderChanges = false;
    panelDest.append(labelTopMine);
    panelTop.append(panelDest);

    var panelSource = new ui.Panel();
    panelSource.class.add('theirs');
    var labelTopTheirs = new ui.Label({
        text: 'SOURCE'
    });
    labelTopTheirs.renderChanges = false;
    panelSource.append(labelTopTheirs);
    panelTop.append(panelSource);

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

    var panelBottomDest = new ui.Panel();
    panelBottomDest.flex = true;
    panelBottomDest.class.add('mine');
    panelBottom.append(panelBottomDest);

    var btnPickDest = new ui.Button({
        text: 'USE ALL FROM THIS BRANCH'
    });
    panelBottomDest.append(btnPickDest);
    btnPickDest.on('click', function () {
        if (resolver) {
            resolver.resolveUsingDestination();
        }
    });

    var panelBottomSource = new ui.Panel();
    panelBottomSource.flex = true;
    panelBottomSource.class.add('theirs');
    panelBottom.append(panelBottomSource);

    var btnPickSource = new ui.Button({
        text: 'USE ALL FROM THIS BRANCH'
    });
    panelBottomSource.append(btnPickSource);
    btnPickSource.on('click', function () {
        if (resolver) {
            resolver.resolveUsingSource();
        }
    });

    panelRight.append(panelBottom);

    // panel that warns about file merge
    var panelFileConflicts = new ui.Panel('FILE CONFLICTS');
    panelFileConflicts.class.add('file-conflicts');
    panelFileConflicts.flex = true;
    panelFileConflicts.hidden = true;
    panelRight.append(panelFileConflicts);

    var labelInfo = new ui.Label({
        text: '&#58368;',
        unsafe: true
    });
    labelInfo.class.add('font-icon');
    panelFileConflicts.append(labelInfo);

    var labelFileConflicts = new ui.Label({
        text: 'FILE CONFLICTS'
    });
    labelFileConflicts.renderChanges = false;
    labelFileConflicts.class.add('file-conflicts');
    panelFileConflicts.append(labelFileConflicts);

    var labelFileConflictsSmall = new ui.Label({
        text: 'The asset also has file conflicts'
    });
    labelFileConflictsSmall.renderChanges = false;
    labelFileConflictsSmall.class.add('file-conflicts-small');
    panelFileConflicts.append(labelFileConflictsSmall);

    var btnViewFileConflicts = new ui.Button({
        text: 'VIEW FILE CONFLICTS'
    });
    panelFileConflicts.append(btnViewFileConflicts);

    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', function () {
        if (config.self.branch.merge) {
            editor.call('picker:confirm', 'Closing the conflict manager will stop the merge. Are you sure?', function () {
                if (resolver) {
                    resolver.destroy();
                }

                setLayoutMode(LAYOUT_NONE);
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

                if (diffMode && currentMergeObject && currentMergeObject.id !== config.self.branch.merge.id) {
                    // delete current diff too
                    editor.call('branches:forceStopMerge', currentMergeObject.id);
                }
            });
        } else if (diffMode && currentMergeObject) {
            // delete regular diff
            editor.call('branches:forceStopMerge', currentMergeObject.id);
            overlay.hidden = true;
            editor.call('picker:versioncontrol');
        }
    });
    panel.headerElement.appendChild(btnClose.element);

    // the current conflict we are editing
    var currentConflicts = null;
    // the merge data that we requested from the server
    var currentMergeObject = null;
    // the UI to resolve conflicts for an item
    var resolver = null;

    // Returns true if the conflict group has any file conflicts
    var hasFileConflicts = function (group) {
        for (var i = 0; i < group.data.length; i++) {
            if (group.data[i].isTextualMerge) {
                return true;
            }
        }

        return false;
    };

    // Returns true if the conflict group has any regular data conflicts
    var hasDataConflicts = function (group) {
        for (var i = 0; i < group.data.length; i++) {
            if (! group.data[i].isTextualMerge) {
                return true;
            }
        }

        return false;
    };

    // Returns true if all of the conflicts of a group (a group has a unique itemId)
    // have been resolved
    var isConflictGroupResolved = function (group) {
        var resolved = true;
        for (var i = 0; i < group.data.length; i++) {
            if (!group.data[i].useSrc && !group.data[i].useDst && !group.data[i].useMergedFile) {
                resolved = false;
                break;
            }
        }
        return resolved;
    };

    // Returns true if all of the conflicts have been resolved for all groups
    var checkAllResolved = function () {
        var result = true;

        for (var i = 0; i < currentMergeObject.conflicts.length; i++) {
            if (!isConflictGroupResolved(currentMergeObject.conflicts[i])) {
                return false;
            }
        }

        return result;
    };

    // Creates a list item for the list on the left panel
    var createLeftListItem = function (conflictGroup) {
        var item = new ui.ListItem();

        // add some links between the item and the data
        item.conflict = conflictGroup;
        conflictGroup.listItem = item;

        var panel = new ui.Panel();
        item.element.appendChild(panel.element);

        // icon
        var labelIcon = new ui.Label({
            text: '&#58208;',
            unsafe: true
        });
        labelIcon.class.add('icon');
        labelIcon.class.add(isConflictGroupResolved(conflictGroup) ? 'resolved' : 'conflict');

        panel.append(labelIcon);
        item.icon = labelIcon;

        var panelInfo = new ui.Panel();
        panel.append(panelInfo);

        // name
        var labelName = new ui.Label({
            text: conflictGroup.itemName === 'project settings' ? 'Project Settings' : conflictGroup.itemName
        });
        labelName.class.add('name');
        panelInfo.append(labelName);

        // type
        var type = conflictGroup.assetType || conflictGroup.itemType;
        var labelType = new ui.Label({
            text: type
        });
        labelType.renderChanges = false;
        labelType.class.add('type');
        panelInfo.append(labelType);

        listItems.append(item);

        item.on('select', function () {
            showConflicts(conflictGroup);
        });

        // Called when all the conflicts of this list item have been resolved
        item.onResolved = function () {
            labelIcon.class.remove('conflict');
            labelIcon.class.add('resolved');
        };

        // Called when a conflict of this list item has been un-resolved
        item.onUnresolved = function () {
            labelIcon.class.add('conflict');
            labelIcon.class.remove('resolved');
        };

        item.refreshResolvedCount = function () {
            var resolved = 0;
            var total = conflictGroup.data.length;
            for (var i = 0; i < total; i++) {
                if (conflictGroup.data[i].useSrc ||
                    conflictGroup.data[i].useDst ||
                    conflictGroup.data[i].useMergedFile) {

                    resolved++;
                }
            }

            if (diffMode) {
                labelType.text = type + ' -  ' + total + ' Change' + (total > 1 ? 's' : '');
            } else {
                labelType.text = type + ' - Resolved ' + resolved + '/' + total;
            }
        };

        item.refreshResolvedCount();

        return item;
    };

    var showRegularConflicts = function () {
        panelTop.hidden = false;
        panelConflicts.hidden = false;
        panelBottom.hidden = diffMode;

        for (var i = 0; i < verticalBorders.length; i++) {
            verticalBorders[i].classList.remove('hidden');
        }
    };

    var showFileConflictsPanel = function () {
        panelFileConflicts.hidden = false;
        panelRight.class.add('file-conflicts-visible');
    };

    // Enables / disables the appropriate panels for the right
    // side depending on the specified mode
    var setLayoutMode = function (mode)  {
        layoutMode = mode;

        // turn off all right panel children first
        // and then enable the fields required by
        // the mode
        panelRight.class.remove('file-conflicts-visible');
        var children = panelRight.innerElement.childNodes;
        for (var i = 0; i < children.length; i++) {
            children[i].classList.add('hidden');
        }

        switch (mode) {
            case LAYOUT_FIELDS_ONLY:
                showRegularConflicts();
                break;
            case LAYOUT_FIELDS_AND_FILE_CONFLICTS:
                showRegularConflicts();
                showFileConflictsPanel();
                break;
        }
    };

    // Hide conflicts and show a progress icon
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
    };

    // Shows the conflicts of a group
    var showConflicts = function (group, forceLayoutMode) {
        // destroy the current resolver
        if (resolver) {
            resolver.destroy();
            resolver = null;
        }

        currentConflicts = group;

        var parent = panelConflicts;

        var mode = forceLayoutMode ||  LAYOUT_FIELDS_ONLY;
        if (! forceLayoutMode) {
            if (hasFileConflicts(group)) {
                if (hasDataConflicts(group)) {
                    mode = LAYOUT_FIELDS_AND_FILE_CONFLICTS;
                } else {
                    mode = LAYOUT_FILE_CONFLICTS_ONLY;
                }
            }
        }

        // create resolver based on type
        var methodName;
        switch (group.itemType) {
            case 'scene':
                methodName = 'picker:conflictManager:showSceneConflicts';
                break;
            case 'settings':
                methodName = 'picker:conflictManager:showSettingsConflicts';
                break;
            default: // asset
                if (mode === LAYOUT_FILE_CONFLICTS_ONLY) {
                    parent = panelRight;
                    methodName = 'picker:conflictManager:showAssetFileConflicts';
                } else {
                    methodName = 'picker:conflictManager:showAssetFieldConflicts';
                }
                break;
        }

        setLayoutMode(mode);

        resolver = editor.call(
            methodName,
            parent,
            currentConflicts,
            currentMergeObject
        );

        var timeoutCheckAllResolved;

        // Called when any conflict is resolved
        resolver.on('resolve', function () {
            group.listItem.refreshResolvedCount();

            // go back to regular layout
            if (layoutMode === LAYOUT_FILE_CONFLICTS_ONLY) {
                if (hasDataConflicts(group)) {
                    showConflicts(group);
                }
            }

            // Check if all the conflicts of a group have been
            // resolved
            if (! isConflictGroupResolved(group)) return;

            // Check if all conflicts of all groups are now resolved
            // in a timeout. Do it in a timeout in case the user
            // clicks on one of the resolve all buttons in which case
            // the resolve event will be fired mutliple times in the same frame
            group.listItem.onResolved();

            if (timeoutCheckAllResolved) {
                clearTimeout(timeoutCheckAllResolved);
            }
            timeoutCheckAllResolved = setTimeout(function () {
                timeoutCheckAllResolved = null;
                btnReview.disabled = ! checkAllResolved();
            });
        });

        // Called when any conflict has been un-resolved
        resolver.on('unresolve', function () {
            group.listItem.onUnresolved();
            if (timeoutCheckAllResolved) {
                clearTimeout(timeoutCheckAllResolved);
                timeoutCheckAllResolved = null;
            }

            group.listItem.refreshResolvedCount();
            btnReview.disabled = true;
        });

        // fired by the text resolver to go back
        // to viewing asset conflicts
        resolver.on('close', function () {
            if (hasDataConflicts(group)) {
                showConflicts(group);
            }
        });

        // adjust the positioning of the vertical borders because a scrollbar
        // might have been displayed which might have changed the rendered width
        // of the conflicts panel
        resolver.on('reflow', function () {
            var width = panelConflicts.element.clientWidth / (diffMode ? 2 : 3);
            verticalBorders[0].style.left = width + 'px';
            verticalBorders[1].style.left = 2 * width + 'px';
        });
    };

    btnViewFileConflicts.on('click', function () {
        showConflicts(currentConflicts, LAYOUT_FILE_CONFLICTS_ONLY);
    });

    // Complete merge button click
    btnComplete.on('click', function () {
        listItems.selected = [];
        btnComplete.disabled = true;

        if (resolver) {
            resolver.destroy();
            resolver = null;
        }

        setLayoutMode(LAYOUT_NONE);
        showMainProgress(spinnerIcon, 'Completing merge...');

        editor.call('branches:applyMerge', config.self.branch.merge.id, true, err => {
            if (err) {
                onMergeComplete(err);
            }
        });
    });

    // Review merge button click
    btnReview.on('click', function () {
        listItems.selected = [];
        btnReview.disabled = true;

        if (resolver) {
            resolver.destroy();
            resolver = null;
        }

        setLayoutMode(LAYOUT_NONE);
        showMainProgress(spinnerIcon, 'Resolving conflicts...');

        editor.call('branches:applyMerge', config.self.branch.merge.id, false, err => {
            if (err) {
                onMergeComplete(err);
            }
        });
    });

    // Called when the merge progress status changes to ready for review
    var onReadyForReview = function () {
        showMainProgress(spinnerIcon, 'Loading changes...');
        editor.call('diff:merge', function (err, data) {
            toggleDiffMode(true);
            if (err) {
                return showMainProgress(errorIcon, err);
            }

            btnReview.disabled = false;
            btnReview.hidden = true;
            btnComplete.disabled = false;
            btnComplete.hidden = false;
            onMergeDataLoaded(data);
        });
    };

    // Called when the merge process is completed
    var onMergeComplete = function (err) {
        if (err) {
            // if there was an error show it in the UI and then go back to the conflicts
            showMainProgress(errorIcon, err);
            setTimeout(function () {
                window.location.reload();
            }, 2000);
        } else {
            // if no error then refresh the browser
            showMainProgress(completedIcon, 'Merge complete - refreshing browser...');
            setTimeout(function () {
                window.location.reload();
            }, 1000);
        }
    };

    // Called when we get a merge completed message from the messenger
    var onMsgMergeComplete = function (data) {
        if (data.dst_branch_id !== config.self.branch.id) return;
        if (data.status === 'error') {
            onMergeComplete(data.message);
        } else {
            onMergeComplete();
        }
    };

    // Called when we get a merge progress status message from the messenger
    var onMsgMergeProgress = function (data) {
        if (data.dst_branch_id !== config.self.branch.id) return;
        config.self.branch.merge.mergeProgressStatus = data.status;
        if (data.status === MERGE_STATUS_READY_FOR_REVIEW) {
            onReadyForReview();
        }
    };

    // Called when we load the merge object from the server
    var onMergeDataLoaded = function (data) {
        listItems.clear();
        currentMergeObject = data;

        if (diffMode) {
            if (config.self.branch.merge) {
                labelTopTheirs.text = 'Merge Result';
            } else {
                labelTopTheirs.text = data.sourceBranchName + ' - ' + (data.sourceCheckpointId ? 'Checkpoint [' + data.sourceCheckpointId.substring(0, 7) + ']' : 'Current State');
            }
            labelTopMine.text = data.destinationBranchName + ' - ' + (data.destinationCheckpointId ? 'Checkpoint [' + data.destinationCheckpointId.substring(0, 7) + ']' : 'Current State');
        } else {
            labelTopTheirs.text = data.sourceBranchName + ' - [Source Branch]';
            labelTopMine.text = data.destinationBranchName + ' - [Destination Branch]';
        }

        if (!currentMergeObject.conflicts || !currentMergeObject.conflicts.length) {
            btnReview.disabled = false;
            if (diffMode) {
                return showMainProgress(completedIcon, 'No changes found - Click Complete Merge');
            }
            return showMainProgress(completedIcon, 'No conflicts found - Click Review Merge');

        }

        for (var i = 0; i < currentMergeObject.conflicts.length; i++) {
            var item = createLeftListItem(currentMergeObject.conflicts[i]);
            if (i === 0) {
                item.selected = true;
            }
        }

        if (!diffMode) {
            btnReview.disabled = !checkAllResolved();
        }
    };

    // Enables / Disables diff mode
    var toggleDiffMode = function (toggle) {
        diffMode = toggle;
        if (diffMode) {
            overlay.class.add('diff');
        } else {
            overlay.class.remove('diff');
        }

        if (diffMode) {
            if (config.self.branch.merge) {
                btnComplete.hidden = false;
                btnComplete.disabled = false;
                btnReview.hidden = true;
                panel.header = 'REVIEW MERGE CHANGES';
            } else {
                btnComplete.hidden = true;
                btnReview.hidden = true;
                panel.header = 'DIFF';
            }

            labelFileConflicts.text = "FILE CHANGES";
            labelFileConflictsSmall.text = "The asset also has file changes";
            btnViewFileConflicts.text = "VIEW FILE CHANGES";
            panelFileConflicts.header = 'FILE CHANGES';
        } else {
            btnReview.hidden = false;
            btnReview.disabled = true;
            btnComplete.hidden = true;
            panel.header = 'RESOLVE CONFLICTS';

            labelFileConflicts.text = "FILE CONFLICTS";
            labelFileConflictsSmall.text = "The asset also has file conflicts";
            btnViewFileConflicts.text = "VIEW FILE CONFLICTS";
            panelFileConflicts.header = 'FILE CONFLICTS';
        }
        panelBottom.hidden = diffMode;
        panelTopBase.hidden = diffMode;
    };

    // load and show data
    overlay.on('show', function () {
        // editor-blocking picker opened
        editor.emit('picker:open', 'conflict-manager');

        evtMessengerMergeComplete = editor.on('messenger:merge.complete', onMsgMergeComplete);
        evtMessengerMergeProgress = editor.on('messenger:merge.setProgress', onMsgMergeProgress);

        setLayoutMode(LAYOUT_NONE);

        if (!currentMergeObject) {
            if (diffMode) {
                // in this case we are doing a diff between the current merge
                // and the destination checkpoint
                showMainProgress(spinnerIcon, 'Loading changes...');
                editor.call('diff:merge', function (err, data) {
                    if (err) {
                        return showMainProgress(errorIcon, err);
                    }

                    onMergeDataLoaded(data);
                });

            } else if (config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_APPLY_STARTED) {
                showMainProgress(spinnerIcon, 'Merging in progress...');
            } else if (config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_READY_FOR_REVIEW) {
                onReadyForReview();

            } else {
                // get the conflicts of the current merge
                showMainProgress(spinnerIcon, 'Loading conflicts...');
                editor.call('branches:getMerge', config.self.branch.merge.id, function (err, data) {
                    if (err) {
                        return showMainProgress(errorIcon, err);
                    }

                    onMergeDataLoaded(data);
                });
            }

        } else {
            onMergeDataLoaded(currentMergeObject);
        }


        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', function () {
        currentMergeObject = null;

        if (evtMessengerMergeComplete) {
            evtMessengerMergeComplete.unbind();
            evtMessengerMergeComplete = null;
        }

        if (evtMessengerMergeProgress) {
            evtMessengerMergeProgress.unbind();
            evtMessengerMergeProgress = null;
        }

        listItems.clear();

        if (resolver) {
            resolver.destroy();
            resolver = null;
        }

        // editor-blocking picker closed
        editor.emit('picker:close', 'conflict-manager');

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // Prevent viewport hovering when the picker is shown
    editor.on('viewport:hover', function (state) {
        if (state && !overlay.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // show conflict manager
    editor.method('picker:conflictManager', function (data) {
        toggleDiffMode(false);
        currentMergeObject = data;
        overlay.hidden = false;
    });

    // Returns the current merge object
    editor.method('picker:conflictManager:currentMerge', function () {
        return currentMergeObject;
    });

    editor.method('picker:conflictManager:rightPanel', function () {
        return panelRight;
    });

    // shows diff manager which is the conflict manager in a different mode
    editor.method('picker:diffManager', function (diff) {
        toggleDiffMode(true);
        currentMergeObject = diff;
        overlay.hidden = false;
    });
});
