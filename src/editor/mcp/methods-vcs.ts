import { config } from '@/editor/config';
import { checkpointCreate } from '@/editor/messenger/jobs';

import { mcp } from './connection';

const api = editor.api.globals;

// current branch id, used as the default target for branch-scoped ops
const currentBranchId = () => config.self.branch.id;

// cursor pagination: the backend `skip` param is the last item's id, not an offset
const listMeta = (result: { id: string }[], pagination?: { hasMore?: boolean }) => ({
    hasMore: pagination?.hasMore ?? false,
    nextCursor: result.length ? result[result.length - 1].id : null
});

mcp.method('vcs:status', () => {
    const b = config.self.branch;
    return {
        data: {
            projectId: config.project.id,
            branch: { id: b.id, name: b.name, latestCheckpointId: b.latestCheckpointId },
            mergeInProgress: !!b.merge
        }
    };
});

mcp.method('vcs:branch:list', async (opts: any = {}) => {
    try {
        const res: any = await api.rest.projects.projectBranches({
            limit: opts.limit,
            skip: opts.cursor,
            closed: opts.closed,
            favorite: opts.favorite
        }).promisify();
        return { data: res.result, meta: listMeta(res.result, res.pagination) };
    } catch (e: any) {
        return { error: e.message };
    }
});

mcp.method('vcs:branch:create', async (opts: any = {}) => {
    try {
        const branch = await api.rest.branches.branchCreate({
            name: opts.name,
            projectId: config.project.id,
            sourceBranchId: opts.sourceBranchId ?? currentBranchId(),
            sourceCheckpointId: opts.sourceCheckpointId
        }).promisify();
        // the version-control messenger adopts the new branch and reloads the page
        return { data: { status: 'creating', branch } };
    } catch (e: any) {
        return { error: e.message };
    }
});

mcp.method('vcs:branch:checkout', async (branchId: string) => {
    try {
        await api.rest.branches.branchCheckout({ branchId }).promisify();
        // the version-control messenger switches branch and reloads the page
        return { data: { status: 'switching', branchId } };
    } catch (e: any) {
        return { error: e.message };
    }
});

mcp.method('vcs:checkpoint:list', async (opts: any = {}) => {
    try {
        const res: any = await api.rest.branches.branchCheckpoints({
            branchId: opts.branchId ?? currentBranchId(),
            limit: opts.limit,
            skip: opts.cursor
        }).promisify();
        return { data: res.result, meta: listMeta(res.result, res.pagination) };
    } catch (e: any) {
        return { error: e.message };
    }
});

mcp.method('vcs:checkpoint:create', async (opts: any = {}) => {
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

mcp.method('vcs:checkpoint:restore', async (opts: any = {}) => {
    try {
        await api.rest.checkpoints.checkpointRestore({
            checkpointId: opts.checkpointId,
            branchId: opts.branchId ?? currentBranchId()
        }).promisify();
        // restore overwrites working state; the messenger reloads the page
        return { data: { status: 'restoring', checkpointId: opts.checkpointId } };
    } catch (e: any) {
        return { error: e.message };
    }
});

mcp.method('vcs:checkpoint:hardreset', async (opts: any = {}) => {
    try {
        await api.rest.checkpoints.checkpointHardReset({
            checkpointId: opts.checkpointId,
            branchId: opts.branchId ?? currentBranchId()
        }).promisify();
        // hard reset erases later checkpoints and reloads the page
        return { data: { status: 'resetting', checkpointId: opts.checkpointId } };
    } catch (e: any) {
        return { error: e.message };
    }
});
