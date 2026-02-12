import { Ajax } from '../ajax';
import { globals as api } from '../globals';

export type WatchCreateData = {
    scope: {
        /**
         * The type of the scope
         */
        type: string;

        /**
         * The ID of the scope
         */
        id: number;
    };
};

/**
 * Creates a new watch
 *
 * @param data - The data to watch
 * @returns A request that responds with the watched data
 */
export const watchCreate = (data: WatchCreateData) => {
    return Ajax.post({
        url: `${api.apiUrl}/watch`,
        auth: true,
        data
    });
};

/**
 * Deletes the watch with the given ID
 *
 * @param watchId - The ID of the watch to delete
 * @returns A request that responds when the watch is deleted
 */
export const watchDelete = (watchId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/watch/${watchId}`,
        auth: true
    });
};
