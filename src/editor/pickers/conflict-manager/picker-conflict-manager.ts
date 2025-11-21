import * as SVG from '@/common/svg';
import { LegacyButton } from '@/common/ui/button';
import { LegacyLabel } from '@/common/ui/label';
import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';
import { LegacyOverlay } from '@/common/ui/overlay';
import { LegacyPanel } from '@/common/ui/panel';
import { handleCallback } from '@/common/utils';

import {
    MERGE_STATUS_APPLY_ENDED,
    MERGE_STATUS_APPLY_STARTED,
    MERGE_STATUS_AUTO_ENDED,
    MERGE_STATUS_AUTO_STARTED,
    MERGE_STATUS_READY_FOR_REVIEW
} from '../../../core/constants';

editor.once('load', () => {
    const LAYOUT_NONE = 0;
    const LAYOUT_FIELDS_ONLY = 1;
    const LAYOUT_FIELDS_AND_FILE_CONFLICTS = 2;
    const LAYOUT_FILE_CONFLICTS_ONLY = 3;

    const MERGE_ERROR = 'Error while merging. Please stop the merge and try again.';

    let layoutMode = LAYOUT_NONE;

    // if true then we are showing a diff instead of a merge
    let diffMode = false;

    let evtMessengerMergeComplete = null;
    let evtMessengerMergeProgress = null;

    // overlay
    const root = editor.call('layout.root');
    const overlay = new LegacyOverlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-conflict-manager');
    root.append(overlay);

    // main panel
    const panel = new LegacyPanel('CONFLICT MANAGER');
    panel.flex = true;
    overlay.append(panel);

    // left panel
    const panelLeft = new LegacyPanel();
    panelLeft.flex = true;
    panelLeft.class.add('left');
    panel.append(panelLeft);

    // list of conflicted items
    const listItems = new LegacyList();
    listItems.flexGrow = 1;
    panelLeft.append(listItems);

    // review merge button
    const btnReview = new LegacyButton({
        text: 'REVIEW MERGE'
    });
    btnReview.disabled = true;
    panelLeft.append(btnReview);

    // complete merge button
    const btnComplete = new LegacyButton({
        text: 'COMPLETE MERGE'
    });
    panelLeft.append(btnComplete);
    btnComplete.class.add('confirm');

    // right panel
    const panelRight = new LegacyPanel();
    panelRight.class.add('right');
    panelRight.flex = true;
    panelRight.flexGrow = 1;
    panel.append(panelRight);


    // main progress text
    const labelMainProgress = new LegacyLabel();
    labelMainProgress.class.add('progress-text');
    labelMainProgress.renderChanges = false;
    labelMainProgress.hidden = true;
    panelRight.append(labelMainProgress);

    // main progress icons
    const spinnerIcon = SVG.spinner(64);
    spinnerIcon.classList.add('progress-icon');
    spinnerIcon.classList.add('hidden');
    spinnerIcon.classList.add('spin');
    const completedIcon = SVG.completed(64);
    completedIcon.classList.add('progress-icon');
    completedIcon.classList.add('hidden');
    const errorIcon = SVG.error(64);
    errorIcon.classList.add('progress-icon');
    errorIcon.classList.add('hidden');
    panelRight.innerElement.appendChild(spinnerIcon);
    panelRight.innerElement.appendChild(completedIcon);
    panelRight.innerElement.appendChild(errorIcon);

    // create vertical borders
    const verticalBorders = [];
    for (let i = 0; i < 2; i++) {
        const border = document.createElement('div');
        border.classList.add('vertical-border');
        border.classList.add(`vertical-border-${i}`);
        panelRight.append(border);
        verticalBorders.push(border);
    }

    // headers for each branch
    const panelTop = new LegacyPanel();
    panelTop.flex = true;
    panelTop.class.add('top');
    panelRight.append(panelTop);

    const panelTopBase = new LegacyPanel();
    panelTopBase.class.add('base');
    const label = new LegacyLabel({
        text: 'BASE'
    });
    label.renderChanges = false;
    panelTopBase.append(label);
    panelTop.append(panelTopBase);

    const panelDest = new LegacyPanel();
    panelDest.class.add('mine');
    const labelTopMine = new LegacyLabel({
        text: 'DEST'
    });
    labelTopMine.renderChanges = false;
    panelDest.append(labelTopMine);
    panelTop.append(panelDest);

    const panelSource = new LegacyPanel();
    panelSource.class.add('theirs');
    const labelTopTheirs = new LegacyLabel({
        text: 'SOURCE'
    });
    labelTopTheirs.renderChanges = false;
    panelSource.append(labelTopTheirs);
    panelTop.append(panelSource);

    // conflict panel
    const panelConflicts = new LegacyPanel();
    panelConflicts.class.add('conflicts');
    panelRight.append(panelConflicts);

    // bottom panel with buttons
    const panelBottom = new LegacyPanel();
    panelBottom.flex = true;
    panelBottom.class.add('bottom');

    const panelBottomBase = new LegacyPanel();
    panelBottomBase.flex = true;
    panelBottomBase.class.add('base');
    panelBottom.append(panelBottomBase);

    const panelBottomDest = new LegacyPanel();
    panelBottomDest.flex = true;
    panelBottomDest.class.add('mine');
    panelBottom.append(panelBottomDest);

    const btnPickDest = new LegacyButton({
        text: 'USE ALL FROM THIS BRANCH'
    });
    panelBottomDest.append(btnPickDest);
    btnPickDest.on('click', () => {
        if (resolver) {
            resolver.resolveUsingDestination();
        }
    });

    const panelBottomSource = new LegacyPanel();
    panelBottomSource.flex = true;
    panelBottomSource.class.add('theirs');
    panelBottom.append(panelBottomSource);

    const btnPickSource = new LegacyButton({
        text: 'USE ALL FROM THIS BRANCH'
    });
    panelBottomSource.append(btnPickSource);
    btnPickSource.on('click', () => {
        if (resolver) {
            resolver.resolveUsingSource();
        }
    });

    panelRight.append(panelBottom);

    // panel that warns about file merge
    const panelFileConflicts = new LegacyPanel('FILE CONFLICTS');
    panelFileConflicts.class.add('file-conflicts');
    panelFileConflicts.flex = true;
    panelFileConflicts.hidden = true;
    panelRight.append(panelFileConflicts);

    const labelInfo = new LegacyLabel({
        text: '&#58368;',
        unsafe: true
    });
    labelInfo.class.add('font-icon');
    panelFileConflicts.append(labelInfo);

    const labelFileConflicts = new LegacyLabel({
        text: 'FILE CONFLICTS'
    });
    labelFileConflicts.renderChanges = false;
    labelFileConflicts.class.add('file-conflicts');
    panelFileConflicts.append(labelFileConflicts);

    const labelFileConflictsSmall = new LegacyLabel({
        text: 'The asset also has file conflicts'
    });
    labelFileConflictsSmall.renderChanges = false;
    labelFileConflictsSmall.class.add('file-conflicts-small');
    panelFileConflicts.append(labelFileConflictsSmall);

    const btnViewFileConflicts = new LegacyButton({
        text: 'VIEW FILE CONFLICTS'
    });
    panelFileConflicts.append(btnViewFileConflicts);

    // close button
    const btnClose = new LegacyButton({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', () => {
        if (config.self.branch.merge) {
            editor.call('picker:confirm', 'Closing the conflict manager will stop the merge. Are you sure?', () => {
                if (resolver) {
                    resolver.destroy();
                }

                setLayoutMode(LAYOUT_NONE);
                showMainProgress(spinnerIcon, 'Stopping merge');
                handleCallback(editor.api.globals.rest.merge.mergeDelete({
                    mergeId: config.self.branch.merge.id
                }), (err) => {
                    if (err) {
                        showMainProgress(errorIcon, err);
                    } else {
                        showMainProgress(completedIcon, 'Merge stopped. Refreshing browser');
                    }
                    // FIXME: Refresh handled by messenger
                });

                if (diffMode && currentMergeObject && currentMergeObject.id !== config.self.branch.merge.id) {
                    // delete current diff too
                    handleCallback(editor.api.globals.rest.merge.mergeDelete({
                        mergeId: currentMergeObject.id
                    }), () => {
                        // FIXME: Refresh handled by messenger
                    });
                }
            });
        } else if (diffMode && currentMergeObject) {
            // delete regular diff
            handleCallback(editor.api.globals.rest.merge.mergeDelete({
                mergeId: currentMergeObject.id
            }), () => {
                // FIXME: Refresh handled by messenger
            });
            overlay.hidden = true;
            editor.call('picker:versioncontrol');
            editor.call('vcgraph:moveToForeground');
        }
    });
    panel.headerElement.appendChild(btnClose.element);

    // the current conflict we are editing
    let currentConflicts = null;
    // the merge data that we requested from the server
    var currentMergeObject = null;
    // the UI to resolve conflicts for an item
    var resolver = null;

    // Returns true if the conflict group has any file conflicts
    const hasFileConflicts = function (group) {
        for (let i = 0; i < group.data.length; i++) {
            if (group.data[i].isTextualMerge) {
                return true;
            }
        }

        return false;
    };

    // Returns true if the conflict group has any regular data conflicts
    const hasDataConflicts = function (group) {
        for (let i = 0; i < group.data.length; i++) {
            if (!group.data[i].isTextualMerge) {
                return true;
            }
        }

        return false;
    };

    // Returns true if all of the conflicts of a group (a group has a unique itemId)
    // have been resolved
    const isConflictGroupResolved = function (group) {
        let resolved = true;
        for (let i = 0; i < group.data.length; i++) {
            if (!group.data[i].useSrc && !group.data[i].useDst && !group.data[i].useMergedFile) {
                resolved = false;
                break;
            }
        }
        return resolved;
    };

    // Returns true if all of the conflicts have been resolved for all groups
    const checkAllResolved = function () {
        const result = true;

        for (let i = 0; i < currentMergeObject.conflicts.length; i++) {
            if (!isConflictGroupResolved(currentMergeObject.conflicts[i])) {
                return false;
            }
        }

        return result;
    };

    // Creates a list item for the list on the left panel
    const createLeftListItem = function (conflictGroup) {
        const item = new LegacyListItem();

        // add some links between the item and the data
        item.conflict = conflictGroup;
        conflictGroup.listItem = item;

        const panel = new LegacyPanel();
        item.element.appendChild(panel.element);

        // icon
        const labelIcon = new LegacyLabel({
            text: '&#58208;',
            unsafe: true
        });
        labelIcon.class.add('icon');
        labelIcon.class.add(isConflictGroupResolved(conflictGroup) ? 'resolved' : 'conflict');

        panel.append(labelIcon);
        item.icon = labelIcon;

        const panelInfo = new LegacyPanel();
        panel.append(panelInfo);

        // name
        const labelName = new LegacyLabel({
            text: conflictGroup.itemName === 'project settings' ? 'Project Settings' : conflictGroup.itemName
        });
        labelName.class.add('name');
        panelInfo.append(labelName);

        // type
        const type = conflictGroup.assetType || conflictGroup.itemType;
        const labelType = new LegacyLabel({
            text: type
        });
        labelType.renderChanges = false;
        labelType.class.add('type');
        panelInfo.append(labelType);

        listItems.append(item);

        item.on('select', () => {
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
            let resolved = 0;
            const total = conflictGroup.data.length;
            for (let i = 0; i < total; i++) {
                if (conflictGroup.data[i].useSrc ||
                    conflictGroup.data[i].useDst ||
                    conflictGroup.data[i].useMergedFile) {

                    resolved++;
                }
            }

            if (diffMode) {
                labelType.text = `${type} -  ${total} Change${total > 1 ? 's' : ''}`;
            } else {
                labelType.text = `${type} - Resolved ${resolved}/${total}`;
            }
        };

        item.refreshResolvedCount();

        return item;
    };

    const showRegularConflicts = function () {
        panelTop.hidden = false;
        panelConflicts.hidden = false;
        panelBottom.hidden = diffMode;

        for (let i = 0; i < verticalBorders.length; i++) {
            verticalBorders[i].classList.remove('hidden');
        }
    };

    const showFileConflictsPanel = function () {
        panelFileConflicts.hidden = false;
        panelRight.class.add('file-conflicts-visible');
    };

    // Enables / disables the appropriate panels for the right
    // side depending on the specified mode
    var setLayoutMode = function (mode) {
        layoutMode = mode;

        // turn off all right panel children first
        // and then enable the fields required by
        // the mode
        panelRight.class.remove('file-conflicts-visible');
        const children = panelRight.innerElement.childNodes;
        for (let i = 0; i < children.length; i++) {
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
        [spinnerIcon, completedIcon, errorIcon].forEach((i) => {
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

        let parent = panelConflicts;

        let mode = forceLayoutMode ||  LAYOUT_FIELDS_ONLY;
        if (!forceLayoutMode) {
            if (hasFileConflicts(group)) {
                if (hasDataConflicts(group)) {
                    mode = LAYOUT_FIELDS_AND_FILE_CONFLICTS;
                } else {
                    mode = LAYOUT_FILE_CONFLICTS_ONLY;
                }
            }
        }

        // create resolver based on type
        let methodName;
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

        let timeoutCheckAllResolved;

        // Called when any conflict is resolved
        resolver.on('resolve', () => {
            group.listItem.refreshResolvedCount();

            // go back to regular layout
            if (layoutMode === LAYOUT_FILE_CONFLICTS_ONLY) {
                if (hasDataConflicts(group)) {
                    showConflicts(group);
                }
            }

            // Check if all the conflicts of a group have been
            // resolved
            if (!isConflictGroupResolved(group)) {
                return;
            }

            // Check if all conflicts of all groups are now resolved
            // in a timeout. Do it in a timeout in case the user
            // clicks on one of the resolve all buttons in which case
            // the resolve event will be fired multiple times in the same frame
            group.listItem.onResolved();

            if (timeoutCheckAllResolved) {
                clearTimeout(timeoutCheckAllResolved);
            }
            timeoutCheckAllResolved = setTimeout(() => {
                timeoutCheckAllResolved = null;
                btnReview.disabled = !checkAllResolved();
            });
        });

        // Called when any conflict has been un-resolved
        resolver.on('unresolve', () => {
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
        resolver.on('close', () => {
            if (hasDataConflicts(group)) {
                showConflicts(group);
            }
        });

        // adjust the positioning of the vertical borders because a scrollbar
        // might have been displayed which might have changed the rendered width
        // of the conflicts panel
        resolver.on('reflow', () => {
            const width = panelConflicts.element.clientWidth / (diffMode ? 2 : 3);
            verticalBorders[0].style.left = `${width}px`;
            verticalBorders[1].style.left = `${2 * width}px`;
        });
    };

    btnViewFileConflicts.on('click', () => {
        showConflicts(currentConflicts, LAYOUT_FILE_CONFLICTS_ONLY);
    });

    // Complete merge button click
    btnComplete.on('click', () => {
        listItems.selected = [];
        btnComplete.disabled = true;

        if (resolver) {
            resolver.destroy();
            resolver = null;
        }

        setLayoutMode(LAYOUT_NONE);
        showMainProgress(spinnerIcon, 'Completing merge...');

        handleCallback(editor.api.globals.rest.merge.mergeApply({
            mergeId: config.self.branch.merge.id,
            finalize: true
        }), (err) => {
            if (err && !/Request timed out/.test(err)) {
                onMergeError(err);
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        });
    });

    // Review merge button click
    btnReview.on('click', () => {
        listItems.selected = [];
        btnReview.disabled = true;

        if (resolver) {
            resolver.destroy();
            resolver = null;
        }

        setLayoutMode(LAYOUT_NONE);
        showMainProgress(spinnerIcon, 'Resolving conflicts...');

        handleCallback(editor.api.globals.rest.merge.mergeApply({
            mergeId: config.self.branch.merge.id,
            finalize: false
        }), (err) => {
            if (err && !/Request timed out/.test(err)) {
                onMergeError(err);
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        });
    });

    // Change style of review merge button when enabled
    btnReview.on('enable', () => {
        btnReview.class.add('confirm');
    });

    btnReview.on('disable', () => {
        btnReview.class.remove('confirm');
    });

    // Called when the merge progress status changes to ready for review
    const onReadyForReview = function () {
        showMainProgress(spinnerIcon, 'Loading changes...');
        handleCallback(editor.api.globals.rest.diff.diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }), (err, data) => {
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

    // Load current merge and its conflicts if any
    const loadMerge = function () {
        showMainProgress(spinnerIcon, 'Loading conflicts...');
        handleCallback(editor.api.globals.rest.merge.mergeGet({
            mergeId: config.self.branch.merge.id
        }), (err, data) => {
            if (err) {
                return showMainProgress(errorIcon, err);
            }

            onMergeDataLoaded(data);
        });
    };

    // Load changes of current merge
    const loadDiff = function () {
        showMainProgress(spinnerIcon, 'Loading changes...');
        handleCallback(editor.api.globals.rest.diff.diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }), (err, data) => {
            if (err) {
                return showMainProgress(errorIcon, err);
            }

            onMergeDataLoaded(data);
        });
    };

    // Called when the merge process is completed
    const onMergeComplete = function () {
        // if no error then refresh the browser
        showMainProgress(completedIcon, 'Merge complete - refreshing browser...');
        // FIXME: Refresh handled by messenger
    };

    var onMergeError = function (err) {
        // if there was an error show it in the UI
        showMainProgress(errorIcon, err);
    };

    // Called when we get a merge progress status message from the messenger
    const onMsgMergeProgress = function (data) {
        if (data.dst_branch_id !== config.self.branch.id) {
            return;
        }

        config.self.branch.merge.mergeProgressStatus = data.status;

        if (data.task_failed) {
            onMergeError(MERGE_ERROR);
            return;
        }

        if (data.status === MERGE_STATUS_READY_FOR_REVIEW) {
            onReadyForReview();
        } else if (data.status === MERGE_STATUS_AUTO_ENDED) {
            loadMerge();
        } else if (data.status === MERGE_STATUS_APPLY_ENDED) {
            onMergeComplete();
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
                labelTopTheirs.text = `${data.sourceBranchName} - ${data.sourceCheckpointId ? `Checkpoint [${data.sourceCheckpointId.substring(0, 7)}]` : 'Current State'}`;
            }
            labelTopMine.text = `${data.destinationBranchName} - ${data.destinationCheckpointId ? `Checkpoint [${data.destinationCheckpointId.substring(0, 7)}]` : 'Current State'}`;
        } else {
            labelTopTheirs.text = `${data.sourceBranchName} - [Source Branch]`;
            labelTopMine.text = `${data.destinationBranchName} - [Destination Branch]`;
        }

        if (!currentMergeObject.conflicts || !currentMergeObject.conflicts.length) {
            btnReview.disabled = false;
            if (diffMode) {
                return showMainProgress(completedIcon, 'No changes found - Click Complete Merge');
            }
            return showMainProgress(completedIcon, 'No conflicts found - Click Review Merge');

        }

        for (let i = 0; i < currentMergeObject.conflicts.length; i++) {
            const item = createLeftListItem(currentMergeObject.conflicts[i]);
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

            labelFileConflicts.text = 'FILE CHANGES';
            labelFileConflictsSmall.text = 'The asset also has file changes';
            btnViewFileConflicts.text = 'VIEW FILE CHANGES';
            panelFileConflicts.header = 'FILE CHANGES';
        } else {
            btnReview.hidden = false;
            btnReview.disabled = true;
            btnComplete.hidden = true;
            panel.header = 'RESOLVE CONFLICTS';

            labelFileConflicts.text = 'FILE CONFLICTS';
            labelFileConflictsSmall.text = 'The asset also has file conflicts';
            btnViewFileConflicts.text = 'VIEW FILE CONFLICTS';
            panelFileConflicts.header = 'FILE CONFLICTS';
        }
        panelBottom.hidden = diffMode;
        panelTopBase.hidden = diffMode;
    };

    // load and show data
    overlay.on('show', () => {
        // editor-blocking picker opened
        editor.emit('picker:open', 'conflict-manager');

        evtMessengerMergeProgress = editor.on('messenger:merge.setProgress', onMsgMergeProgress);

        setLayoutMode(LAYOUT_NONE);

        if (!currentMergeObject) {
            if (diffMode) {
                // in this case we are doing a diff between the current merge
                // and the destination checkpoint
                loadDiff();
            } else if (config.self.branch.merge.task_failed) {
                onMergeError(MERGE_ERROR);
            } else if (!config.self.branch.merge.mergeProgressStatus ||
                       config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_APPLY_STARTED ||
                       config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_AUTO_STARTED) {
                showMainProgress(spinnerIcon, 'Merging in progress...');
            } else if (config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_READY_FOR_REVIEW) {
                onReadyForReview();
            } else {
                // load current merge
                loadMerge();
            }
        } else {
            onMergeDataLoaded(currentMergeObject);
        }


        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', () => {
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
    editor.on('viewport:hover', (state) => {
        if (state && !overlay.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // show conflict manager
    editor.method('picker:conflictManager', (data) => {
        toggleDiffMode(false);
        currentMergeObject = data;
        overlay.hidden = false;
    });

    // Returns the current merge object
    editor.method('picker:conflictManager:currentMerge', () => {
        return currentMergeObject;
    });

    editor.method('picker:conflictManager:rightPanel', () => {
        return panelRight;
    });

    // shows diff manager which is the conflict manager in a different mode
    editor.method('picker:diffManager', (diff) => {
        toggleDiffMode(true);
        currentMergeObject = diff;
        overlay.hidden = false;
    });
});
