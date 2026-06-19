import { Button } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import {
    MERGE_STATUS_APPLY_ENDED,
    MERGE_STATUS_APPLY_STARTED,
    MERGE_STATUS_AUTO_ENDED,
    MERGE_STATUS_AUTO_STARTED,
    MERGE_STATUS_READY_FOR_REVIEW
} from '@/core/constants';
import { config } from '@/editor/config';

import { diffCreate } from '../../messenger/jobs';
import { createVcDiffView } from '../version-control/vc-diff-view';
import { TextResolver } from './ui/text-resolver';

const MERGE_ERROR = 'Error while merging. Please stop the merge and try again.';

editor.once('load', () => {
    let currentMergeObject: any = null;
    let diffMode = false;
    let evtMessengerMergeProgress: any = null;
    let textResolver: TextResolver | null = null;
    let previewLoading = false;
    let previewToken = 0;       // guards stale async preview loads
    let previewDiffId: any = null; // temp diff created for the resolve preview

    // per-item resolution metadata keyed by itemId. kept separate from the
    // displayed conflict.data, which is swapped to the diff's rich field entries
    // for the preview — resolution always acts on these original merge entries.
    const resolveState = new Map<string, { entries: any[]; conflictIds: any[]; fileEntry: any }>();

    const isRetainedDiff = (id: string) => !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);

    const stateFor = (conflict: any) => resolveState.get(conflict?.itemId);
    const entryResolved = (e: any) => e.useSrc || e.useDst || e.useMergedFile;
    const isItemResolved = (st?: { entries: any[] }) => !!st && st.entries.length > 0 && st.entries.every(entryResolved);
    const allResolved = () => (currentMergeObject?.conflicts ?? []).every((c: any) => isItemResolved(stateFor(c)));

    // resolution hooks — declared as function declarations so they hoist above
    // the createVcDiffView call that references them
    function decorateResolutionRow(row: HTMLElement, conflict: any) {
        row.querySelector('.vc-merge-state')?.remove();
        const entries = stateFor(conflict)?.entries ?? conflict.data ?? [];
        const total = entries.length;
        const done = entries.filter(entryResolved).length;
        const state = document.createElement('span');
        state.className = `vc-merge-state${total > 0 && done === total ? ' resolved' : ''}`;
        const dot = document.createElement('span');
        dot.className = 'dot';
        state.appendChild(dot);
        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = `${done}/${total}`;
        state.appendChild(count);
        row.insertBefore(state, row.firstChild);
    }

    function resolveItem(conflict: any, side: 'source' | 'destination') {
        const st = stateFor(conflict);
        const entries = st?.entries ?? conflict.data ?? [];
        const ids = st ? st.conflictIds : entries.map((d: any) => d.id);
        if (!ids.length) {
            return;
        }
        const useSrc = side === 'source';
        handleCallback(editor.api.globals.rest.conflicts.conflictsResolve({
            mergeId: currentMergeObject.id,
            conflictIds: ids,
            useSrc,
            useDst: !useSrc
        }), (err: string) => {
            if (err) {
                return editor.call('status:error', err);
            }
            entries.forEach((d: any) => {
                d.useSrc = useSrc;
                d.useDst = !useSrc;
                d.useMergedFile = false;
            });
            view.renderSidebar();
            view.renderMain();
            updateReviewState();
        });
    }

    function renderResolveFooter(detail: HTMLElement, conflict: any) {
        const st = stateFor(conflict);
        const entries = st?.entries ?? conflict.data ?? [];
        const footer = document.createElement('div');
        footer.className = 'vc-merge-resolve';

        // the rich preview is still loading — let the user know more is coming
        // (they can still resolve immediately if they already know the side)
        if (previewLoading) {
            const hint = document.createElement('div');
            hint.className = 'vc-merge-preview-loading';
            hint.textContent = 'Loading change preview…';
            footer.appendChild(hint);
        }

        const allSrc = entries.length > 0 && entries.every((d: any) => d.useSrc);
        const allDst = entries.length > 0 && entries.every((d: any) => d.useDst);
        const group = `vc-merge-side-${conflict.itemId}`;

        const makeChoice = (value: 'destination' | 'source', label: string, checked: boolean) => {
            const wrap = document.createElement('label');
            wrap.className = 'vc-merge-choice';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = group;
            radio.value = value;
            radio.checked = checked;
            wrap.appendChild(radio);
            wrap.appendChild(document.createTextNode(label));
            return wrap;
        };

        const dstName = currentMergeObject?.destinationBranchName ?? 'destination';
        const srcName = currentMergeObject?.sourceBranchName ?? 'source';
        footer.appendChild(makeChoice('destination', `Use ${dstName} (destination)`, allDst));
        footer.appendChild(makeChoice('source', `Use ${srcName} (source)`, allSrc));

        const actions = document.createElement('div');
        actions.className = 'vc-merge-actions';
        const resolve = new Button({ text: 'Resolve', class: 'vc-merge-primary' });
        resolve.on('click', () => {
            const picked = (footer.querySelector(`input[name="${group}"]:checked`) as HTMLInputElement)?.value;
            if (picked === 'source' || picked === 'destination') {
                resolveItem(conflict, picked);
            }
        });
        actions.appendChild(resolve.dom);
        // only genuine textual-merge conflicts can be opened in the interactive
        // editor — TextResolver requires an isTextualMerge entry
        const fileEntry = st?.fileEntry ?? (conflict.data ?? []).find((d: any) => d.isTextualMerge);
        if (fileEntry) {
            const openBtn = new Button({ text: 'Open editor', class: 'vc-merge-open' });
            openBtn.on('click', () => openTextEditor(conflict));
            actions.appendChild(openBtn.dom);
        }
        footer.appendChild(actions);

        detail.appendChild(footer);
    }

    function openTextEditor(conflict: any) {
        // TextResolver needs the original merge entries (their ids + mergedFilePath
        // drive the code-editor iframe + upload), not the swapped-in diff entries
        const entries = stateFor(conflict)?.entries ?? conflict.data ?? [];
        const textConflict = {
            itemName: conflict.itemName,
            itemId: conflict.itemId,
            assetType: conflict.assetType,
            data: entries
        };
        if (textResolver) {
            textResolver.destroy();
            textResolver = null;
        }
        view.clearMain();
        textResolver = new TextResolver(textConflict, currentMergeObject);
        // the core's main is a plain element; shim a parent with .append for the
        // legacy panel (.element) and the raw iframe
        textResolver.appendToParent({
            append: (el: any) => view.main.appendChild(el instanceof HTMLElement ? el : el.element)
        });
        view.main.querySelector('iframe')?.classList.add('vc-merge-frame');

        textResolver.on('resolve', (id: string) => {
            const entry = entries.find((d: any) => d.id === id);
            if (entry) {
                entry.useMergedFile = true;
            }
            view.renderSidebar();
            updateReviewState();
        });
        textResolver.on('close', () => {
            if (textResolver) {
                textResolver.destroy();
                textResolver = null;
            }
            view.renderMain();
        });
    }

    const view = createVcDiffView({
        title: 'Resolve Conflicts',
        rootClass: 'vc-merge',
        fullscreenKey: 'editor:picker:vcmerge:fullscreen',
        sidebarKey: 'editor:vcmerge:sidebar:width',
        shouldRenderFrame: () => diffMode, // resolve mode: no read-only frame (uses Open editor); review: read-only frame
        decorateRow: (row, conflict) => {
            if (!diffMode) {
                decorateResolutionRow(row, conflict);
            }
        },
        renderDetailFooter: (detail, conflict) => {
            if (!diffMode) {
                renderResolveFooter(detail, conflict);
            }
        },
        renderMeta: (meta, data) => {
            if (!data) {
                return;
            }
            meta.textContent = diffMode ?
                `${data.destinationBranchName} ← merge result` :
                `${data.sourceBranchName} → ${data.destinationBranchName}`;
        }
    });

    // sidebar footer: REVIEW (resolve mode) → COMPLETE (review mode)
    const btnReview = new Button({ text: 'Review merge', class: 'vc-merge-primary' });
    btnReview.enabled = false;
    btnReview.on('click', () => applyMerge(false));
    view.sidebarFooter.appendChild(btnReview.dom);

    const btnComplete = new Button({ text: 'Complete merge', class: 'vc-merge-primary' });
    btnComplete.hidden = true;
    btnComplete.on('click', () => applyMerge(true));
    view.sidebarFooter.appendChild(btnComplete.dom);

    const updateReviewState = () => {
        btnReview.enabled = allResolved();
    };

    // — mode + meta —
    const toggleDiffMode = (on: boolean) => {
        diffMode = on;
        view.overlay.class[on ? 'add' : 'remove']('diff');
        view.setTitle(on ? (config.self.branch.merge ? 'Review merge changes' : 'Diff') : 'Resolve conflicts');
        btnReview.hidden = on;
        btnComplete.hidden = !on || !config.self.branch.merge;
    };

    // index the per-item resolution metadata from a fresh mergeGet payload
    const indexResolveState = (data: any) => {
        resolveState.clear();
        (data?.conflicts ?? []).forEach((c: any) => {
            const entries = c.data ?? [];
            resolveState.set(c.itemId, {
                entries,
                conflictIds: entries.map((e: any) => e.id),
                fileEntry: entries.find((e: any) => e.isTextualMerge) ?? null
            });
        });
    };

    // delete the temp diff created for the resolve preview (guarded so we never
    // delete the active merge or a retained diff)
    const clearPreviewDiff = () => {
        const id = previewDiffId;
        previewDiffId = null;
        if (id && id !== config.self.branch.merge?.id && !isRetainedDiff(id)) {
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: id }), () => {});
        }
    };

    // resolve mode: the mergeGet payload only carries conflict ids + paths, no
    // before/after values. fetch the branch diff (the same call Review merge uses)
    // and swap each conflict's data for the diff's rich entries so the user can see
    // what differs. non-blocking — resolve controls already work before this lands.
    const loadResolvePreview = (mergeData: any) => {
        const token = ++previewToken;
        clearPreviewDiff();
        diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }).then((diff: any) => {
            if (token !== previewToken || currentMergeObject !== mergeData) {
                return; // stale (overlay closed / reloaded)
            }
            previewDiffId = diff?.id ?? diff?.merge_id ?? null;
            const byItem = new Map((diff?.conflicts ?? []).map((c: any) => [c.itemId, c]));
            mergeData.conflicts.forEach((c: any) => {
                const d: any = byItem.get(c.itemId);
                if (d?.data?.length) {
                    c.data = d.data; // rich diff entries for display
                }
            });
            // the diff's checkpoints carry the richer name index the entries resolve against
            if (diff?.srcCheckpoint) {
                mergeData.srcCheckpoint = diff.srcCheckpoint;
            }
            if (diff?.dstCheckpoint) {
                mergeData.dstCheckpoint = diff.dstCheckpoint;
            }
            previewLoading = false;
            view.setData(mergeData);
        }).catch(() => {
            if (token !== previewToken) {
                return;
            }
            // leave the coarse banners in place — resolving still works
            previewLoading = false;
            view.renderSidebar();
            view.renderMain();
        });
    };

    // — data load —
    const onMergeDataLoaded = (data: any) => {
        currentMergeObject = data;
        if (!data?.conflicts?.length) {
            view.clearSidebar();
            if (diffMode) {
                btnComplete.enabled = true;
                view.renderNotice('No changes found — click Complete merge');
            } else {
                btnReview.enabled = true;
                view.renderNotice('No conflicts found — click Review merge');
            }
            return;
        }
        if (diffMode) {
            // review mode: data is already the rich diff
            view.setData(data);
            return;
        }
        // resolve mode: render the coarse list immediately, then enrich with the diff
        indexResolveState(data);
        previewLoading = true;
        view.setData(data);
        updateReviewState();
        loadResolvePreview(data);
    };

    const loadMerge = () => {
        view.renderNotice('Loading conflicts…');
        handleCallback(editor.api.globals.rest.merge.mergeGet({ mergeId: config.self.branch.merge.id }), (err, data) => {
            if (err) {
                return view.renderNotice(err);
            }
            onMergeDataLoaded(data);
        });
    };

    const loadDiff = () => {
        view.renderNotice('Loading changes…');
        diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }).then(onMergeDataLoaded).catch((err: any) => view.renderNotice(`${err}`));
    };

    const onReadyForReview = () => {
        clearPreviewDiff();
        view.renderNotice('Loading changes…');
        diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }).then((data: any) => {
            toggleDiffMode(true);
            btnComplete.enabled = true;
            onMergeDataLoaded(data);
        }).catch((err: any) => {
            toggleDiffMode(true);
            view.renderNotice(`${err}`);
        });
    };

    // — apply (review = finalize:false, complete = finalize:true) —
    const applyMerge = (finalize: boolean) => {
        clearPreviewDiff();
        btnReview.enabled = false;
        btnComplete.enabled = false;
        view.clearSidebar();
        view.renderNotice(finalize ? 'Completing merge…' : 'Resolving conflicts…');
        handleCallback(editor.api.globals.rest.merge.mergeApply({
            mergeId: config.self.branch.merge.id,
            finalize
        }), (err: string) => {
            if (err && !/Request timed out/.test(err)) {
                view.renderNotice(err);
                setTimeout(() => window.location.reload(), 2000);
            }
        });
    };

    // — messenger —
    const onMsgMergeProgress = (data: any) => {
        if (data.dst_branch_id !== config.self.branch.id || !config.self.branch.merge) {
            return;
        }
        config.self.branch.merge.mergeProgressStatus = data.status;
        if (data.task_failed) {
            return view.renderNotice(MERGE_ERROR);
        }
        if (data.status === MERGE_STATUS_READY_FOR_REVIEW) {
            onReadyForReview();
        } else if (data.status === MERGE_STATUS_AUTO_ENDED) {
            loadMerge();
        } else if (data.status === MERGE_STATUS_APPLY_ENDED) {
            view.renderNotice('Merge complete — refreshing browser…');
        }
    };

    // — close confirm (stops the merge) —
    const onClose = () => {
        if (config.self.branch.merge) {
            view.renderNotice('Stopping merge…');
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: config.self.branch.merge.id }), (err) => {
                view.renderNotice(err || 'Merge stopped. Refreshing browser');
            });
            if (diffMode && currentMergeObject && currentMergeObject.id !== config.self.branch.merge.id && !isRetainedDiff(currentMergeObject.id)) {
                handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: currentMergeObject.id }), () => {});
            }
        } else if (diffMode && currentMergeObject && !isRetainedDiff(currentMergeObject.id)) {
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: currentMergeObject.id }), () => {});
        }
    };

    view.overlay.on('show', () => {
        editor.emit('picker:open', 'conflict-manager');
        evtMessengerMergeProgress = editor.on('messenger:merge.setProgress', onMsgMergeProgress);
        if (!currentMergeObject) {
            if (diffMode) {
                loadDiff();
            } else if (config.self.branch.merge?.task_failed) {
                view.renderNotice(MERGE_ERROR);
            } else if (!config.self.branch.merge?.mergeProgressStatus ||
                       config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_APPLY_STARTED ||
                       config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_AUTO_STARTED) {
                view.renderNotice('Merging in progress…');
            } else if (config.self.branch.merge.mergeProgressStatus === MERGE_STATUS_READY_FOR_REVIEW) {
                onReadyForReview();
            } else {
                loadMerge();
            }
        } else {
            onMergeDataLoaded(currentMergeObject);
        }
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    view.overlay.on('hide', () => {
        previewToken++;
        clearPreviewDiff();
        resolveState.clear();
        previewLoading = false;
        if (diffMode && currentMergeObject && !config.self.branch.merge && !isRetainedDiff(currentMergeObject.id)) {
            editor.emit('picker:diffManager:closed', currentMergeObject.id);
        }
        if (diffMode && editor.call('picker:isOpen', 'project')) {
            editor.call('picker:project:resume');
        }
        if (textResolver) {
            textResolver.destroy();
            textResolver = null;
        }
        currentMergeObject = null;
        if (evtMessengerMergeProgress) {
            evtMessengerMergeProgress.unbind();
            evtMessengerMergeProgress = null;
        }
        view.cleanup();
        editor.emit('picker:close', 'conflict-manager');
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state: boolean) => {
        if (state && !view.overlay.hidden) {
            setTimeout(() => editor.emit('viewport:hover', false), 0);
        }
    });

    // intercept the core's close button so it runs the merge-stop confirm first
    const coreClose = view.top.dom.querySelector('.vc-diff-close') as HTMLElement;
    coreClose?.addEventListener('click', (e) => {
        if (config.self.branch.merge) {
            e.stopImmediatePropagation();
            editor.call('picker:confirm', 'Closing the conflict manager will stop the merge. Are you sure?', () => {
                onClose();
                view.overlay.hidden = true;
            });
        } else {
            onClose();
            view.overlay.hidden = true;
        }
    }, true);

    editor.method('picker:conflictManager', (data: any) => {
        toggleDiffMode(false);
        currentMergeObject = data ?? null;
        view.overlay.hidden = false;
    });

    editor.method('picker:diffManager', (diff: any) => {
        toggleDiffMode(true);
        currentMergeObject = diff ?? null;
        view.overlay.hidden = false;
    });
});
