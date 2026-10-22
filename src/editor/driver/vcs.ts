import { backend, UNSUPPORTED } from '@/common/backend';
import { MERGE_STATUS_AUTO_ENDED, MERGE_STATUS_READY_FOR_REVIEW } from '@/core/constants';
import { config } from '@/editor/config';
import { checkpointCreate, diffCreate } from '@/editor/messenger/jobs';

import { driver } from './driver';

// how long to wait for an async merge step to progress before giving up
const MERGE_WAIT_MS = 60_000;

// current branch id, used as the default target for branch-scoped ops
const currentBranchId = () => config.self.branch.id;

// a version control service, failing the call like any other error when the backend lacks it
const svc = <K extends 'branchList' | 'branches' | 'checkpointHistory' | 'checkpoints' | 'merges'>(name: K) => {
    const service = backend()[name];
    if (!service) {
        throw new Error(UNSUPPORTED);
    }
    return service;
};

// merge is async: mergeCreate/mergeApply return before the worker finishes, and progress
// arrives as messenger:merge.setProgress events for the current (destination) branch.
// resolve once one of `statuses` is reached; reject on task failure or timeout.
const waitForMergeStatus = (statuses: string[]) =>
    new Promise<string>((resolve, reject) => {
        const branchId = currentBranchId();
        const evt: any = editor.on('messenger:merge.setProgress', (data: any) => {
            if (data.dst_branch_id !== branchId) {
                return;
            }
            if (data.task_failed) {
                clearTimeout(timer);
                evt.unbind();
                reject(new Error('Merge failed'));
                return;
            }
            if (statuses.includes(data.status)) {
                clearTimeout(timer);
                evt.unbind();
                resolve(data.status);
            }
        });
        const timer = setTimeout(() => {
            evt.unbind();
            reject(new Error('Timed out waiting for the merge to progress'));
        }, MERGE_WAIT_MS);
    });

// cursor pagination: the backend `skip` param is the last item's id, not an offset
const listMeta = (result: { id: string }[], pagination?: { hasMore?: boolean }) => ({
    hasMore: pagination?.hasMore ?? false,
    nextCursor: result.length ? result[result.length - 1].id : null
});

driver.method('vcs:status', () => {
    const b = config.self.branch;
    return {
        data: {
            projectId: config.project.id,
            branch: { id: b.id, name: b.name, latestCheckpointId: b.latestCheckpointId },
            mergeInProgress: !!b.merge
        }
    };
});

