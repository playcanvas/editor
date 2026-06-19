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

    const isRetainedDiff = (id: string) => !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);

    const isGroupResolved = (group: any) => (group.data ?? []).every((d: any) => d.useSrc || d.useDst || d.useMergedFile);

    const allResolved = () => (currentMergeObject?.conflicts ?? []).every(isGroupResolved);

    // resolution hooks (stubs; completed in Task 3-4) — declared as function
    // declarations so they hoist above the createVcDiffView call that references them
    function decorateResolutionRow(row: HTMLElement, conflict: any) {}
    function renderResolveFooter(detail: HTMLElement, conflict: any) {}

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
        if (data.dst_branch_id !== config.self.branch.id) {
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
