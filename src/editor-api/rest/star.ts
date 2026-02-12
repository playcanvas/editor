import { Ajax } from '../ajax';
import { globals as api } from '../globals';

export type StarCreateData = {
    scope: {
        /**
         * The type of the scope
         */
        type: string,

        /**
         * The ID of the scope
         */
        id: number
    }
};

/**
 * Creates a new star
 *
 * @param data - The data for the new star
 * @returns A request that responds with the new star
 */
export const starCreate = (data: StarCreateData) => {
    return Ajax.post({
        url: `${api.apiUrl}/star`,
        auth: true,
        data
    });
};

/**
 * Deletes a star by ID
 *
 * @param starId - The ID of the star to delete
 * @returns A request that responds when the star is deleted
 */
export const starDelete = (starId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/star/${starId}`,
        auth: true
    });
};
