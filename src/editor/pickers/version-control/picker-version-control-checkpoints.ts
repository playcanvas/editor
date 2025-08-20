import { Button, Container } from '@playcanvas/pcui';

import * as SVG from '../../../common/svg.ts';
import { LegacyButton } from '../../../common/ui/button.ts';
import { LegacyCheckbox } from '../../../common/ui/checkbox.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyListItem } from '../../../common/ui/list-item.ts';
import { LegacyList } from '../../../common/ui/list.ts';
import { LegacyMenuItem } from '../../../common/ui/menu-item.ts';
import { LegacyMenu } from '../../../common/ui/menu.ts';
import { LegacyPanel } from '../../../common/ui/panel.ts';
import { LegacyTooltip } from '../../../common/ui/tooltip.ts';
import { convertDatetime, handleCallback } from '../../../common/utils.ts';

editor.once('load', () => {
    const events = [];

    const VC_GRAPH_ZINDEX = { inForeground: 301, inBackground: 299 };

    const projectUserSettings = editor.call('settings:projectUser');

    let diffMode = false;

    const panel = new LegacyPanel();
    panel.class.add('checkpoints-container');

    // checkpoints top
    const panelCheckpointsTop = new LegacyPanel();
    panelCheckpointsTop.class.add('checkpoints-top');
    panel.append(panelCheckpointsTop);

    // current branch being viewed
    panel.currentBranch = null;

    // current branch history
    const labelBranchName = new LegacyLabel({
        text: 'Branch'
    });
    labelBranchName.renderChanges = false;
    labelBranchName.class.add('branch-history', 'selectable');
    panelCheckpointsTop.append(labelBranchName);

    const labelBranchCheckpoints = new LegacyLabel({
        text: 'Checkpoints'
    });
    labelBranchCheckpoints.renderChanges = false;
    labelBranchCheckpoints.class.add('info');
    panelCheckpointsTop.append(labelBranchCheckpoints);

    const panelBranchActions = new LegacyPanel();
    panelBranchActions.class.add('branch-actions', 'flex');
    panel.append(panelBranchActions);

    // add branch to favorites
    const btnFavorite = new LegacyButton({
        text: 'Favorite'
    });
    btnFavorite.class.add('icon', 'favorite');
    panelBranchActions.append(btnFavorite);

    // open diff checkpoints panel
    const btnDiff = new LegacyButton({
        text: 'View Diff'
    });
    btnDiff.class.add('icon', 'diff');
    panelBranchActions.append(btnDiff);

    // version control graph
    const btnVcGraph = new LegacyButton({
        text: 'Graph'
    });
    btnVcGraph.class.add('icon', 'vc-graph');

    panelBranchActions.append(btnVcGraph);

    // new checkpoint button
    const btnNewCheckpoint = new LegacyButton({
        text: 'Checkpoint'
    });
    btnNewCheckpoint.class.add('icon', 'create');
    panelBranchActions.append(btnNewCheckpoint);

    const toggleTopButtons = function () {
        btnFavorite.disabled = !panel.branch || panel.branch.closed || !editor.call('permissions:write');
        btnNewCheckpoint.disabled = !editor.call('permissions:write') || !panel.branch || panel.branch.id !== config.self.branch.id;
    };

    toggleTopButtons();

    // checkpoints main panel
    const panelCheckpoints = new LegacyPanel();
    panelCheckpoints.class.add('checkpoints');
    panel.append(panelCheckpoints);

    // checkpoints list
    const listCheckpoints = new LegacyList();
    panelCheckpoints.append(listCheckpoints);

    // used to group displayed checkpoints into days
    let lastCheckpointDateDisplayed = null;

    // load more checkpoints list item
    const listItemLoadMore = new LegacyListItem();
    listItemLoadMore.class.add('load-more');
    listItemLoadMore.hidden = true;
    const btnLoadMore = new LegacyButton({
        text: 'LOAD MORE'
    });
    listItemLoadMore.element.appendChild(btnLoadMore.element);

    // checkpoints for which context menu is currently open
    let currentCheckpoint = null;

    let currentCheckpointListRequest = null;
    let checkpointsSkip = null;

    const savedCheckpointList = {};

    // checkpoints context menu
    const menuCheckpoints = new LegacyMenu();
    menuCheckpoints.class.add('version-control');

    // view changes between this checkpoint and previous
    const menuCheckpointsViewChanges = new LegacyMenuItem({
        text: 'View Changes',
        value: 'view-changes'
    });
    menuCheckpoints.append(menuCheckpointsViewChanges);

    LegacyTooltip.attach({
        target: menuCheckpointsViewChanges.element,
        text: 'View changes between this checkpoint and the previous checkpoint.',
        align: 'right',
        root: editor.call('layout.root')
    });

    // branch from checkpoint
    const menuCheckpointsBranch = new LegacyMenuItem({
        text: 'New Branch',
        value: 'new-branch'
    });
    menuCheckpoints.append(menuCheckpointsBranch);

    LegacyTooltip.attach({
        target: menuCheckpointsBranch.element,
        text: 'Create a new branch from this checkpoint.',
        align: 'right',
        root: editor.call('layout.root')
    });

    // restore checkpoint
    const menuCheckpointsRestore = new LegacyMenuItem({
        text: 'Restore',
        value: 'restore-checkpoint'
    });
    menuCheckpoints.append(menuCheckpointsRestore);

    LegacyTooltip.attach({
        target: menuCheckpointsRestore.element,
        text: 'Change the current state of project to be the same as this checkpoint.',
        align: 'right',
        root: editor.call('layout.root')
    });

    // hard reset to checkpoint
    const menuCheckpointsHardReset = new LegacyMenuItem({
        text: 'Hard Reset',
        value: 'hard-reset-checkpoint'
    });
    menuCheckpoints.append(menuCheckpointsHardReset);

    LegacyTooltip.attach({
        target: menuCheckpointsHardReset.element,
        text: 'Deletes all checkpoints and changes after this checkpoint. Useful if you want to undo a merge.',
        align: 'right',
        root: editor.call('layout.root')
    });

    editor.call('layout.root').append(menuCheckpoints);

    // loading checkpoints icon
    const spinner = SVG.spinner(64);
    spinner.classList.add('hidden');
    spinner.classList.add('spinner');
    panelCheckpoints.innerElement.appendChild(spinner);

    const miniSpinner = SVG.spinner(32);
    miniSpinner.classList.add('hidden');
    miniSpinner.classList.add('spinner');
    miniSpinner.classList.add('mini-spinner');
    panelCheckpointsTop.innerElement.appendChild(miniSpinner);

    panel.scrollTopMap = {};

    // Set the current branch of the panel
    panel.setBranch = function (branch) {

        if (branch != null) {
            panel.currentBranch = branch;
        }

        if (panel.branch != null && branch != null) {
            panel.scrollTopMap[panel.branch.id] = panelCheckpoints.element.scrollTop;
        }

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
        const scrollTop = panel.branch != null && panel.scrollTopMap[panel.branch.id] != null ? panel.scrollTopMap[panel.branch.id] : panelCheckpoints.element.scrollTop;

        listCheckpoints.clear();
        lastCheckpointDateDisplayed = null;

        const length = checkpoints && checkpoints.length;
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

        panelCheckpoints.element.scrollTop = scrollTop;
    };

    // Show button to load more checkpoints or not
    panel.toggleLoadMore = function (toggle) {
        listItemLoadMore.hidden = !toggle;
    };

    panel.loadCheckpoints = function (refresh) {

        // if not cached load checkpoints fresh
        // else load checkpoints from cache and perform request to check for new checkpoints
        // if new checkpoints then update list
        // checkpoints only if load more button is clicked (refresh is true)

        const params = {
            branch: panel.branch.id,
            limit: 50
        };

        if (checkpointsSkip && refresh) {
            params.skip = checkpointsSkip;
        }

        if (savedCheckpointList[panel.branch.id] !== undefined) {
            panel.setCheckpoints(savedCheckpointList[panel.branch.id].result);
            panel.toggleLoadMore(savedCheckpointList[panel.branch.id].pagination.hasMore);

            miniSpinner.classList.remove('hidden');

            const requestCheck = handleCallback(editor.api.globals.rest.branches.branchCheckpoints({
                branchId: params.branch,
                limit: params.limit,
                skip: params.skip
            }), (err, data) => {
                if (requestCheck !== currentCheckpointListRequest || panel.hidden || panel.parent.hidden) {
                    return;
                }

                miniSpinner.classList.add('hidden');

                currentCheckpointListRequest = null;

                if (err) {
                    return log.error(err);
                }

                if (params.skip) {
                    data.result = savedCheckpointList[panel.branch.id].result.concat(data.result);
                }

                if (data.result[0].id !== savedCheckpointList[panel.branch.id].result[0].id || refresh) {
                    panel.setCheckpoints(data.result);
                    panel.toggleLoadMore(data.pagination.hasMore);

                    savedCheckpointList[panel.branch.id] = data;
                }

            });

            currentCheckpointListRequest = requestCheck;

            return;
        }

        btnLoadMore.disabled = true;
        btnLoadMore.text = 'LOADING...';

        // hide list of checkpoints and show spinner
        listCheckpoints.hidden = true;
        spinner.classList.remove('hidden');

        // list checkpoints but make sure in the response
        // that the results are from this request and not another
        // Happens sometimes when this request takes a long time
        const request = handleCallback(editor.api.globals.rest.branches.branchCheckpoints({
            branchId: params.branch,
            limit: params.limit,
            skip: params.skip
        }), (err, data) => {
            if (request !== currentCheckpointListRequest || panel.hidden || panel.parent.hidden) {
                return;
            }

            btnLoadMore.disabled = false;
            btnLoadMore.text = 'LOAD MORE';

            // show list of checkpoints and hide spinner
            listCheckpoints.hidden = false;
            spinner.classList.add('hidden');
            miniSpinner.classList.add('hidden');

            currentCheckpointListRequest = null;

            if (err) {
                return log.error(err);
            }

            if (params.skip) {
                data.result = panel.checkpoints.concat(data.result);
            }

            panel.setCheckpoints(data.result);
            panel.toggleLoadMore(data.pagination.hasMore);

            savedCheckpointList[panel.branch.id] = data;
        });

        currentCheckpointListRequest = request;
    };

    const createCheckpointWidget = function (checkpoint) {
        const panelWidget = new LegacyPanel();
        panelWidget.class.add('checkpoint-widget');
        panelWidget.flex = true;

        const imgUser = new Image();
        imgUser.src = `/api/users/${checkpoint.user.id}/thumbnail?size=28`;
        imgUser.classList.add('noSelect');
        panelWidget.append(imgUser);

        const panelInfo = new LegacyPanel();
        panelInfo.class.add('info');
        panelInfo.flex = true;
        panelWidget.append(panelInfo);

        const panelTopRow = new LegacyPanel();
        panelTopRow.flexGrow = 1;
        panelTopRow.class.add('top-row');
        panelInfo.append(panelTopRow);

        let descWithoutNewLine = checkpoint.description;
        const newLineIndex = descWithoutNewLine.indexOf('\n');
        if (newLineIndex >= 0) {
            descWithoutNewLine = descWithoutNewLine.substring(0, newLineIndex);
        }
        const labelDesc = new LegacyLabel({
            text: descWithoutNewLine
        });
        labelDesc.renderChanges = false;
        labelDesc.class.add('desc', 'selectable');
        panelTopRow.append(labelDesc);

        const btnMore = new LegacyButton({
            text: '...read more'
        });
        btnMore.on('click', () => {
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

        const panelBottomRow = new LegacyPanel();
        panelBottomRow.flexGrow = 1;
        panelBottomRow.class.add('bottom-row');
        panelInfo.append(panelBottomRow);

        const labelInfo = new LegacyLabel({
            text: `${convertDatetime(checkpoint.createdAt)
            } - ${
                checkpoint.id.substring(0, 7)
            }${checkpoint.user.fullName ? ` by ${checkpoint.user.fullName}` : ''}`
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

    const createCheckpointSectionHeader = function (title) {
        const header = document.createElement('div');
        header.classList.add('date');
        header.classList.add('selectable');
        header.textContent = title;
        listCheckpoints.innerElement.appendChild(header);
        return header;
    };

    var createCheckpointListItem = function (checkpoint) {
        // add current date if necessary
        const date = (new Date(checkpoint.createdAt)).toDateString();
        if (lastCheckpointDateDisplayed !== date) {
            lastCheckpointDateDisplayed = date;

            if (lastCheckpointDateDisplayed === (new Date()).toDateString()) {
                createCheckpointSectionHeader('Today');
            } else {
                const parts = lastCheckpointDateDisplayed.split(' ');
                createCheckpointSectionHeader(`${parts[0]}, ${parts[1]} ${parts[2]}, ${parts[3]}`);
            }
        }

        const item = new LegacyListItem();
        item.element.id = `checkpoint-${checkpoint.id}`;

        const panelListItem = createCheckpointWidget(checkpoint);
        item.element.appendChild(panelListItem.element);

        // dropdown
        const dropdown = new LegacyButton({
            text: '&#57689;'
        });
        dropdown.class.add('dropdown');
        panelListItem.append(dropdown);

        if (!editor.call('permissions:write') || diffMode) {
            dropdown.hidden = true;
        }

        dropdown.on('click', (e) => {
            e.stopPropagation();

            currentCheckpoint = checkpoint;

            dropdown.class.add('clicked');
            dropdown.element.innerHTML = '&#57687;';

            menuCheckpoints.open = true;
            const rect = dropdown.element.getBoundingClientRect();
            menuCheckpoints.position(rect.right - menuCheckpoints.innerElement.clientWidth, rect.bottom);
        });

        // select
        const checkboxSelect = new LegacyCheckbox();
        checkboxSelect.class.add('tick');
        panelListItem.append(checkboxSelect);
        checkboxSelect.value = editor.call('picker:versioncontrol:widget:diffCheckpoints:isCheckpointSelected', panel.branch, checkpoint);

        let suppressCheckboxEvents = false;
        checkboxSelect.on('change', (value) => {
            if (panel.branch != null) {
                panel.scrollTopMap[panel.branch.id] = panelCheckpoints.element.scrollTop;
            }
            if (suppressCheckboxEvents) {
                return;
            }
            if (value) {
                editor.emit('checkpoint:diff:select', panel.branch, checkpoint);
            } else {
                editor.emit('checkpoint:diff:deselect', panel.branch, checkpoint);
            }
        });

        events.push(editor.on('checkpoint:diff:deselect', (deselectedBranch, deselectedCheckpoint) => {
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
    const createCurrentStateListItem = function () {
        const item = new LegacyListItem();
        const panelItem = new LegacyPanel();
        // panelItem.class.add('checkpoint-widget');
        panelItem.flex = true;

        const label = new LegacyLabel({
            text: 'Changes made since the last checkpoint'
        });
        panelItem.append(label);

        // shortcut button to view changes
        const btnViewChanges = new Button({
            text: 'VIEW CHANGES',
            size: 'small',
            class: 'btn-view-changes'
        });
        btnViewChanges.style.width = '110px';
        panelItem.append(btnViewChanges);
        btnViewChanges.on('click', () => {
            if (panel.branch != null) {
                panel.scrollTopMap[panel.branch.id] = panelCheckpoints.element.scrollTop;
            }
            panel.emit('diff',
                panel.branch.id,
                null,
                panel.branch.id,
                panel.branch.latestCheckpointId
            );
        });

        // select
        const checkboxSelect = new LegacyCheckbox();
        checkboxSelect.class.add('tick');
        panelItem.append(checkboxSelect);
        checkboxSelect.value = editor.call('picker:versioncontrol:widget:diffCheckpoints:isCheckpointSelected', panel.branch, null);

        let suppressCheckboxEvents = false;
        checkboxSelect.on('change', (value) => {
            if (suppressCheckboxEvents) {
                return;
            }
            if (value) {
                editor.emit('checkpoint:diff:select', panel.branch, null);
            } else {
                editor.emit('checkpoint:diff:deselect', panel.branch, null);
            }
        });

        events.push(editor.on('checkpoint:diff:deselect', (deselectedBranch, deselectedCheckpoint) => {
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
        const currentStateHeader = createCheckpointSectionHeader('CURRENT STATE');
        currentStateHeader.classList.add('current-state');
        const currentStateListItem = createCurrentStateListItem();
        currentStateListItem.class.add('current-state');
    };

    const vcGraphPanel = new LegacyPanel();
    vcGraphPanel.class.add('picker-version-control');
    vcGraphPanel.class.add('vc-graph-panel');
    vcGraphPanel.flex = true;
    vcGraphPanel.hidden = true;
    vcGraphPanel.dom.setAttribute('style', `
        position: fixed;
        z-index: ${VC_GRAPH_ZINDEX.inForeground};
        height: 95%;
        width: 95%;
        transform: translate(-50%, -50%);
        left: 50%;
        top: 50%;
    `);

    editor.call('layout.root').append(vcGraphPanel);

    const vcNodeMenu = editor.call('vcgraph:makeNodeMenu', panel);
    editor.call('layout.root').append(vcNodeMenu);

    btnVcGraph.on('click', () => {
        editor.call('vcgraph:showGraphPanel', { branchId: panel.branch.id });
    });

    editor.method('vcgraph:closeGraphPanel', () => {
        editor.call('vcgraph:moveToForeground');
        vcGraphPanel.hidden = true;
        vcGraphPanel.clear();
    });

    editor.method('vcgraph:moveToBackground', () => {
        vcGraphPanel.style.zIndex = VC_GRAPH_ZINDEX.inBackground;
    });

    editor.method('vcgraph:moveToForeground', () => {
        vcGraphPanel.style.zIndex = VC_GRAPH_ZINDEX.inForeground;
    });

    editor.method('vcgraph:isHidden', () => {
        return vcGraphPanel.hidden;
    });

    editor.method('vcgraph:showGraphPanel', (h) => {
        vcGraphPanel.hidden = !vcGraphPanel.hidden;
        const vcGraphContainer = new Container();
        const vcGraphCloseBtn = new Button({ text: 'CLOSE' });
        vcGraphCloseBtn.dom.setAttribute('style', `
            position: absolute;
            top: 6px;
            right: 5px;
        `);

        vcGraphCloseBtn.on('click', () => {
            editor.call('vcgraph:closeGraphPanel');

            if (h.closeVcPicker) {
                editor.call('picker:project:close');
            }
        });

        vcGraphPanel.append(vcGraphContainer);
        vcGraphContainer.dom.setAttribute('style', `
            width: 100%;
            height: 100%;
            background-color: #293234;
        `);

        Object.assign(h, {
            vcGraphContainer,
            vcGraphCloseBtn,
            vcNodeMenu
        });

        editor.call('vcgraph:showInitial', h);
    });

    btnFavorite.on('click', () => {
        if (!panel.branch) {
            return;
        }
        if (panel.branchIsFavorite) {
            const index = projectUserSettings.get('favoriteBranches').indexOf(panel.branch.id);
            if (index >= 0) {
                projectUserSettings.remove('favoriteBranches', index);
            }
        } else {
            projectUserSettings.insert('favoriteBranches', panel.branch.id);
        }
    });

    // show create checkpoint panel
    btnNewCheckpoint.on('click', () => {
        panel.emit('checkpoint:new');
    });

    // generate diff
    btnDiff.on('click', () => {
        panel.emit('checkpoint:diff');
    });

    // load more button
    btnLoadMore.on('click', () => {
        if (panel.branch != null) {
            panel.scrollTopMap[panel.branch.id] = panelCheckpoints.element.scrollTop;
        }
        panel.loadCheckpoints(true);
    });

    // restore checkpoint
    menuCheckpointsRestore.on('select', () => {
        panel.emit('checkpoint:restore', currentCheckpoint);
    });

    // hard reset checkpoint
    menuCheckpointsHardReset.on('select', () => {
        panel.emit('checkpoint:hardReset', currentCheckpoint);
    });

    // branch from checkpoint
    menuCheckpointsBranch.on('select', () => {
        panel.emit('checkpoint:branch', currentCheckpoint, null);
    });

    // view changes in checkpoint
    menuCheckpointsViewChanges.on('select', () => {
        let previousCheckpoint = null;

        // Find the previous checkpoint to current checkpoint
        for (let i = 0, len = panel.checkpoints.length - 1; i < len; i++) {
            if (currentCheckpoint.id === panel.checkpoints[i].id) {
                previousCheckpoint = panel.checkpoints[i + 1];
                break;
            }
        }

        if (panel.branch != null) {
            panel.scrollTopMap[panel.branch.id] = panelCheckpoints.element.scrollTop;
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

    menuCheckpoints.on('open', (open) => {
        if (!currentCheckpoint) {
            return;
        }

        // filter menu options
        if (open) {
            menuCheckpointsRestore.hidden = panel.branch.id !== config.self.branch.id || !editor.call('permissions:write');
            menuCheckpointsHardReset.hidden = menuCheckpointsRestore.hidden;
            menuCheckpointsBranch.hidden = !editor.call('permissions:write');

            // Don't show view changes if this is the last checkpoint in the list
            // because we can't get the previous checkpoint id until the user loads
            // more checkpoints and this also protects us trying to view changes from
            // the first checkpoint in a branch
            const lastPanelCheckpoint = panel.checkpoints[panel.checkpoints.length - 1];
            menuCheckpointsViewChanges.hidden = currentCheckpoint.id === lastPanelCheckpoint.id;
        }

        // when the checkpoints context menu is closed 'unclick' dropdowns
        if (!open) {
            const item = document.getElementById(`checkpoint-${currentCheckpoint.id}`);
            currentCheckpoint = null;
            if (!item) {
                return;
            }

            const dropdown = item.querySelector('.clicked');
            if (!dropdown) {
                return;
            }

            dropdown.classList.remove('clicked');
            dropdown.innerHTML = '&#57689;';
        }
    });

    panel.on('show', () => {
        toggleTopButtons();

        events.push(editor.on('permissions:writeState', (writeEnabled) => {
            // hide all dropdowns if we no longer have write access
            panel.innerElement.querySelectorAll('.dropdown').forEach((dropdown) => {
                dropdown.ui.hidden = !writeEnabled;
            });

            // hide new checkpoint button if we no longer have write access
            toggleTopButtons();
        }));

        events.push(projectUserSettings.on('favoriteBranches:insert', panel.updateFavorite));
        events.push(projectUserSettings.on('favoriteBranches:remove', panel.updateFavorite));

        if (!panelCheckpoints.hidden) {
            // go through all the checkpoint list items and call onAddedToDom() to recalculate
            // whether we need to show read more or not
            const listItems = listCheckpoints.element.querySelectorAll('.checkpoint-widget');
            for (let i = 0, len = listItems.length; i < len; i++) {
                const item = listItems[i].ui;
                item.onAddedToDom();
            }
        }
    });

    // clean up
    panel.on('hide', () => {
        if (currentCheckpointListRequest) {
            currentCheckpointListRequest.abort?.();
            currentCheckpointListRequest = null;
        }

        // restore state of buttons
        btnLoadMore.disabled = false;
        btnLoadMore.text = 'LOAD MORE';
        listCheckpoints.hidden = false;
        spinner.classList.add('hidden');
        miniSpinner.classList.add('hidden');

        events.forEach((evt) => {
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
    editor.method('picker:versioncontrol:widget:checkpoints', () => {
        return panel;
    });

    // Creates single widget for a checkpoint useful for other panels
    // that show checkpoints
    editor.method('picker:versioncontrol:widget:checkpoint', createCheckpointWidget);
});
