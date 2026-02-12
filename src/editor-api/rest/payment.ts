import { Ajax } from '../ajax';
import { globals as api } from '../globals';

/**
 * Updates the payment subscription for the given user
 *
 * @param userId - The ID of the user to update the subscription for
 * @param data - The data to update the subscription with
 * @returns A request that responds with the result of the update
 */
export const paymentSubUpdate = (userId: number, data: object) => {
    return Ajax.put({
        url: `${api.apiUrl}/payment/subscription/users/${userId}`,
        auth: true,
        data
    });
};
