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

import { showMergeLoading } from './loading';
import { appendResolveFooter } from './resolve-footer';
import { TextResolver } from './ui/text-resolver';
import { diffCreate } from '../../messenger/jobs';
import { createVcDiffView } from '../version-control/vc-diff-view';

const MERGE_ERROR = 'Error while merging. Please stop the merge and try again.';

editor.once('load', () => {
    let currentMergeObject: any = null;
    let diffMode = false;
    let evtMessengerMergeProgress: any = null;
    let textResolver: TextResolver | null = null;

    const isRetainedDiff = (id: string) => !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);

    const isGroupResolved = (group: any) => (group.data ?? []).every((d: any) => d.useSrc || d.useDst || d.useMergedFile);

    const allResolved = () => (currentMergeObject?.conflicts ?? []).every(isGroupResolved);

    // resolution hooks — declared as function declarations so they hoist above
    // the createVcDiffView call that references them
    function decorateResolutionRow(row: HTMLElement, conflict: any) {
        row.querySelector('.vc-merge-state')?.remove();
        const total = (conflict.data ?? []).length;
        const done = (conflict.data ?? []).filter((d: any) => d.useSrc || d.useDst || d.useMergedFile).length;
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

    function resolveItem(conflict: any, side: 'source' | 'destination', done?: (err?: string) => void) {
        const ids = (conflict.data ?? []).map((d: any) => d.id);
        if (!ids.length) {
            done?.();
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
                done?.(err);
                return editor.call('status:error', err);
            }
            (conflict.data ?? []).forEach((d: any) => {
                d.useSrc = useSrc;
                d.useDst = !useSrc;
                d.useMergedFile = false;
            });
            view.renderSidebar();
            view.renderMain();
            updateReviewState();
            done?.();
        });
    }

    function renderResolveFooter(detail: HTMLElement, conflict: any) {
        const entries = conflict.data ?? [];
        const allSrc = entries.length > 0 && entries.every((d: any) => d.useSrc);
        const allDst = entries.length > 0 && entries.every((d: any) => d.useDst);
        let picked: 'destination' | 'source' | null = allDst ? 'destination' : allSrc ? 'source' : null;
        let saved = picked;

        const footer = document.createElement('div');
        footer.className = 'vc-merge-resolve';

        const label = document.createElement('div');
        label.className = 'vc-merge-resolve-label';
        label.textContent = 'Keep version';
        footer.appendChild(label);

        // primary action — declared first so the option clicks can enable it
        const resolve = new Button({ text: 'Resolve', class: 'vc-merge-primary' });
        let pending = false;
        const updateResolveState = () => {
            resolve.enabled = !pending && picked !== null && picked !== saved;
        };
        updateResolveState();

        // segmented destination/source control; the chosen side picks up the accent
        const options = document.createElement('div');
        options.className = 'vc-merge-options';
        options.setAttribute('role', 'radiogroup');
        const makeOpt = (value: 'destination' | 'source', name: string, role: string) => {
            const opt = document.createElement('button');
            opt.type = 'button';
            opt.className = `vc-merge-opt${picked === value ? ' selected' : ''}`;
            opt.setAttribute('role', 'radio');
            opt.setAttribute('aria-checked', picked === value ? 'true' : 'false');

            const radio = document.createElement('span');
            radio.className = 'vc-merge-opt-radio';
            opt.appendChild(radio);

            const text = document.createElement('span');
            text.className = 'vc-merge-opt-text';
            const r = document.createElement('span');
            r.className = 'role';
            r.textContent = role;
            text.appendChild(r);
            const n = document.createElement('span');
            n.className = 'name';
            n.textContent = name;
            n.title = name;
            text.appendChild(n);
            opt.appendChild(text);

            opt.addEventListener('click', () => {
                picked = value;
                options.querySelectorAll('.vc-merge-opt').forEach((o) => {
                    o.classList.remove('selected');
                    o.setAttribute('aria-checked', 'false');
                });
                opt.classList.add('selected');
                opt.setAttribute('aria-checked', 'true');
                updateResolveState();
            });
            return opt;
        };
        options.appendChild(makeOpt('destination', currentMergeObject?.destinationBranchName ?? 'main', 'Destination'));
        options.appendChild(makeOpt('source', currentMergeObject?.sourceBranchName ?? 'branch', 'Source'));
        footer.appendChild(options);

        const setPending = (value: boolean) => {
            pending = value;
            updateResolveState();
            options.querySelectorAll<HTMLButtonElement>('.vc-merge-opt').forEach((opt) => {
                opt.disabled = value;
                opt.setAttribute('aria-disabled', value ? 'true' : 'false');
            });
        };
        resolve.on('click', () => {
            if (picked && !pending) {
                setPending(true);
                resolveItem(conflict, picked, (err) => {
                    if (!err) {
                        saved = picked;
                    }
                    setPending(false);
                });
            }
        });

        const actions = document.createElement('div');
        actions.className = 'vc-merge-actions';
        actions.appendChild(resolve.dom);

        // only genuine textual-merge conflicts can be opened in the interactive
        // editor — TextResolver requires an isTextualMerge entry
        if (entries.some((d: any) => d.isTextualMerge)) {
            const openBtn = new Button({ text: 'Open editor', class: 'vc-merge-open' });
            openBtn.on('click', () => openTextEditor(conflict));
            actions.appendChild(openBtn.dom);
        }
        footer.appendChild(actions);

        appendResolveFooter(detail, footer);
    }

    function openTextEditor(conflict: any) {
        if (textResolver) {
            textResolver.destroy();
            textResolver = null;
        }
        view.clearMain();
        textResolver = new TextResolver(conflict, currentMergeObject);
        // the core's main is a plain element; shim a parent with .append for the
        // legacy panel (.element) and the raw iframe
        textResolver.appendToParent({
            append: (el: any) => view.main.appendChild(el instanceof HTMLElement ? el : el.element)
        });
        view.main.querySelector('iframe')?.classList.add('vc-merge-frame');

        textResolver.on('resolve', (id: string) => {
            const entry = (conflict.data ?? []).find((d: any) => d.id === id);
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
        },
        bannerText: (status, noun) => (!diffMode && status === 'modified' ?
            `This ${noun} was edited on both branches` :
            `This ${noun} was ${status} since the checkpoint`)
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
        view.setData(data);
        if (!diffMode) {
            updateReviewState();
        }
    };

    const loadMerge = () => {
        showMergeLoading(view);
        handleCallback(editor.api.globals.rest.merge.mergeGet({ mergeId: config.self.branch.merge.id }), (err, data) => {
            if (err) {
                return view.renderNotice(err);
            }
            onMergeDataLoaded(data);
        });
    };

    const loadDiff = () => {
        showMergeLoading(view);
        diffCreate({
            srcBranchId: config.self.branch.merge.sourceBranchId,
            dstBranchId: config.self.branch.merge.destinationBranchId,
            dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
            mergeId: config.self.branch.merge.id
        }).then(onMergeDataLoaded).catch((err: any) => view.renderNotice(`${err}`));
    };

    const onReadyForReview = () => {
        showMergeLoading(view);
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
        btnReview.enabled = false;
        btnComplete.enabled = false;
        view.clearSidebar();
        showMergeLoading(view);
        if (finalize) {
            editor.call('picker:versioncontrol:mergeCompletingOverlay');
        }
        handleCallback(editor.api.globals.rest.merge.mergeApply({
            mergeId: config.self.branch.merge.id,
            finalize
        }), (err: string) => {
            if (err && !/Request timed out/.test(err)) {
                if (finalize) {
                    editor.call('picker:versioncontrol:mergeCompletingOverlay:hide');
                }
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
            showMergeLoading(view);
        }
    };

    // — close confirm (stops the merge) —
    const onClose = () => {
        if (config.self.branch.merge) {
            showMergeLoading(view);
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
                showMergeLoading(view);
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
