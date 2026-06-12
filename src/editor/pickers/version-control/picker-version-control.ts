import { Button, Container } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { createBranchSwitcher } from './branch-switcher';
import { setVcDialogHost, showVcDialog } from './dialogs';
import { createChangesPanel } from './panel-changes';
import { createDetailPanel } from './panel-detail';
import { createHistoryPanel } from './panel-history';
import { checkpointCreate as checkpointCreateJob, diffCreate } from '../../messenger/jobs';

editor.once('load', () => {
    if (config.project.settings.useLegacyScripts) {
        return;
    }

    const events: { unbind: () => void }[] = [];
    const projectUserSettings = editor.call('settings:projectUser');

    let viewedBranch: any = config.self.branch;
    let compareMode = false;
    let compareSlots: { branch: any; checkpoint: any | null }[] = [];
    let showNewCheckpointOnLoad = false;
    const retainedDiffs = new Set<string>();

    const diffId = (diff: any) => diff?.id ?? diff?.merge_id;

    const retainDiff = (diff: any) => {
        const id = diffId(diff);
        if (typeof id === 'string') {
            retainedDiffs.add(id);
        }
    };

    const releaseDiff = (id: string) => {
        if (!id || !retainedDiffs.delete(id)) {
            return;
        }
        editor.emit('picker:diffManager:closed', id);
        handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: id }), (err) => {
            if (err) {
                log.error(err);
            }
        });
    };

    const releaseDiffs = () => {
        [...retainedDiffs].forEach(releaseDiff);
    };

    // ---- layout ----
    const panel = new Container({ class: ['picker-version-control', 'picker-vc'], flex: true });
    editor.call('picker:project:registerMenu', 'version control', 'Version Control', panel);

    if (!editor.call('permissions:read')) {
        editor.call('picker:project:toggleMenu', 'version control', false);
    }
    editor.on('permissions:set', () => {
        editor.call('picker:project:toggleMenu', 'version control', editor.call('permissions:read'));
    });

    // floating surfaces must live inside the picker overlay (outside-click guard)
    setVcDialogHost(panel);

    // top bar
    const topBar = new Container({ class: 'vc-top-bar' });
    panel.append(topBar);

    const switcher = createBranchSwitcher(panel);
    topBar.append(switcher);

    const topActions = new Container({ class: 'vc-top-actions' });
    topBar.append(topActions);

    const btnGraph = new Button({ text: 'Graph', icon: 'E399' });
    topActions.append(btnGraph);

    const btnCompare = new Button({ text: 'Compare', icon: 'E236' });
    topActions.append(btnCompare);

    const btnCheckpoint = new Button({ text: 'Checkpoint', icon: 'E120', class: 'vc-primary' });
    topActions.append(btnCheckpoint);

    // body
    const body = new Container({ class: 'vc-body' });
    panel.append(body);

    const sidebar = new Container({ class: 'vc-sidebar' });
    body.append(sidebar);

    // viewing-other-branch banner
    const banner = document.createElement('div');
    banner.classList.add('vc-view-banner');
    banner.hidden = true;
    banner.innerHTML = 'Viewing <span class="name"></span>';
    const bannerReturn = document.createElement('button');
    bannerReturn.type = 'button';
    bannerReturn.classList.add('return');
    banner.appendChild(bannerReturn);
    sidebar.dom.appendChild(banner);

    // tabs
    const tabs = document.createElement('div');
    tabs.classList.add('vc-tabs');
    sidebar.dom.appendChild(tabs);

    const tabChanges = document.createElement('button');
    tabChanges.type = 'button';
    tabChanges.classList.add('vc-tab');
    tabChanges.textContent = 'Changes';
    tabs.appendChild(tabChanges);

    const tabHistory = document.createElement('button');
    tabHistory.type = 'button';
    tabHistory.classList.add('vc-tab', 'active');
    tabHistory.textContent = 'History';
    tabs.appendChild(tabHistory);

    const tabContent = new Container({ class: 'vc-tab-content' });
    sidebar.append(tabContent);

    const main = new Container({ class: 'vc-main' });
    body.append(main);

    // panels
    const changes = createChangesPanel();
    const history = createHistoryPanel();
    const detail = createDetailPanel();

    tabContent.append(changes.sidebar);
    tabContent.append(history);
    main.append(changes.summary);
    main.append(detail);

    // compare bar
    const compareBar = new Container({ class: 'vc-compare-bar', hidden: true });
    panel.append(compareBar);
    const slotA = document.createElement('span');
    slotA.classList.add('slot');
    compareBar.dom.appendChild(slotA);
    const arrow = document.createElement('span');
    arrow.textContent = '⇆';
    compareBar.dom.appendChild(arrow);
    const slotB = document.createElement('span');
    slotB.classList.add('slot');
    compareBar.dom.appendChild(slotB);
    const btnRunCompare = new Button({ text: 'Compare', class: 'vc-primary' });
    compareBar.append(btnRunCompare);

    // progress widgets (kept infra)
    const makeProgress = (progressText: string, finishText: string, errorText: string) => {
        const w = editor.call('picker:versioncontrol:createProgressWidget', { progressText, finishText, errorText });
        w.hidden = true;
        main.append(w);
        return w;
    };
    const progressCheckpoint = makeProgress('Creating checkpoint', 'Checkpoint created', 'Failed to create new checkpoint');
    const progressDiff = makeProgress('Getting changes', 'Showing changes', 'Failed to get changes');
    const progressBranch = makeProgress('Creating branch', 'Branch created - refreshing the browser', 'Failed to create new branch');
    const progressClose = makeProgress('Closing branch', 'Branch closed', 'Failed to close branch');
    const progressOpen = makeProgress('Opening branch', 'Branch opened', 'Failed to open branch');
    const progressDelete = makeProgress('Deleting branch', 'Branch deleted', 'Failed to delete branch');
    const progressMerge = makeProgress('Attempting to auto merge branches', 'Merge ready - Opening Merge Review', 'Unable to auto merge');
    const progressRestore = makeProgress('Restoring checkpoint', 'Checkpoint restored - refreshing the browser', 'Failed to restore checkpoint');
    const progressHardReset = makeProgress('Performing hard reset to checkpoint', 'Finished - refreshing the browser', 'Failed to hard reset to checkpoint');
    const progressSwitch = makeProgress('Switching branch', 'Switched branch - refreshing the browser', 'Failed to switch branch');

    const showProgress = (w: any | null) => {
        [progressCheckpoint, progressDiff, progressBranch, progressClose, progressOpen, progressDelete,
            progressMerge, progressRestore, progressHardReset, progressSwitch].forEach((p) => {
            p.hidden = p !== w;
        });
        const op = !!w;
        changes.summary.hidden = op || activeTab !== 'changes';
        detail.hidden = op || activeTab !== 'history';
    };

    let panelsEnabled = true;
    const togglePanels = (enabled: boolean) => {
        panelsEnabled = enabled;
        editor.call('picker:project:setClosable', enabled && config.scene.id);
        editor.call('picker:project:toggleLeftPanel', enabled);
        topBar.enabled = enabled;
        sidebar.enabled = enabled;
        compareBar.enabled = enabled;
    };

    // user navigation dismisses a finished (error) progress widget; never an active op
    const clearStaleProgress = () => {
        if (panelsEnabled) {
            showProgress(null);
        }
    };

    // ---- tab switching ----
    let activeTab: 'changes' | 'history' = 'history';

    const isViewingCurrent = () => viewedBranch.id === config.self.branch.id;

    const setTab = (tab: 'changes' | 'history') => {
        activeTab = tab;
        tabChanges.classList.toggle('active', tab === 'changes');
        tabHistory.classList.toggle('active', tab === 'history');
        changes.sidebar.hidden = tab !== 'changes';
        changes.summary.hidden = tab !== 'changes';
        history.hidden = tab !== 'history';
        detail.hidden = tab !== 'history';
        if (tab === 'changes') {
            changes.sidebar.refresh();
        }
    };

    const updateTabsState = () => {
        const canChanges = isViewingCurrent() && !compareMode;
        tabChanges.disabled = !canChanges;
        const count = changes.sidebar.count;
        tabChanges.textContent = count === null ? 'Changes' : `Changes · ${count}`;
        if (!canChanges && activeTab === 'changes') {
            setTab('history');
        }
    };

    changes.sidebar.on('count', updateTabsState);
    tabChanges.addEventListener('click', () => {
        if (!tabChanges.disabled) {
            clearStaleProgress();
            setTab('changes');
        }
    });
    tabHistory.addEventListener('click', () => {
        clearStaleProgress();
        setTab('history');
    });

    // ---- viewed branch ----
    const setViewedBranch = (branch: any) => {
        viewedBranch = branch;
        banner.hidden = isViewingCurrent();
        (banner.querySelector('.name') as HTMLElement).textContent = branch.name;
        bannerReturn.textContent = `Return to ${config.self.branch.name}`;
        history.setBranch(branch);
        detail.clear();
        updateTabsState();
        setTab('history');
    };

    bannerReturn.addEventListener('click', () => {
        clearStaleProgress();
        setViewedBranch(config.self.branch);
    });
    switcher.on('view', (branch: any) => {
        clearStaleProgress();
        setViewedBranch(branch);
    });

    // ---- history selection -> detail ----
    history.on('select', (checkpoint: any) => {
        if (!checkpoint) {
            detail.clear();
            return;
        }
        clearStaleProgress();
        const all = history.checkpoints || [];
        const index = all.findIndex((c: any) => c.id === checkpoint.id);
        const previous = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
        detail.render(checkpoint, previous, {
            branchId: viewedBranch.id,
            isCurrentBranch: isViewingCurrent(),
            canWrite: editor.call('permissions:write')
        });
    });

    // ---- diff viewing ----
    const presentDiff = (diff: any) => {
        retainDiff(diff);
        togglePanels(true);
        showProgress(null);
        requestAnimationFrame(() => {
            editor.call('picker:project:suspend');
            editor.call('picker:versioncontrol:mergeOverlay:hide');
            editor.call('picker:versioncontrol:diffPicker', diff);
        });
    };

    const showNoChanges = () => {
        progressDiff.setMessage('There are no changes');
        setTimeout(() => {
            editor.call('vcgraph:moveToForeground');
            showProgress(null);
        }, 1500);
    };

    const runDiff = (task: () => Promise<any>) => {
        togglePanels(false);
        showProgress(progressDiff);
        requestAnimationFrame(() => {
            task().then((diff: any) => {
                progressDiff.finish();
                togglePanels(true);
                if (diff && diff.numConflicts !== 0) {
                    presentDiff(diff);
                } else {
                    showNoChanges();
                }
            }).catch((err) => {
                progressDiff.finish(err instanceof Error ? err.message : `${err}`);
                togglePanels(true);
            });
        });
    };

    const viewDiff = (srcBranchId: string, srcCheckpointId: string | null, dstBranchId: string, dstCheckpointId: string | null) => {
        runDiff(() => diffCreate({ srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId }));
    };

    // cached diffs from the panels skip the expensive diffCreate job
    detail.on('openDiff', (checkpoint: any, previous: any, cached: any, pending: Promise<any>) => {
        if (cached && cached.numConflicts) {
            presentDiff(cached);
            return;
        }
        if (pending) {
            runDiff(() => pending);
            return;
        }
        viewDiff(viewedBranch.id, checkpoint.id, viewedBranch.id, previous.id);
    });
    changes.summary.on('openDiff', (cached: any) => {
        if (cached && cached.numConflicts) {
            presentDiff(cached);
            return;
        }
        const b = config.self.branch;
        viewDiff(b.id, null, b.id, b.latestCheckpointId);
    });

    // ---- compare mode ----
    const slotLabel = (slot: { branch: any; checkpoint: any | null }) => {
        return slot.checkpoint ?
            `${slot.checkpoint.id.substring(0, 7)} · ${slot.branch.name}` :
            `Working state · ${slot.branch.name}`;
    };

    const renderCompareBar = () => {
        slotA.textContent = compareSlots[0] ? slotLabel(compareSlots[0]) : 'Pick a checkpoint…';
        slotA.classList.toggle('full', !!compareSlots[0]);
        slotB.textContent = compareSlots[1] ? slotLabel(compareSlots[1]) : 'Pick another…';
        slotB.classList.toggle('full', !!compareSlots[1]);
        btnRunCompare.enabled = compareSlots.length === 2;
    };

    const setCompareMode = (on: boolean) => {
        compareMode = on;
        compareSlots = [];
        if (on) {
            btnCompare.class.add('vc-compare-active');
        } else {
            btnCompare.class.remove('vc-compare-active');
        }
        btnCompare.text = on ? 'Exit Compare' : 'Compare';
        compareBar.hidden = !on;
        history.setCompareMode(on);
        updateTabsState();
        if (on) {
            setTab('history');
            renderCompareBar();
        }
    };

    btnCompare.on('click', () => setCompareMode(!compareMode));

    history.on('compare:change', (slots: { branch: any; checkpoint: any | null }[]) => {
        compareSlots = slots;
        renderCompareBar();
    });

    btnRunCompare.on('click', () => {
        if (compareSlots.length !== 2) {
            return;
        }
        const [a, b] = compareSlots;
        setCompareMode(false);
        viewDiff(a.branch.id, a.checkpoint ? a.checkpoint.id : null, b.branch.id, b.checkpoint ? b.checkpoint.id : null);
    });

    // ---- checkpoint creation ----
    const createCheckpoint = (branchId: string, description: string, callback: (checkpoint?: any) => void, useOverlay = true) => {
        if (useOverlay) {
            togglePanels(false);
            showProgress(progressCheckpoint);
        }
        checkpointCreateJob({ projectId: config.project.id, branchId, description }).then((checkpoint) => {
            if (useOverlay) {
                progressCheckpoint.finish(null);
            }
            callback(checkpoint);
        }).catch((err) => {
            if (useOverlay) {
                progressCheckpoint.finish(err instanceof Error ? err.message : `${err}`);
            }
            togglePanels(true);
        });
    };

    // inline (no overlay) checkpoint creation from the pinned form;
    // the new row lands in history via messenger:checkpoint.createEnded
    changes.sidebar.on('create', (description: string) => {
        changes.sidebar.setBusy(true);
        checkpointCreateJob({ projectId: config.project.id, branchId: config.self.branch.id, description }).then(() => {
            changes.sidebar.resetForm();
            changes.sidebar.invalidate();
            changes.sidebar.refresh(true);
        }).catch((err) => {
            changes.sidebar.setBusy(false);
            log.error(err);
        });
    });

    // single entry point so compare mode and viewed branch are always reset first
    const openCheckpointForm = () => {
        if (compareMode) {
            setCompareMode(false);
        }
        if (!isViewingCurrent()) {
            setViewedBranch(config.self.branch);
        }
        clearStaleProgress();
        setTab('changes');
        changes.sidebar.focusForm();
    };

    btnCheckpoint.on('click', openCheckpointForm);

    // ---- branch operations ----
    switcher.on('switch', (branch: any) => {
        togglePanels(false);
        showProgress(progressSwitch);
        handleCallback(editor.api.globals.rest.branches.branchCheckout({ branchId: branch.id }), (err) => {
            progressSwitch.finish(err);
            if (err) {
                togglePanels(true);
            }
            // refresh handled by messenger
        });
    });

    switcher.on('newBranch', () => openNewBranchDialog(null));
    detail.on('newBranch', (checkpoint: any) => openNewBranchDialog(checkpoint));

    function openNewBranchDialog(checkpoint: any | null) {
        const source = checkpoint ? viewedBranch : config.self.branch;
        const fromId = checkpoint ? checkpoint.id : source.latestCheckpointId;
        const dialog = showVcDialog({
            title: 'New branch',
            body: ['From: ', { bold: `${fromId ? fromId.substring(0, 7) : 'latest'}` }, ` · ${checkpoint ? `checkpoint of ${source.name}` : `latest checkpoint of ${source.name}`}`],
            confirmText: 'Create Branch',
            input: { placeholder: 'Branch name' },
            onConfirm: ({ input }) => {
                if (!input) {
                    dialog.setError('Branch name is required');
                    return;
                }
                dialog.close();
                togglePanels(false);
                showProgress(progressBranch);
                handleCallback(editor.api.globals.rest.branches.branchCreate({
                    name: input,
                    projectId: config.project.id,
                    sourceBranchId: source.id,
                    sourceCheckpointId: checkpoint ? checkpoint.id : undefined
                }), (err) => {
                    if (panel.hidden) {
                        return;
                    }
                    // async success handled by messenger:branch.createEnded
                    if (err && !/Request timed out/.test(err)) {
                        progressBranch.finish(err);
                        togglePanels(true);
                    }
                });
            }
        });
    }

    switcher.on('merge', (branch: any) => {
        const dialog = showVcDialog({
            title: `Merge into ${config.self.branch.name}`,
            body: [{ bold: branch.name }, ' → ', { bold: config.self.branch.name }, '. Conflicts open the merge resolution view.'],
            confirmText: 'Merge',
            checkboxes: [
                { key: 'srcCheckpoint', label: `Take a checkpoint of ${branch.name} first`, value: true },
                { key: 'dstCheckpoint', label: `Take a checkpoint of ${config.self.branch.name} first`, value: true },
                { key: 'closeSrc', label: `Close ${branch.name} after merging`, value: false }
            ],
            onConfirm: ({ checks }) => {
                dialog.close();
                runMerge(branch, checks.srcCheckpoint, checks.dstCheckpoint, checks.closeSrc);
            }
        });
    });

    function runMerge(sourceBranch: any, createSrcCheckpoint: boolean, createDstCheckpoint: boolean, closeSrc: boolean) {
        togglePanels(false);

        const merge = () => {
            showProgress(progressMerge);

            let evtOnMergeCreated = editor.on('messenger:merge.new', (data: any) => {
                if (data.dst_branch_id !== config.self.branch.id) {
                    return;
                }
                evtOnMergeCreated.unbind();
                evtOnMergeCreated = null;
                handleCallback(editor.api.globals.rest.merge.mergeGet({ mergeId: data.merge_id }), (err, mergeData) => {
                    if (err) {
                        progressMerge.finish(err);
                        togglePanels(true);
                        return;
                    }
                    config.self.branch.merge = mergeData;
                    editor.call('picker:project:close');
                    editor.call('picker:versioncontrol:mergeOverlay:hide');
                    editor.call('picker:conflictManager');
                });
            });

            handleCallback(editor.api.globals.rest.merge.mergeCreate({
                srcBranchId: sourceBranch.id,
                dstBranchId: config.self.branch.id,
                srcBranchClose: closeSrc
            }), (err) => {
                if (panel.hidden) {
                    return;
                }
                if (err && !/Request timed out/.test(err)) {
                    progressMerge.finish(err);
                    togglePanels(true);
                    if (evtOnMergeCreated) {
                        evtOnMergeCreated.unbind();
                        evtOnMergeCreated = null;
                    }
                }
            });
        };

        const desc = `Checkpoint before merging branch "${sourceBranch.name}" into "${config.self.branch.name}"`;
        if (createSrcCheckpoint) {
            createCheckpoint(sourceBranch.id, desc, () => {
                if (createDstCheckpoint) {
                    createCheckpoint(config.self.branch.id, desc, merge);
                } else {
                    merge();
                }
            });
        } else if (createDstCheckpoint) {
            createCheckpoint(config.self.branch.id, desc, merge);
        } else {
            merge();
        }
    }

    switcher.on('close', (branch: any) => {
        const dialog = showVcDialog({
            title: `Close ${branch.name}?`,
            body: ['Closed branches can be re-opened later from the Closed filter.'],
            confirmText: 'Close Branch',
            checkboxes: [{ key: 'checkpoint', label: 'Take a checkpoint first', value: true }],
            onConfirm: ({ checks }) => {
                dialog.close();
                const close = () => {
                    showProgress(progressClose);
                    handleCallback(editor.api.globals.rest.branches.branchClose({ branchId: branch.id }), (err) => {
                        progressClose.finish(err);
                        togglePanels(true);
                        if (!err) {
                            setTimeout(() => showProgress(null), 1000);
                        }
                    });
                };
                togglePanels(false);
                if (checks.checkpoint) {
                    createCheckpoint(branch.id, `Checkpoint before closing branch "${branch.name}"`, close);
                } else {
                    close();
                }
            }
        });
    });

    switcher.on('open', (branch: any) => {
        togglePanels(false);
        showProgress(progressOpen);
        handleCallback(editor.api.globals.rest.branches.branchOpen({ branchId: branch.id }), (err) => {
            progressOpen.finish(err);
            togglePanels(true);
            if (!err) {
                setTimeout(() => showProgress(null), 1000);
            }
        });
    });

    switcher.on('delete', (branch: any) => {
        const dialog = showVcDialog({
            title: `Delete ${branch.name}?`,
            danger: true,
            body: ['This permanently deletes the branch and its history. Type the branch name to confirm.'],
            confirmText: 'Delete Branch',
            input: { placeholder: branch.name },
            confirmMatch: branch.name,
            onConfirm: () => {
                dialog.close();
                togglePanels(false);
                showProgress(progressDelete);
                handleCallback(editor.api.globals.rest.branches.branchDelete({ branchId: branch.id }), (err) => {
                    progressDelete.finish(err);
                    togglePanels(true);
                    if (!err) {
                        setTimeout(() => showProgress(null), 1000);
                    }
                });
            }
        });
    });

    switcher.on('graph', (branch: any) => {
        editor.call('vcgraph:showGraphPanel', { branchId: branch.id });
    });
    btnGraph.on('click', () => {
        editor.call('vcgraph:showGraphPanel', { branchId: viewedBranch.id });
    });

    // ---- restore / hard reset ----
    detail.on('restore', (checkpoint: any) => {
        const dialog = showVcDialog({
            title: 'Restore checkpoint?',
            body: ['The current state of ', { bold: config.self.branch.name }, ' becomes checkpoint ', { bold: checkpoint.id.substring(0, 7) }, '.'],
            confirmText: 'Restore',
            checkboxes: [{ key: 'checkpoint', label: 'Take a checkpoint of the current state first', value: true }],
            onConfirm: ({ checks }) => {
                dialog.close();
                const restore = () => {
                    showProgress(progressRestore);
                    handleCallback(editor.api.globals.rest.checkpoints.checkpointRestore({
                        checkpointId: checkpoint.id,
                        branchId: config.self.branch.id
                    }), (err) => {
                        progressRestore.finish(err);
                        if (err) {
                            togglePanels(true);
                        }
                    });
                };
                togglePanels(false);
                if (checks.checkpoint) {
                    createCheckpoint(config.self.branch.id, `Checkpoint before restoring "${checkpoint.id.substring(0, 7)}"`, restore);
                } else {
                    restore();
                }
            }
        });
    });

    detail.on('hardReset', (checkpoint: any) => {
        const dialog = showVcDialog({
            title: 'Hard reset?',
            danger: true,
            body: ['Deletes ALL checkpoints and changes after ', { bold: checkpoint.id.substring(0, 7) }, '. This cannot be undone. Type the checkpoint id (first 7 characters) to confirm.'],
            confirmText: 'Hard Reset',
            input: { placeholder: checkpoint.id.substring(0, 7) },
            confirmMatch: checkpoint.id.substring(0, 7),
            onConfirm: () => {
                dialog.close();
                togglePanels(false);
                showProgress(progressHardReset);
                handleCallback(editor.api.globals.rest.checkpoints.checkpointHardReset({
                    checkpointId: checkpoint.id,
                    branchId: config.self.branch.id
                }), (err) => {
                    progressHardReset.finish(err);
                    if (err) {
                        togglePanels(true);
                    }
                });
            }
        });
    });

    // ---- vc graph host (moved from old checkpoints widget) ----
    const vcGraphPanel = new Container({ class: ['picker-version-control', 'vc-graph-panel'], flex: true, hidden: true });
    editor.call('layout.root').append(vcGraphPanel);
    const vcNodeMenu = editor.call('vcgraph:makeNodeMenu', panel);
    editor.call('layout.root').append(vcNodeMenu);

    editor.method('vcgraph:closeGraphPanel', () => {
        editor.call('vcgraph:moveToForeground');
        vcGraphPanel.hidden = true;
        vcGraphPanel.clear();
    });
    editor.method('vcgraph:moveToBackground', () => vcGraphPanel.class.add('vc-graph-background'));
    editor.method('vcgraph:moveToForeground', () => vcGraphPanel.class.remove('vc-graph-background'));
    editor.method('vcgraph:isHidden', () => vcGraphPanel.hidden);
    editor.method('vcgraph:showGraphPanel', (h: any) => {
        vcGraphPanel.hidden = !vcGraphPanel.hidden;
        const vcGraphContainer = new Container({ class: 'vc-graph-container' });
        const vcGraphCloseBtn = new Button({ text: 'CLOSE', class: 'vc-graph-close-btn' });
        vcGraphCloseBtn.on('click', () => {
            editor.call('vcgraph:closeGraphPanel');
            if (h.closeVcPicker) {
                editor.call('picker:project:close');
            }
        });
        vcGraphPanel.append(vcGraphContainer);
        Object.assign(h, { vcGraphContainer, vcGraphCloseBtn, vcNodeMenu });
        editor.call('vcgraph:showInitial', h);
    });

    // ---- messenger list maintenance ----
    panel.on('show', () => {
        setViewedBranch(config.self.branch);
        changes.sidebar.invalidate();
        setCompareMode(false);
        setTab(showNewCheckpointOnLoad ? 'changes' : 'history');
        if (showNewCheckpointOnLoad) {
            showNewCheckpointOnLoad = false;
            changes.sidebar.focusForm();
        }
        showProgress(null);

        events.push(editor.on('permissions:writeState', () => {
            updateTabsState();
            // setBranch clears both the selection highlight and the detail pane
            if (history.branch) {
                history.setBranch(history.branch);
            }
        }));

        events.push(editor.on('messenger:checkpoint.createEnded', (data: any) => {
            if (data.status === 'error') {
                return;
            }
            const b = switcher.getBranch(data.branch_id);
            if (b) {
                b.latestCheckpointId = data.checkpoint_id;
            }
            if (config.self.branch.id === data.branch_id) {
                config.self.branch.latestCheckpointId = data.checkpoint_id;
                changes.sidebar.invalidate();
                // visible changes tab must not strand a stale list/skeleton
                if (activeTab === 'changes') {
                    changes.sidebar.refresh(true);
                }
            }
            if (history.branch && history.branch.id === data.branch_id && history.checkpoints) {
                history.prependCheckpoint(editor.call('picker:versioncontrol:transformCheckpointData', data));
            }
        }));

        events.push(editor.on('messenger:branch.close', (data: any) => {
            switcher.removeBranch(data.branch_id);
            if (viewedBranch.id === data.branch_id) {
                setViewedBranch(config.self.branch);
            }
        }));
        events.push(editor.on('messenger:branch.delete', (data: any) => {
            switcher.removeBranch(data.branch_id);
            if (viewedBranch.id === data.branch_id) {
                setViewedBranch(config.self.branch);
            }
        }));
        events.push(editor.on('messenger:branch.open', () => switcher.refresh()));
        events.push(editor.on('messenger:branch.createEnded', (data: any) => {
            if (data.user_id !== config.self.id) {
                return;
            }
            const err = data.status === 'error' ? data.message : null;
            progressBranch.finish(err);
            if (err) {
                togglePanels(true);
            }
        }));

        events.push(projectUserSettings.on('favoriteBranches:insert', () => switcher.refresh()));
        events.push(projectUserSettings.on('favoriteBranches:remove', () => switcher.refresh()));

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    panel.on('hide', () => {
        releaseDiffs();
        switcher.closePanel();
        setCompareMode(false);
        detail.clear();
        showNewCheckpointOnLoad = false;
        events.forEach(evt => evt.unbind());
        events.length = 0;
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state: boolean) => {
        if (state && !panel.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // ---- public methods (preserved) ----
    editor.method('picker:versioncontrol', () => {
        editor.call('picker:project', 'version control');
    });

    editor.method('picker:versioncontrol:hasRetainedDiff', (id: string) => {
        return retainedDiffs.has(id);
    });

    editor.method('picker:versioncontrol:releaseDiff', releaseDiff);

    editor.method('picker:versioncontrol:transformCheckpointData', (data: any) => {
        return {
            id: data.checkpoint_id,
            user: { id: data.user_id, fullName: data.user_full_name },
            createdAt: new Date(data.created_at),
            description: data.description
        };
    });

    // ctrl+s hotkey opens the checkpoint form
    editor.call('hotkey:register', 'new-checkpoint', {
        key: 's',
        ctrl: true,
        callback: () => {
            if (!editor.call('permissions:write')) {
                return;
            }
            if (editor.call('picker:isOpen:otherThan', 'project')) {
                return;
            }
            if (panel.hidden) {
                showNewCheckpointOnLoad = true;
                editor.call('picker:versioncontrol');
            } else {
                openCheckpointForm();
            }
        }
    });
});
