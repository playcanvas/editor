import { Ajax } from '../ajax';
import { globals as api } from '../globals';

export type InvitationListOptions = {
    /**
     * The project to get the invitations for
     */
    project?: {
        /**
         * The name of the project
         */
        name: string;
        /**
         * The owner of the project
         */
        owner: string;
    }

    /**
     * The username to get the invitations for
     */
    username?: string;

    /**
     * The ID of the user to get the invitations for
     */
    id?: number;

    /**
     * Whether to get accepted invitations
     */
    accepted?: boolean;

    /**
     * Whether to get pending invitations
     */
    pending?: boolean;
};

export type InvitationCreateData = {
    /**
     * The owner of the project
     */
    project_owner: string;

    /**
     * The name of the project
     */
    project_name: string;

    /**
     * The email of the user to invite
     */
    email: string;

    /**
     * The permission to give the user
     */
    permission: string;
};

/**
 * Get the project invitations
 *
 * @param options - The options to use when fetching the invitations
 * @returns A request that responds with the list of invitations
 */
export const invitationList = (options: InvitationListOptions) => {
    const params = [];
    if (options.project) {
        params.push(`project_owner=${options.project.owner}`);
        params.push(`project_name=${options.project.name}`);
    }

    if (options.username) {
        params.push(`username=${options.username}`);
    } else if (options.id) {
        params.push(`user_id=${options.id}`);
    }

    if (options.accepted) {
        params.push(`accepted=${options.accepted}`);
    }

    if (options.pending) {
        params.push(`pending=${options.pending}`);
    }

    return Ajax.get({
        url: `${api.apiUrl}/invitations?${params.join('&')}`,
        auth: true
    });
};

/**
 * Creates a new invitation
 *
 * @param data - The invitation data to create
 * @returns A request that responds with the invitation data
 */
export const invitationCreate = (data: InvitationCreateData) => {
    return Ajax.post({
        url: `${api.apiUrl}/invitations`,
        auth: true,
        data
    });
};

/**
 * Deletes an invitation
 *
 * @param invId - The ID of the invitation to delete
 * @returns A request that responds when the invitation is deleted
 */
export const invitationDelete = (invId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/invitations/${invId}`,
        auth: true
    });
};
