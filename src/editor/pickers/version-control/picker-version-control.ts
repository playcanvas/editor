import { LegacyButton } from '../../../common/ui/button.ts';
import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyListItem } from '../../../common/ui/list-item.ts';
import { LegacyList } from '../../../common/ui/list.ts';
import { LegacyMenuItem } from '../../../common/ui/menu-item.ts';
import { LegacyMenu } from '../../../common/ui/menu.ts';
import { LegacyPanel } from '../../../common/ui/panel.ts';
import { LegacySelectField } from '../../../common/ui/select-field.ts';
import { LegacyTextField } from '../../../common/ui/text-field.ts';
import { handleCallback } from '../../../common/utils.ts';

editor.once('load', () => {
    if (config.project.settings.useLegacyScripts) {
        return;
    }

    const events = [];

    const projectUserSettings = editor.call('settings:projectUser');
    let branches = {}; // branches by id

    let branchesSkip = null;
    let selectedBranch = null;
    let showNewCheckpointOnLoad = false;

    let currentCheckpointId = null;

    // main panel
    const panel = new LegacyPanel();
    panel.class.add('picker-version-control');
    editor.call('picker:project:registerMenu', 'version control', 'Version Control', panel);
    panel.flex = true;

    // hide version control picker if we are not part of the team
    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'version control', false);
    }
    editor.on('permissions:set', () => {
        editor.call('picker:project:toggleMenu', 'version control', editor.call('permissions:read'));
    });

    // branches container panel
    const panelBranchesContainer = new LegacyPanel();
    panelBranchesContainer.class.add('branches-container');
    panel.append(panelBranchesContainer);
    panelBranchesContainer.flex = true;

    // branches top
    // var panelBranchesTop = new Panel();
    // panelBranchesTop.class.add('branches-top');
    // panelBranchesTop.flex = true;
    // panelBranchesContainer.append(panelBranchesTop);

    // branches filter
    const panelBranchesFilter = new LegacyPanel();
    panelBranchesFilter.class.add('branches-filter');
    panelBranchesFilter.flex = true;
    panelBranchesContainer.append(panelBranchesFilter);

    // branches list
    let selected;
    const listBranches = new LegacyList();

    // search
    let lastSearch = '';

    const branchNameValid = function (branchName) {
        if (lastSearch === '') return true;
        const result =  editor.call('search:items', [[branchName, branchName]], lastSearch);
        return result.length > 0;
    };

    const performSearch = function () {
        branchesSkip = null;
        Object.values(branches).forEach((branch) => {
            getBranchListItem(branch.id).hidden = !branchNameValid(branch.name);
        });

        if (selected) {
            const item = getBranchListItem(selected.id);
            if (item) {
                item.selected = true;
            }
        }
    };

    const search = new LegacyTextField({
        placeholder: 'Search'
    });
    search.blurOnEnter = false;
    search.keyChange = true;
    search.class.add('search');
    search.class.add('version-control-search');
    search.renderChanges = false;
    panel.prepend(search);


    const searchClear = document.createElement('div');
    searchClear.innerHTML = '&#57650;';
    searchClear.classList.add('clear');
    search.element.appendChild(searchClear);

    searchClear.addEventListener('click', () => {
        search.value = '';
    }, false);

    search.flexGrow = 1;
    panelBranchesFilter.append(search);

    search.on('change', (value) => {
        value = value.trim();

        if (lastSearch === value) return;
        lastSearch = value;

        if (value) {
            search.class.add('not-empty');
        } else {
            search.class.remove('not-empty');
        }

        performSearch();
    });

    // filter
    const fieldBranchesFilter = new LegacySelectField({
        options: [{
            v: 'open', t: 'Open Branches'
        }, {
            v: 'favorite', t: 'Favorite Branches'
        }, {
            v: 'closed', t: 'Closed Branches'
        }]
    });
    fieldBranchesFilter.value = 'favorite';
    fieldBranchesFilter.flexGrow = 1;
    panelBranchesFilter.append(fieldBranchesFilter);

    // branches main panel
    const panelBranches = new LegacyPanel();
    panelBranches.class.add('branches');
    panelBranchesContainer.append(panelBranches);
    panelBranches.append(listBranches);

    const loadMoreListItem = new LegacyListItem();
    loadMoreListItem.hidden = true;
    loadMoreListItem.class.add('load-more');
    const btnLoadMoreBranches = new LegacyButton({
        text: 'LOAD MORE'
    });
    loadMoreListItem.element.append(btnLoadMoreBranches.element);
    btnLoadMoreBranches.on('click', (e) => {
        e.stopPropagation(); // do not select parent list item on click
        loadBranches();
    });

    // right side container panel
    const panelRight = new LegacyPanel();
    panelRight.class.add('side-panel');
    panelRight.flex = true;
    panelRight.flexGrow = 1;
    panel.append(panelRight);

    const showRightSidePanel = function (panel) {
        // hide all right side panels first
        let p = panelRight.innerElement.firstChild;
        while (p && p.ui) {
            p.ui.hidden = true;
            p = p.nextSibling;
        }

        // show specified panel
        if (panel) {
            panel.hidden = false;
        }
    };

    // checkpoints panel
    const panelCheckpoints = editor.call('picker:versioncontrol:widget:checkpoints');
    panelRight.append(panelCheckpoints);

    const panelDiffCheckpoints = editor.call('picker:versioncontrol:widget:diffCheckpoints');
    panelDiffCheckpoints.hidden = true;
    panel.append(panelDiffCheckpoints);

    panelCheckpoints.on('checkpoint:new', () => {
        showRightSidePanel(panelCreateCheckpoint);
    });

    panelCheckpoints.on('checkpoint:restore', (checkpoint) => {
        showRightSidePanel(panelRestoreCheckpoint);
        panelRestoreCheckpoint.setCheckpoint(checkpoint);
    });

    panelCheckpoints.on('checkpoint:hardReset', (checkpoint) => {
        showRightSidePanel(panelHardResetCheckpoint);
        panelHardResetCheckpoint.setCheckpoint(checkpoint);
    });

    panelCheckpoints.on('checkpoint:branch', (checkpoint, branch) => {
        showRightSidePanel(panelCreateBranch);
        panelCreateBranch.setSourceBranch(branch || panelCheckpoints.branch);
        panelCreateBranch.setCheckpoint(checkpoint);
    });

    panelCheckpoints.on('checkpoint:diff', () => {
        panelDiffCheckpoints.hidden = false;
    });

    editor.on('checkpoint:diff:select', (branch, checkpoint) => {
        let numSelected = panelDiffCheckpoints.getSelectedCount();
        panel.class.remove(`diff-checkpoints-selected-${numSelected}`);
        panelDiffCheckpoints.onCheckpointSelected(branch, checkpoint);
        numSelected = panelDiffCheckpoints.getSelectedCount();
        if (numSelected) {
            panel.class.add(`diff-checkpoints-selected-${numSelected}`);
        }
    });

    editor.on('checkpoint:diff:deselect', (branch, checkpoint) => {
        let numSelected = panelDiffCheckpoints.getSelectedCount();
        panel.class.remove(`diff-checkpoints-selected-${numSelected}`);
        panelDiffCheckpoints.onCheckpointDeselected(branch, checkpoint);
        numSelected = panelDiffCheckpoints.getSelectedCount();
        if (numSelected) {
            panel.class.add(`diff-checkpoints-selected-${numSelected}`);
        }
    });

    panelDiffCheckpoints.on('show', () => {
        panel.class.add('diff-mode');
        panelCheckpoints.toggleDiffMode(true);
    });

    panelDiffCheckpoints.on('hide', () => {
        panel.class.remove('diff-mode');
        panelCheckpoints.toggleDiffMode(false);
    });

    // new checkpoint panel
    var panelCreateCheckpoint = editor.call('picker:versioncontrol:widget:createCheckpoint');
    panelCreateCheckpoint.hidden = true;
    panelRight.append(panelCreateCheckpoint);

    // create checkpoint progress
    const panelCreateCheckpointProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Creating checkpoint',
        finishText: 'Checkpoint created',
        errorText: 'Failed to create new checkpoint'
    });
    panelCreateCheckpointProgress.hidden = true;
    panelRight.append(panelCreateCheckpointProgress);

    // generate diff progress panel
    const panelGenerateDiffProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Getting changes',
        finishText: 'Showing changes',
        errorText: 'Failed to get changes'
    });
    panelGenerateDiffProgress.hidden = true;
    panelRight.append(panelGenerateDiffProgress);

    // new branch panel
    var panelCreateBranch = editor.call('picker:versioncontrol:widget:createBranch');
    panelCreateBranch.hidden = true;
    panelRight.append(panelCreateBranch);

    // create branch progress
    const panelCreateBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Creating branch',
        finishText: 'Branch created - refreshing the browser',
        errorText: 'Failed to create new branch'
    });
    panelCreateBranchProgress.hidden = true;
    panelRight.append(panelCreateBranchProgress);

    // close branch panel
    const panelCloseBranch = editor.call('picker:versioncontrol:widget:closeBranch');
    panelCloseBranch.hidden = true;
    panelRight.append(panelCloseBranch);

    // close progress
    const panelCloseBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Closing branch',
        finishText: 'Branch closed',
        errorText: 'Failed to close branch'
    });
    panelCloseBranchProgress.hidden = true;
    panelRight.append(panelCloseBranchProgress);

    // Enable or disable the clickable parts of this picker
    const togglePanels = function (enabled) {
        editor.call('picker:project:setClosable', enabled && config.scene.id);
        editor.call('picker:project:toggleLeftPanel', enabled);
        // panelBranchesTop.disabled = !enabled;
        panelBranches.disabled = !enabled;
        panelBranchesFilter.disabled = !enabled;
    };

    const checkpointCallbackQueue = [];
    const createCheckpoint = function (branchId, description, callback) {
        togglePanels(false);
        showRightSidePanel(panelCreateCheckpointProgress);

        // push callback to queue
        checkpointCallbackQueue.push(callback);

        // NOTE: do not handle callback here in case checkpoint takes a while to create
        // and request times out. Callback is handled through messenger event
        editor.api.globals.rest.checkpoints.checkpointCreate({
            projectId: config.project.id,
            branchId,
            description
        });
    };

    const showCheckpoints = function () {
        showRightSidePanel(panelCheckpoints);
    };

    // Close branch
    panelCloseBranch.on('cancel', () => {
        showCheckpoints();
    });
    panelCloseBranch.on('confirm', (data) => {
        togglePanels(false);

        const close = function () {
            showRightSidePanel(panelCloseBranchProgress);

            handleCallback(editor.api.globals.rest.branches.branchClose({
                branchId: panelCloseBranch.branch.id
            }), (err) => {
                panelCloseBranchProgress.finish(err);
                // if there was an error re-add the item to the list
                if (err) {
                    togglePanels(true);
                } else {
                    // remove item from list
                    setTimeout(() => {
                        togglePanels(true);
                        showCheckpoints();
                    }, 1000);
                }
            });
        };

        if (panelCloseBranch.createTargetCheckpoint) {
            // take a checkpoint first
            createCheckpoint(panelCloseBranch.branch.id, `Checkpoint before closing branch "${panelCloseBranch.branch.name}"`, close);
        } else {
            close();
        }

    });

    // open branch progress panel
    const panelOpenBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Opening branch',
        finishText: 'Branch opened',
        errorText: 'Failed to open branch'
    });
    panelOpenBranchProgress.hidden = true;
    panelRight.append(panelOpenBranchProgress);

    const panelDeleteBranch = editor.call('picker:versioncontrol:widget:deleteBranch');
    panelDeleteBranch.hidden = true;
    panelRight.append(panelDeleteBranch);

    // delete branch progress panel
    const panelDeleteBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Deleting branch',
        finishText: 'Branch deleted',
        errorText: 'Failed to delete branch'
    });
    panelDeleteBranchProgress.hidden = true;
    panelRight.append(panelDeleteBranchProgress);

    // Delete branch
    panelDeleteBranch.on('cancel', () => {
        showCheckpoints();
    });
    panelDeleteBranch.on('confirm', (data) => {
        togglePanels(false);

        showRightSidePanel(panelDeleteBranchProgress);

        handleCallback(editor.api.globals.rest.branches.branchDelete({
            branchId: panelDeleteBranch.branch.id
        }), (err) => {
            panelDeleteBranchProgress.finish(err);
            // if there was an error re-add the item to the list
            if (err) {
                togglePanels(true);
            } else {
                // remove item from list
                setTimeout(() => {
                    togglePanels(true);
                    showCheckpoints();
                }, 1000);
            }
        });
    });

    // merge branches panel
    const panelMergeBranches = editor.call('picker:versioncontrol:widget:mergeBranches');
    panelMergeBranches.hidden = true;
    panelRight.append(panelMergeBranches);

    // merge branches progress
    const panelMergeBranchesProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Attempting to auto merge branches',
        finishText: 'Merge ready - Opening Merge Review',
        errorText: 'Unable to auto merge'
    });
    panelMergeBranchesProgress.hidden = true;
    panelRight.append(panelMergeBranchesProgress);

    // Merge branches
    panelMergeBranches.on('cancel', () => {
        showCheckpoints();
    });
    panelMergeBranches.on('confirm', () => {
        const sourceBranch = panelMergeBranches.sourceBranch;
        const destinationBranch = panelMergeBranches.destinationBranch;
        const createSourceCheckpoint = panelMergeBranches.createSourceCheckpoint;
        const createTargetCheckpoint = panelMergeBranches.createTargetCheckpoint;
        const closeSourceBranch = panelMergeBranches.closeSourceBranch;

        togglePanels(false);

        const merge = function () {
            showRightSidePanel(panelMergeBranchesProgress);

            let evtOnMergeCreated = editor.on('messenger:merge.new', (data) => {
                if (data.dst_branch_id !== config.self.branch.id) return;

                evtOnMergeCreated.unbind();
                evtOnMergeCreated = null;

                handleCallback(editor.api.globals.rest.merge.mergeGet({
                    mergeId: data.merge_id
                }), (err, data) => {
                    config.self.branch.merge = data;

                    editor.call('picker:project:close');
                    editor.call('picker:versioncontrol:mergeOverlay:hide'); // hide this in case it's open
                    editor.call('picker:conflictManager');
                });
            });

            handleCallback(editor.api.globals.rest.merge.mergeCreate({
                srcBranchId: sourceBranch.id,
                dstBranchId: destinationBranch.id,
                srcBranchClose: closeSourceBranch
            }), (err) => {
                if (err) {
                    console.error(err);
                }

                // if we have already hidden this panel then just return
                if (panel.hidden) return;

                // otherwise show error
                if (err && !/Request timed out/.test(err)) {
                    panelMergeBranchesProgress.finish(err);
                    togglePanels(true);

                    if (evtOnMergeCreated) {
                        evtOnMergeCreated.unbind();
                        evtOnMergeCreated = null;
                    }
                }
            });
        };

        const checkpointDescription = function (srcBranch, dstBranch) {
            return `Checkpoint before merging branch "${srcBranch.name}" [${srcBranch.latestCheckpointId.substring(0, 7)}] into "${dstBranch.name}" [${dstBranch.latestCheckpointId.substring(0, 7)}]`;
        };

        // FIXME: Move this checkpoint creation on merge create to backend
        if (createSourceCheckpoint) {
            // take a checkpoint in the source branch first
            createCheckpoint(sourceBranch.id, checkpointDescription(sourceBranch, destinationBranch), () => {
                if (createTargetCheckpoint) {
                    // take a checkpoint in the target branch first
                    createCheckpoint(config.self.branch.id, checkpointDescription(sourceBranch, destinationBranch), merge);
                } else {
                    merge();
                }
            });

        } else if (createTargetCheckpoint) {
            // take a checkpoint in the target branch first
            createCheckpoint(config.self.branch.id, checkpointDescription(sourceBranch, destinationBranch), merge);
        } else {
            merge();
        }
    });

    // restore checkpoint panel
    var panelRestoreCheckpoint = editor.call('picker:versioncontrol:widget:restoreCheckpoint');
    panelRestoreCheckpoint.hidden = true;
    panelRight.append(panelRestoreCheckpoint);

    // restore branch progress
    const panelRestoreCheckpointProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Restoring checkpoint',
        finishText: 'Checkpoint restored - refreshing the browser',
        errorText: 'Failed to restore checkpoint'
    });
    panelRestoreCheckpointProgress.hidden = true;
    panelRight.append(panelRestoreCheckpointProgress);

    // Restore checkpoints
    panelRestoreCheckpoint.on('cancel', () => {
        showCheckpoints();
    });
    panelRestoreCheckpoint.on('confirm', () => {
        togglePanels(false);

        const restore = function () {
            showRightSidePanel(panelRestoreCheckpointProgress);

            handleCallback(editor.api.globals.rest.checkpoints.checkpointRestore({
                checkpointId: panelRestoreCheckpoint.checkpoint.id,
                branchId: config.self.branch.id
            }), (err, data) => {
                panelRestoreCheckpointProgress.finish(err);
                if (err) {
                    togglePanels(true);
                } else {
                    // FIXME: Refresh handled by messenger
                }
            });
        };

        if (panelRestoreCheckpoint.createTargetCheckpoint) {
            // take a checkpoint first
            createCheckpoint(config.self.branch.id, `Checkpoint before restoring "${panelRestoreCheckpoint.checkpoint.id.substring(0, 7)}"`, restore);
        } else {
            restore();
        }
    });

    var panelHardResetCheckpoint = editor.call('picker:versioncontrol:widget:hardResetCheckpoint');
    panelHardResetCheckpoint.hidden = true;
    panelRight.append(panelHardResetCheckpoint);

    // hard reset progress
    const panelHardResetCheckpointProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Performing hard reset to checkpoint',
        finishText: 'Finished - refreshing the browser',
        errorText: 'Failed to hard reset to checkpoint'
    });
    panelHardResetCheckpointProgress.hidden = true;
    panelRight.append(panelHardResetCheckpointProgress);

    panelHardResetCheckpoint.on('cancel', () => {
        showCheckpoints();
    });

    panelHardResetCheckpoint.on('confirm', () => {
        togglePanels(false);

        showRightSidePanel(panelHardResetCheckpointProgress);

        handleCallback(editor.api.globals.rest.checkpoints.checkpointHardReset({
            checkpointId: panelHardResetCheckpoint.checkpoint.id,
            branchId: config.self.branch.id
        }), (err, data) => {
            panelHardResetCheckpointProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                // FIXME: Refresh handled by messenger
            }
        });
    });

    // switch branch progress
    const panelSwitchBranchProgress = editor.call('picker:versioncontrol:createProgressWidget', {
        progressText: 'Switching branch',
        finishText: 'Switched branch - refreshing the browser',
        errorText: 'Failed to switch branch'
    });
    panelSwitchBranchProgress.hidden = true;
    panelRight.append(panelSwitchBranchProgress);

    // new branch button
    // var btnNewBranch = new Button({
    //     text: 'NEW BRANCH'
    // });
    // btnNewBranch.flexGrow = 1;
    // btnNewBranch.class.add('icon', 'create');
    // panelBranchesTop.append(btnNewBranch);

    // branch for which context menu is open
    let contextBranch = null;

    // branches context menu
    const menuBranches = new LegacyMenu();
    menuBranches.class.add('version-control');

    // when the branches context menu is closed 'unclick' dropdowns
    menuBranches.on('open', (open) => {
        if (open || !contextBranch) return;

        const item = document.getElementById(`branch-${contextBranch.id}`);
        if (!item) return;

        const dropdown = item.querySelector('.clicked');
        if (!dropdown) return;

        dropdown.classList.remove('clicked');
        dropdown.innerHTML = '&#57689;';

        if (!open) {
            contextBranch = null;
            menuBranches.contextBranchIsFavorite = false;
        }
    });

    // checkout branch
    const menuBranchesSwitchTo = new LegacyMenuItem({
        text: 'Switch To This Branch',
        value: 'switch-branch'
    });
    menuBranches.append(menuBranchesSwitchTo);

    // switch to branch
    menuBranchesSwitchTo.on('select', () => {
        if (contextBranch) {
            togglePanels(false);
            showRightSidePanel(panelSwitchBranchProgress);
            handleCallback(editor.api.globals.rest.branches.branchCheckout({
                branchId: contextBranch.id
            }), (err, data) => {
                panelSwitchBranchProgress.finish(err);
                if (err) {
                    togglePanels(true);
                }
                // FIXME: Refresh handled by messenger
            });
        }
    });

    // favorite branch
    const menuBranchesFavorite = new LegacyMenuItem({
        text: 'Favorite This Branch',
        value: 'favorite-branch'
    });
    menuBranches.append(menuBranchesFavorite);

    // favorite branch
    menuBranchesFavorite.on('select', () => {
        if (!contextBranch) return;
        if (menuBranches.contextBranchIsFavorite) {
            const index = projectUserSettings.get('favoriteBranches').indexOf(contextBranch.id);
            if (index >= 0) {
                projectUserSettings.remove('favoriteBranches', index);
            }
        } else {
            projectUserSettings.insert('favoriteBranches', contextBranch.id);
        }
    });

    // merge branch
    const menuBranchesMerge = new LegacyMenuItem({
        text: 'Merge Into Current Branch',
        value: 'merge-branch'
    });
    menuBranches.append(menuBranchesMerge);

    // merge branch
    menuBranchesMerge.on('select', () => {
        if (contextBranch) {
            showRightSidePanel(panelMergeBranches);
            panelMergeBranches.setSourceBranch(contextBranch);
            panelMergeBranches.setDestinationBranch(config.self.branch);
        }
    });


    // close branch
    const menuBranchesClose = new LegacyMenuItem({
        text: 'Close This Branch',
        value: 'close-branch'
    });
    menuBranches.append(menuBranchesClose);

    // close branch
    menuBranchesClose.on('select', () => {
        if (contextBranch) {
            showRightSidePanel(panelCloseBranch);
            panelCloseBranch.setBranch(contextBranch);
        }
    });

    // open branch
    const menuBranchesOpen = new LegacyMenuItem({
        text: 'Re-Open This Branch',
        value: 'open-branch'
    });
    menuBranches.append(menuBranchesOpen);

    // open branch
    menuBranchesOpen.on('select', () => {
        if (!contextBranch) return;

        const branch = contextBranch;

        togglePanels(false);
        showRightSidePanel(panelOpenBranchProgress);

        handleCallback(editor.api.globals.rest.branches.branchOpen({
            branchId: branch.id
        }), (err) => {
            panelOpenBranchProgress.finish(err);
            if (err) {
                togglePanels(true);
            } else {
                // do this in a timeout to give time for the
                // success message to appear
                setTimeout(() => {
                    togglePanels(true);
                    showCheckpoints();
                }, 1000);
            }
        });
    });

    // delete branch
    const menuBranchesDelete = new LegacyMenuItem({
        text: 'Delete This Branch',
        value: 'delete-branch'
    });
    menuBranches.append(menuBranchesDelete);

    menuBranchesDelete.on('select', () => {
        if (contextBranch) {
            showRightSidePanel(panelDeleteBranch);
            panelDeleteBranch.setBranch(contextBranch);
        }
    });

    // vc graph
    const menuVcGraph = new LegacyMenuItem({
        text: 'Version Control Graph',
        value: 'show-vc-graph'
    });

    menuBranches.append(menuVcGraph);

    menuVcGraph.on('select', () => {
        if (contextBranch) {
            editor.call('vcgraph:showGraphPanel', { branchId: contextBranch.id });
        }
    });

    // Filter context menu items
    menuBranches.on('open', () => {
        const writeAccess = editor.call('permissions:write');

        menuBranchesFavorite.text = `${menuBranches.contextBranchIsFavorite ? 'Unf' : 'F'}avorite This Branch`;

        menuBranchesClose.hidden = !writeAccess || !contextBranch || contextBranch.closed || contextBranch.id === config.project.masterBranch || contextBranch.id === projectUserSettings.get('branch');
        menuBranchesDelete.hidden = !writeAccess || !contextBranch || contextBranch.id === config.project.masterBranch || contextBranch.id === projectUserSettings.get('branch');
        menuBranchesOpen.hidden = !writeAccess || !contextBranch || !contextBranch.closed;

        menuBranchesFavorite.hidden = !writeAccess || !contextBranch || contextBranch.id === projectUserSettings.get('branch');
        menuBranchesSwitchTo.hidden = !contextBranch || contextBranch.id === projectUserSettings.get('branch') || contextBranch.closed;
        menuBranchesMerge.hidden = !writeAccess || !contextBranch || contextBranch.id === projectUserSettings.get('branch') || contextBranch.closed;
    });

    editor.call('layout.root').append(menuBranches);

    // Select specified branch and show its checkpoints
    const selectBranch = function (branch) {
        selectedBranch = branch;
        showCheckpoints();

        panelCheckpoints.setBranch(branch);
        panelCheckpoints.loadCheckpoints();
    };

    const createBranchListItem = function (branch) {
        const item = new LegacyListItem({
            allowDeselect: false
        });
        item.branch = branch;
        item.element.id = `branch-${branch.id}`;

        const panel = new LegacyPanel();
        item.element.appendChild(panel.element);

        const labelIcon = new LegacyLabel({
            text: '&#58208;',
            unsafe: true
        });
        labelIcon.class.add('icon');
        // TODO: should this be a css class? feels bad to made another class just for this fontSize change
        labelIcon.style.fontSize = '8px';
        panel.append(labelIcon);

        const labelName = new LegacyLabel({
            text: branch.name
        });
        labelName.class.add('name', 'selectable');
        panel.append(labelName);
        if (branch.closed) {
            labelName.class.add('closed-branch');
        }

        const labelBranchId = new LegacyLabel({
            text: branch.id
        });
        labelBranchId.class.add('branch-id', 'selectable');
        panel.append(labelBranchId);

        // dropdown
        const dropdown = new LegacyButton({
            text: '&#57689;'
        });
        dropdown.branch = branch;
        dropdown.class.add('dropdown');
        panel.append(dropdown);

        Object.defineProperty(item, 'isFavorite', {
            get: function () {
                return this._isFavorite;
            },
            set: function (value) {
                if (value !== this._isFavorite) {
                    this._isFavorite = Boolean(value);
                    labelIcon.text = this._isFavorite ? '&#9733;' : branch.closed ? '&#57650;' : '&#58208;';
                    labelIcon.style.fontSize = this._isFavorite ? '10px' : branch.closed ? '12px' : '8px';
                }
            }
        });

        const favorites = projectUserSettings.get('favoriteBranches');
        item.isFavorite = favorites && favorites.includes(branch.id);

        dropdown.on('click', (e) => {
            e.stopPropagation();

            if (panelCheckpoints.hidden) {
                showCheckpoints();
            }

            if (panelBranches.disabled) return;

            dropdown.class.add('clicked');
            dropdown.element.innerHTML = '&#57687;';

            contextBranch = branch;
            menuBranches.contextBranchIsFavorite = item.isFavorite;
            menuBranches.open = true;
            const rect = dropdown.element.getBoundingClientRect();
            menuBranches.position(rect.right - menuBranches.innerElement.clientWidth, rect.bottom);
        });

        listBranches.append(item);

        // select branch
        item.on('select', () => {
            selectBranch(branch);
        });

        // if we are currently showing an error and we click
        // on a branch that is already selected then hide the error
        // and show the checkpoints
        let wasItemSelectedBeforeClick = false;
        item.element.addEventListener('mousedown', () => {
            wasItemSelectedBeforeClick = item.selected;
        });
        item.element.addEventListener('mouseup', () => {
            if (!wasItemSelectedBeforeClick || !item.selected) return;
            wasItemSelectedBeforeClick = false;

            if (editor.call('picker:versioncontrol:isErrorWidgetVisible')) {
                showCheckpoints();
            }
        });

        // if this is our current branch then change the status icon
        // and hide the dropdown button because it doesn't currently
        // have any available actions for the current branch
        if (branch.id === config.self.branch.id) {
            labelIcon.class.add('active');
            dropdown.hidden = true;
        }
    };

    // Get the list item for a branch
    var getBranchListItem = function (branchId) {
        const item = document.getElementById(`branch-${branchId}`);
        return item && item.ui;
    };

    const updateBranchFavorite = function (branchId) {
        const item = getBranchListItem(branchId);
        if (item) {
            item.isFavorite = projectUserSettings.get('favoriteBranches').includes(item.branch.id);
        }
    };

    function viewDiff(srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId, histItem, onShowDiffCallback) {
        panelDiffCheckpoints.hidden = true;
        togglePanels(false);
        showRightSidePanel(panelGenerateDiffProgress);

        handleCallback(editor.api.globals.rest.diff.diffCreate({
            srcBranchId: srcBranchId,
            srcCheckpointId: srcCheckpointId,
            dstBranchId: dstBranchId,
            dstCheckpointId: dstCheckpointId,
            histItem: histItem
        }), (err, diff) => {
            panelGenerateDiffProgress.finish(err);

            togglePanels(true);

            if (!err) {
                const hasChanges = diff.numConflicts !== 0;

                if (hasChanges) {
                    editor.call('picker:project:close');
                    editor.call('picker:versioncontrol:mergeOverlay:hide'); // hide this in case it's open
                    editor.call('picker:diffManager', diff);
                } else {
                    panelGenerateDiffProgress.setMessage('There are no changes');
                    setTimeout(() => {
                        editor.call('vcgraph:moveToForeground');
                        showCheckpoints();
                    }, 1500);
                }

                if (onShowDiffCallback) {
                    onShowDiffCallback(hasChanges);
                }
            }
        });
    }

    function viewDiffFromShowCheckpoints(srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId) {
        viewDiff(srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId);
    }

    function viewDiffFromCreateCheckpoint() {
        const branch = config.self.branch;
        viewDiff(branch.id, null, branch.id, branch.latestCheckpointId, null, (shownDiff) => {
            // Only show the create new checkpoint panel on if we've shown a diff window
            if (shownDiff) {
                showNewCheckpointOnLoad = true;
            }
        });
    }

    panelDiffCheckpoints.on('diff', viewDiffFromShowCheckpoints);
    panelCheckpoints.on('diff', viewDiffFromShowCheckpoints);
    panelCreateCheckpoint.on('diff', viewDiffFromCreateCheckpoint);

    // show create branch panel
    // btnNewBranch.on('click', function () {
    //     showRightSidePanel(panelCreateBranch);
    //     panelCreateBranch.setSourceBranch(config.self.branch);
    //     if (config.self.branch.latestCheckpointId) {
    //         panelCreateBranch.setCheckpointId(config.self.branch.latestCheckpointId);
    //     }
    // });

    // Create checkpoint
    panelCreateCheckpoint.on('cancel', () => {
        // we need to load the checkpoints if we cancel creating checkpoints
        // because initially we might have opened this picker by showing the create checkpoint
        // panel without having a chance to load the checkpoints first
        if (!panelCheckpoints.checkpoints)  {
            selectBranch(selectedBranch);
        } else {
            showCheckpoints();
        }
    });
    panelCreateCheckpoint.on('confirm', (data) => {
        createCheckpoint(config.self.branch.id, data.description, (checkpoint) => {
            setTimeout(() => {
                togglePanels(true);

                // show checkpoints unless they haven't been loaded yet in which
                // case re-select the branch which reloads the checkpoints
                if (!panelCheckpoints.checkpoints) {
                    selectBranch(selectedBranch);
                } else {
                    showCheckpoints();
                }
            }, 1000);
        });
    });

    // Create branch
    panelCreateBranch.on('cancel', showCheckpoints);
    panelCreateBranch.on('confirm', (data) => {
        togglePanels(false);
        showRightSidePanel(panelCreateBranchProgress);

        const params = {
            name: data.name,
            projectId: config.project.id,
            sourceBranchId: data.sourceBranchId
        };

        if (panelCreateBranch.checkpoint) {
            params.sourceCheckpointId = panelCreateBranch.checkpoint.id;
        }

        handleCallback(editor.api.globals.rest.branches.branchCreate({
            name: params.name,
            projectId: params.projectId,
            sourceBranchId: params.sourceBranchId,
            sourceCheckpointId: params.sourceCheckpointId
        }), (err, result) => {
            // FIXME: Refresh handled by messenger
        });
    });

    // show overlay when branch creation ended
    events.push(editor.on('messenger:branch.createEnded', (data) => {
        if (data.user_id !== config.self.id) {
            return;
        }
        const err = data.status === 'error' ? data.message : null;
        panelCreateBranchProgress.finish(err);
        if (err) {
            togglePanels(true);
        } else {
            // FIXME: Refresh handled by messenger
        }
    }));

    var loadBranches = function () {
        // change status of loading button
        btnLoadMoreBranches.disabled = true;
        btnLoadMoreBranches.text = 'LOADING...';

        // if we are reloading
        // clear branch from checkpoints so that checkpoints are also hidden
        if (!branchesSkip) {
            panelCheckpoints.setBranch(null);
            selectedBranch = null;
        }

        // request branches from server
        handleCallback(editor.api.globals.rest.projects.projectBranches({
            skip: branchesSkip,
            closed: fieldBranchesFilter.value === 'closed',
            favorite: fieldBranchesFilter.value === 'favorite'
        }), (err, data) => {
            if (err) {
                return log.error(err);
            }

            // change status of loading button
            btnLoadMoreBranches.disabled = false;
            btnLoadMoreBranches.text = 'LOAD MORE';
            loadMoreListItem.hidden = !data.pagination.hasMore;


            // if we are re-loading the branch list then clear the current items
            if (!branchesSkip) {
                listBranches.clear();
                branches = {};

                // create current branch as first item
                if (fieldBranchesFilter.value !== 'closed') {
                    createBranchListItem(config.self.branch);
                    if (!branchNameValid(config.self.branch.name)) {
                        getBranchListItem(config.self.branch.id).hidden = true;
                    }
                }
            }

            // use last item as a marker for loading the next batch of branches
            const lastItem = data.result[data.result.length - 1];
            branchesSkip = lastItem ? lastItem.id : null;

            if (!data.result[0]) return;

            // convert array to dict
            branches = data.result.reduce((map, branch) => {
                map[branch.id] = branch;
                return map;
            }, branches);

            selected = selectedBranch;

            // create list items for each branch
            data.result.forEach((branch) => {
                // skip the current branch as we've already
                // created that first
                if (branch.id !== config.self.branch.id) {
                    createBranchListItem(branch);
                    if (!branchNameValid(branch.name)) {
                        getBranchListItem(branch.id).hidden = true;
                    }
                }
            });

            if (panelCheckpoints.currentBranch != null) {
                selected = panelCheckpoints.currentBranch;
            }

            // if we didn't find a proper selection then select our branch
            if (!selected) {
                selected = config.self.branch;
            }

            if (selected) {
                const item = getBranchListItem(selected.id);
                if (item) {
                    item.selected = true;
                }
            }

            // add load more list item in the end
            listBranches.append(loadMoreListItem);

            // show new checkpoint panel if necessary
            if (showNewCheckpointOnLoad) {
                showNewCheckpointOnLoad = false;
                showRightSidePanel(panelCreateCheckpoint);
            }
        });
    };

    // When the filter changes clear our branch list and reload branches
    fieldBranchesFilter.on('change', () => {
        branchesSkip = null;
        listBranches.clear();
        loadBranches();
    });

    // on show
    panel.on('show', () => {
        showCheckpoints();

        // load and create branches
        branchesSkip = null;
        selectedBranch = null;
        loadBranches();

        events.push(editor.on('permissions:writeState', (writeEnabled) => {
            // hide all dropdowns if we no longer have write access
            panelBranches.innerElement.querySelectorAll('.dropdown').forEach((dropdown) => {
                dropdown.ui.hidden = !writeEnabled || dropdown.ui.branch.id === config.self.branch.id;
            });
        }));

        events.push(editor.on('messenger:checkpoint.createStarted', (data) => {
            currentCheckpointId = data.checkpoint_id;
        }));

        // when a checkpoint is created add it to the list
        events.push(editor.on('messenger:checkpoint.createEnded', (data) => {

            if (currentCheckpointId === data.checkpoint_id) {
                const err = data.status === 'error' ? data.message : null;
                panelCreateCheckpointProgress.finish(err);
                if (err) {
                    return togglePanels(true);
                }

                // shift callback from front of queue and call it
                checkpointCallbackQueue.shift()?.();
            }

            if (data.status === 'error') return;

            // update latest checkpoint in current branches
            if (branches[data.branch_id]) {
                branches[data.branch_id].latestCheckpointId = data.checkpoint_id;
            }

            // add new checkpoint to checkpoint list
            // but only if the checkpoints panel has loaded its checkpoints.
            // Otherwise do not add it but wait until the panel is shown and all of its checkpoints
            // (including the new one) are loaded
            if (panelCheckpoints.branch.id === data.branch_id) {
                const existingCheckpoints = panelCheckpoints.checkpoints;
                if (existingCheckpoints) {
                    const h = editor.call('picker:versioncontrol:transformCheckpointData', data);
                    existingCheckpoints.unshift(h);
                    panelCheckpoints.setCheckpoints(existingCheckpoints);
                    panelCheckpoints.element.scrollTop = 0;
                }
            }
        }));

        // when a branch is unfavorited remove it from the list and select the next one
        events.push(projectUserSettings.on('favoriteBranches:remove', (branchId) => {
            // only handle when viewing favorites and when branch isn't current branch
            if (fieldBranchesFilter.value !== 'favorite' || config.self.branch.id === branchId) {
                return;
            }

            // we are seeing the favorite branches view so remove this branch from the list
            // and select the next branch
            const item = getBranchListItem(branchId);
            if (!item) return;

            let nextItem = null;
            if (item.selected) {
                if (item.element.nextSibling !== loadMoreListItem.element) {
                    nextItem = item.element.nextSibling;
                }

                if (!nextItem) {
                    nextItem = item.element.previousSibling;
                }
            }

            listBranches.remove(item);

            // select next or previous sibling
            if (nextItem && nextItem !== loadMoreListItem.element) {
                nextItem.ui.selected = true;
            }
        }));

        function removeBranchAndSelectNext(branchId, delay) {
            const item = getBranchListItem(branchId);
            if (!item) return;

            let nextItem = null;
            if (item.selected) {
                if (item.element.nextSibling !== loadMoreListItem.element) {
                    nextItem = item.element.nextSibling;
                }

                if (!nextItem) {
                    nextItem = item.element.previousSibling;
                }
            }

            listBranches.remove(item);

            // select next or previous sibling
            if (nextItem && nextItem !== loadMoreListItem.element) {

                if (delay) {
                    setTimeout(() => {
                        nextItem.ui.selected = true;
                    }, delay);
                } else {
                    nextItem.ui.selected = true;
                }
            }
        }

        // when a branch is closed remove it from the list and select the next one
        events.push(editor.on('messenger:branch.close', (data) => {
            if (fieldBranchesFilter.value === 'closed') {
                return;
            }

            // if the progress panel is open it means we are the ones
            // closing the branch (or some other branch..) - so wait a bit
            // so that we can show the progress end message before selecting another branch
            const delay = (panelCloseBranchProgress.hidden ? 0 : 500);

            // we are seeing the open branches view so remove this branch from the list
            // and select the next branch
            removeBranchAndSelectNext(data.branch_id, delay);
        }));

        // when a branch is deleted remove it from the list and select the next one
        events.push(editor.on('messenger:branch.delete', (data) => {
            // if the progress panel is open it means we are the ones
            // deleting the branch (or some other branch..) - so wait a bit
            // so that we can show the progress end message before selecting another branch
            const delay = (panelDeleteBranchProgress.hidden ? 0 : 500);

            removeBranchAndSelectNext(data.branch_id, delay);
        }));

        events.push(editor.on('messenger:branch.open', (data) => {
            if (fieldBranchesFilter.value === 'open') {
                return;
            }

            // we are seeing the closed branches list so remove this
            // branch from this list and select the next one or if there
            // are no more branches in this list then view the open branches
            const item = getBranchListItem(data.branch_id);
            if (!item) return;

            const wasSelected = item.selected;
            let nextItem = null;
            if (item.element.nextSibling !== loadMoreListItem.element) {
                nextItem = item.element.nextSibling;
            }

            if (!nextItem) {
                nextItem = item.element.previousSibling;
            }

            // remove branch from the list
            listBranches.remove(item);

            // select next or previous item
            const selectNext = function () {
                if (nextItem && wasSelected) {
                    nextItem.ui.selected = true;
                } else if (!nextItem) {
                    // if no more items exist in the list then view the open list
                    showRightSidePanel(null);
                    fieldBranchesFilter.value = 'open';
                }
            };

            // if the progress panel is open it means we are the ones
            // opening the branch (or some other branch..) - so wait a bit
            // so that we can show the progress end message before selecting another branch
            if (!panelOpenBranchProgress.hidden) {
                setTimeout(selectNext, 500);
            } else {
                // otherwise immediately select the next branch
                selectNext();
            }

        }));

        events.push(projectUserSettings.on('favoriteBranches:insert', updateBranchFavorite));
        events.push(projectUserSettings.on('favoriteBranches:remove', updateBranchFavorite));

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // on hide
    panel.on('hide', () => {
        showRightSidePanel(null);

        // clear checkpoint
        panelCheckpoints.setCheckpoints(null);
        panelCheckpoints.toggleLoadMore(false);

        // hide diff panel
        panelDiffCheckpoints.hidden = true;

        showNewCheckpointOnLoad = false;

        events.forEach((evt) => {
            evt.unbind();
        });
        events.length = 0;

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // Prevent viewport hovering when the picker is shown
    editor.on('viewport:hover', (state) => {
        if (state && !panel.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // Show the picker
    editor.method('picker:versioncontrol', () => {
        editor.call('picker:project', 'version control');
    });

    editor.method('picker:versioncontrol:transformCheckpointData', (data) => {
        return {
            id: data.checkpoint_id,
            user: {
                id: data.user_id,
                fullName: data.user_full_name
            },
            createdAt: new Date(data.created_at),
            description: data.description
        };
    });

    // hotkey to create new checkpoint
    editor.call('hotkey:register', 'new-checkpoint', {
        key: 's',
        ctrl: true,
        callback: function (e) {
            if (!editor.call('permissions:write')) return;
            if (editor.call('picker:isOpen:otherThan', 'project')) {
                return;
            }

            if (panel.hidden) {
                showNewCheckpointOnLoad = true;
                editor.call('picker:versioncontrol');
            } else {
                showRightSidePanel(panelCreateCheckpoint);
            }
        }
    });
});
