import { Ajax } from '../ajax';
import { globals as api } from '../globals';
import type { Diff } from '../models';

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
export type DiffResponse = Diff;

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

    return Ajax.post<DiffResponse>({
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
