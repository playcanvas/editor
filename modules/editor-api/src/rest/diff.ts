import { Ajax } from '../ajax';
import { globals as api } from '../globals';
import type { Diff, Job } from '../models';

// args
export type DiffCreateArgs = {
    /**
     * The ID of the source branch
     */
    srcBranchId: string;

    /**
     * The ID of the destination branch
     */
    dstBranchId: string;

    /**
     * The ID of the source checkpoint
     */
    srcCheckpointId?: string;

    /**
     * The ID of the destination checkpoint
     */
    dstCheckpointId?: string;

    /**
     * The ID of the merge
     */
    mergeId?: string;

    /**
     * The ID of the history item
     */
    histItem?: string;
};

// responses
export type DiffResponse = {
    merge_id: string;

    project_id: number;

    user_id: number;

    src_branch_id: string;

    dst_branch_id: string;

    src_checkpoint_id?: string;

    dst_checkpoint_id?: string;
};

/**
 * Creates a new diff
 *
 * @param args - The options for the diff
 * @returns A request that responds with the new diff
 */
export const diffCreate = (args: DiffCreateArgs) => {
    const data: {
        srcBranchId: string;
        dstBranchId: string;
        srcCheckpointId?: string;
        dstCheckpointId?: string;
        mergeId?: string;
        vcHistItem?: string;
    } = {
        srcBranchId: args.srcBranchId,
        dstBranchId: args.dstBranchId
    };
    if (args.srcCheckpointId) {
        data.srcCheckpointId = args.srcCheckpointId;
    }
    if (args.dstCheckpointId) {
        data.dstCheckpointId = args.dstCheckpointId;
    }
    if (args.mergeId) {
        data.mergeId = args.mergeId;
    }
    if (args.histItem) {
        data.vcHistItem = args.histItem;
    }

    return Ajax.post<Job<DiffResponse>>({
        url: `${api.apiUrl}/diff`,
        auth: true,
        data: {
            srcBranchId: data.srcBranchId,
            dstBranchId: data.dstBranchId,
            srcCheckpointId: data.srcCheckpointId,
            dstCheckpointId: data.dstCheckpointId,
            mergeId: data.mergeId,
            vcHistItem: data.vcHistItem
        }
    });
};

// args
export type DiffGetArgs = {
    /**
     * The merge / diff ID whose full diff payload to retrieve from S3.
     */
    id: string;
};

/**
 * Fetches the full diff data (conflicts, checkpoints, etc.) from S3 via the
 * assets-server. This avoids storing the large payload in the MongoDB job
 * document.
 *
 * @param args - The options for fetching the diff
 * @returns A request that responds with the full diff payload
 */
export const diffGet = (args: DiffGetArgs) => {
    return Ajax.get<Diff>({
        url: `${api.apiUrl}/diff/${args.id}`,
        auth: true
    });
};
