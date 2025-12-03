import { Ajax } from '../ajax';
import { globals as api } from '../globals';
import type { Conflict } from '../models';

// args
export type ConflictResolveArgs = {
    /**
     * The merge id
     */
    mergeId: string;

    /**
     * The conflict ids
     */
    conflictIds: string[];

    /**
     * Use source checkpoint
     */
    useSrc?: boolean;

    /**
     * Use destination checkpoint
     */
    useDst?: boolean;

    /**
     * Un-resolve conflicts
     */
    revert?: boolean;
};
export type ConflictUploadArgs = {
    /**
     * The conflict id
     */
    conflictId: string;

    /**
     * The file
     */
    file: File | Blob;
};

// responses
export type ConflictResponse = Omit<Conflict, 'mergedFilePath'>;

/**
 * Resolve conflicts
 */
export const conflictsResolve = (args: ConflictResolveArgs) => {
    return Ajax.post<{
        result: ConflictResponse[];
    }>({
        url: `${api.apiUrl}/conflicts/resolve`,
        auth: true,
        data: {
            mergeId: args.mergeId,
            conflictIds: args.conflictIds,
            useSrc: args.useSrc,
            useDst: args.useDst,
            revert: args.revert
        }
    });
};

/**
 * Uploads the specified file to resolve a conflict
 */
export const conflictsUpload = (args: ConflictUploadArgs) => {
    const form = new FormData();
    form.append('file', args.file);

    return Ajax.put<ConflictResponse>({
        url: `${api.apiUrl}/conflicts/${args.conflictId}/file`,
        auth: true,
        data: form,
        ignoreContentType: true,
        headers: {
            Accept: 'application/json'
        }
    });
};
