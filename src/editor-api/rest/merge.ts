import { Ajax } from '../ajax';
import { globals as api } from '../globals';
import type { Merge } from '../models';

// args
export type MergeCreateArgs = {
    /**
     * The source branch id
     */
    srcBranchId: string;

    /**
     * The destination branch id
     */
    dstBranchId: string;

    /**
     * Close the source branch after merging
     */
    srcBranchClose: boolean;
};
export type MergeApplyArgs = {
    /**
     * The ID of the merge
     */
    mergeId: string;

    /**
     * Whether to finalize the merge
     */
    finalize: boolean;
};
export type MergeGetArgs = {
    /**
     * The ID of the merge
     */
    mergeId: string;
};
export type MergeDeleteArgs = {
    /**
     * The ID of the merge
     */
    mergeId: string;
};
export type MergeConflictsArgs = {
    /**
     * The ID of the merge
     */
    mergeId: string;

    /**
     * The ID of the conflict
     */
    conflictId: string;

    /**
     * The name of the file
     */
    fileName: string;

    /**
     * Whether the conflict is resolved
     */
    resolved: boolean;
};

// responses
export type MergeResponse = Merge;
export type MergeFileReponse = string;

/**
 * Create a merge
 *
 */
export const mergeCreate = (args: MergeCreateArgs) => {
    return Ajax.post<MergeResponse>({
        url: `${api.apiUrl}/merge`,
        auth: true,
        data: {
            srcBranchId: args.srcBranchId,
            dstBranchId: args.dstBranchId,
            srcBranchClose: args.srcBranchClose
        }
    });
};

/**
 * Apply a merge
 */
export const mergeApply = (args: MergeApplyArgs) => {
    return Ajax.post<MergeResponse>({
        url: `${api.apiUrl}/merge/${args.mergeId}/apply`,
        auth: true,
        data: {
            finalize: args.finalize
        }
    });
};

/**
 * Get a merge object by merge id including all of its conflicts
 */
export const mergeGet = (args: MergeGetArgs) => {
    return Ajax.get<MergeResponse>({
        url: `${api.apiUrl}/merge/${args.mergeId}`,
        auth: true
    });
};

/**
 * Force stops a merge which deletes the merge and all of its conflicts
 */
export const mergeDelete = (args: MergeDeleteArgs) => {
    return Ajax.delete<MergeResponse>({
        url: `${api.apiUrl}/merge/${args.mergeId}`,
        auth: true
    });
};

/**
 * Get conflicts for a merge
 */
export const mergeConflicts = (args: MergeConflictsArgs) => {
    const params = [];

    if (args.resolved) {
        params.push('resolved=true');
    }

    return Ajax.get<MergeFileReponse>({
        url: `${api.apiUrl}/merge/${args.mergeId}/conflicts/${args.conflictId}/file/${args.fileName}?${params.join('&')}`,
        auth: true,
        notJson: true
    });
};