driver.method('vcs:branch:list', async (opts: any = {}) => {
    try {
        const res: any = await svc('branchList')
            .projectBranches({
                limit: opts.limit,
                skip: opts.cursor,
                closed: opts.closed,
                favorite: opts.favorite
            })
            .promisify();
        return { data: res.result, meta: listMeta(res.result, res.pagination) };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:branch:create', async (opts: any = {}) => {
    try {
        const branch = await svc('branches')
            .branchCreate({
                name: opts.name,
                projectId: config.project.id,
                sourceBranchId: opts.sourceBranchId ?? currentBranchId(),
                sourceCheckpointId: opts.sourceCheckpointId
            })
            .promisify();
        // the version-control messenger adopts the new branch and reloads the page
        return { data: { status: 'creating', branch } };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:branch:checkout', async (branchId: string) => {
    try {
        await svc('branches').branchCheckout({ branchId }).promisify();
        // the version-control messenger switches branch and reloads the page
        return { data: { status: 'switching', branchId } };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:checkpoint:list', async (opts: any = {}) => {
    try {
        const res: any = await svc('checkpointHistory')
            .branchCheckpoints({
                branchId: opts.branchId ?? currentBranchId(),
                limit: opts.limit,
                skip: opts.cursor
            })
            .promisify();
        return { data: res.result, meta: listMeta(res.result, res.pagination) };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:checkpoint:create', async (opts: any = {}) => {
    try {
        const checkpoint = await checkpointCreate({
            projectId: config.project.id,
            branchId: opts.branchId ?? currentBranchId(),
            description: opts.description
        });
        return { data: checkpoint };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:checkpoint:restore', async (opts: any = {}) => {
    try {
        await svc('checkpoints')
            .checkpointRestore({
                checkpointId: opts.checkpointId,
                branchId: opts.branchId ?? currentBranchId()
            })
            .promisify();
        // restore overwrites working state; the messenger reloads the page
        return { data: { status: 'restoring', checkpointId: opts.checkpointId } };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:checkpoint:hardreset', async (opts: any = {}) => {
    try {
        await svc('checkpoints')
            .checkpointHardReset({
                checkpointId: opts.checkpointId,
                branchId: opts.branchId ?? currentBranchId()
            })
            .promisify();
        // hard reset erases later checkpoints and reloads the page
        return { data: { status: 'resetting', checkpointId: opts.checkpointId } };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:checkpoint:get', async (opts: any = {}) => {
    try {
        const checkpoint = await svc('checkpointHistory')
            .checkpointGet({ checkpointId: opts.checkpointId })
            .promisify();
        return { data: checkpoint };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:branch:close', async (opts: any = {}) => {
    try {
        const branch = await svc('branches').branchClose({ branchId: opts.branchId }).promisify();
        return { data: branch };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:branch:open', async (opts: any = {}) => {
    try {
        const branch = await svc('branches').branchOpen({ branchId: opts.branchId }).promisify();
        return { data: branch };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:branch:delete', async (opts: any = {}) => {
    try {
        const branch = await svc('branches').branchDelete({ branchId: opts.branchId }).promisify();
        return { data: branch };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:merge:create', async (opts: any = {}) => {
    try {
        // subscribe before firing so we can't miss the auto-merge-done event
        const settled = waitForMergeStatus([MERGE_STATUS_AUTO_ENDED, MERGE_STATUS_READY_FOR_REVIEW]);
        const created: any = await svc('merges')
            .mergeCreate({
                srcBranchId: opts.sourceBranchId,
                dstBranchId: currentBranchId(),
                srcBranchClose: !!opts.closeSource
            })
            .promisify();
        await settled;
        // re-fetch so conflicts are populated (mergeCreate returns before the worker finishes)
        const merge = await svc('merges').mergeGet({ mergeId: created.id }).promisify();
        return { data: merge };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:merge:get', async (opts: any = {}) => {
    try {
        const merge = await svc('merges').mergeGet({ mergeId: opts.mergeId }).promisify();
        return { data: merge };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:merge:apply', async (opts: any = {}) => {
    try {
        if (opts.finalize) {
            // finalize commits the merge checkpoint onto the current branch; the messenger
            // reloads the page on merge_apply_ended, so return now and let the server wait
            await svc('merges').mergeApply({ mergeId: opts.mergeId, finalize: true }).promisify();
            return { data: { status: 'applying', mergeId: opts.mergeId } };
        }
        // review pass: prepare the merge, wait until it is ready for review (no reload)
        const settled = waitForMergeStatus([MERGE_STATUS_READY_FOR_REVIEW]);
        await svc('merges').mergeApply({ mergeId: opts.mergeId, finalize: false }).promisify();
        await settled;
        const merge = await svc('merges').mergeGet({ mergeId: opts.mergeId }).promisify();
        return { data: merge };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:merge:delete', async (opts: any = {}) => {
    try {
        const merge = await svc('merges').mergeDelete({ mergeId: opts.mergeId }).promisify();
        return { data: merge };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:conflict:resolve', async (opts: any = {}) => {
    try {
        const flags =
            opts.resolution === 'source'
                ? { useSrc: true }
                : opts.resolution === 'dest'
                  ? { useDst: true }
                  : { revert: true };
        const res: any = await svc('merges')
            .conflictsResolve({
                mergeId: opts.mergeId,
                conflictIds: opts.conflictIds,
                ...flags
            })
            .promisify();
        return { data: res.result };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:conflict:getfile', async (opts: any = {}) => {
    try {
        const content = await svc('merges')
            .mergeConflicts({
                mergeId: opts.mergeId,
                conflictId: opts.conflictId,
                fileName: opts.fileName,
                resolved: !!opts.resolved
            })
            .promisify();
        return { data: content };
    } catch (e: any) {
        return { error: e.message };
    }
});

driver.method('vcs:diff', async (opts: any = {}) => {
    try {
        // diffCreate posts /diff then awaits the job-done event and fetches the result
        const diff = await diffCreate({
            srcBranchId: opts.srcBranchId ?? currentBranchId(),
            dstBranchId: opts.dstBranchId ?? currentBranchId(),
            srcCheckpointId: opts.srcCheckpointId,
            dstCheckpointId: opts.dstCheckpointId
        });
        return { data: diff };
    } catch (e: any) {
        return { error: e.message };
    }
});
