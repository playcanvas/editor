import { Ajax } from '../ajax';
import { globals as api } from '../globals';
import type { Checkpoint, User } from '../models';

// args
export type CheckpointCreateArgs = {
    /**
     * The ID of the project to create the checkpoint on
     */
    projectId: number;

    /**
     * The ID of the branch to create the checkpoint on
     */
    branchId: string;

    /**
     * The description of the checkpoint
     */
    description: string;
};
export type CheckpointGetArgs = {
    /**
     * The ID of the checkpoint to get
     */
    checkpointId: string;
};
export type CheckpointRestoreArgs = {
    /**
     * The ID of the branch to restore the checkpoint to
     */
    branchId: string;

    /**
     * The ID of the checkpoint to restore
     */
    checkpointId: string;
};
export type CheckpointHardResetArgs = {
    /**
     * The ID of the branch to hard reset the checkpoint to
     */
    branchId: string;

    /**
     * The ID of the checkpoint to hard reset
     */
    checkpointId: string;
};

// responses
export type CheckpointResponse = Pick<Checkpoint, 'id' | 'createdAt' | 'description'> & {
    user: Pick<User, 'id'>;
};
export type CheckpointUserResponse = Pick<Checkpoint, 'id' | 'createdAt' | 'description'> & {
    user: Pick<User, 'id' | 'fullName' | 'username'>;
};

/**
 * Creates a new checkpoint
 */
export const checkpointCreate = (args: CheckpointCreateArgs) => {
    return Ajax.post<CheckpointUserResponse>({
        url: `${api.apiUrl}/checkpoints`,
        auth: true,
        data: {
            projectId: args.projectId,
            branchId: args.branchId,
            description: args.description
        }
    });
};

/**
 * Gets a checkpoint
 *
 * @param args - The arguments for the request
 * @returns The Ajax wrapped response
 */
export const checkpointGet = (args: CheckpointGetArgs) => {
    return Ajax.get<CheckpointUserResponse>({
        url: `${api.apiUrl}/checkpoints/${args.checkpointId}`,
        auth: true
    });
};

/**
 * Restores a checkpoint
 */
export const checkpointRestore = (args: CheckpointRestoreArgs) => {
    return Ajax.post<CheckpointResponse>({
        url: `${api.apiUrl}/checkpoints/${args.checkpointId}/restore`,
        auth: true,
        data: {
            branchId: args.branchId
        }
    });
};

/**
 * Hard resets a checkpoint
 */
export const checkpointHardReset = (args: CheckpointHardResetArgs) => {
    return Ajax.post<CheckpointResponse>({
        url: `${api.apiUrl}/checkpoints/${args.checkpointId}/hardreset`,
        auth: true,
        data: {
            branchId: args.branchId
        }
    });
};
