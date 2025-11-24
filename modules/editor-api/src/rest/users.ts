import { Ajax } from '../ajax';
import { globals as api } from '../globals';

/**
 * Creates a new user
 *
 * @param data - The data for the new user
 * @returns A request that responds with the new user
 */
export const userCreate = (data: object) => {
    return Ajax.post({
        url: `${api.apiUrl}/users`,
        auth: true,
        data
    });
};

/**
 * Deletes the user with the given ID
 *
 * @param userId - The ID of the user to delete
 * @returns A request that responds when the user is deleted
 */
export const userDelete = (userId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/users/${userId}`,
        auth: true,
        notJson: true
    });
};

/**
 * Fetches the user with the given ID
 *
 * @param userId - The ID of the user to get
 * @returns A request that responds with the user data
 */
export const userGet = (userId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/users/${userId}`,
        auth: true
    });
};

/**
 * Fetches a list of collaborators for the given user
 *
 * @param userId - The ID of the user to get collaborators for
 * @returns A request that responds with the list of collaborators
 */
export const userCollabList = (userId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/users/${userId}/collaborators`,
        auth: true
    });
};

/**
 * Fetches a list of projects for the given user
 *
 * @param userId - The ID of the user to get projects for
 * @param view - The view to get projects for
 * @returns A request that responds with the list of projects
 */
export const userProjects = (userId: number, view: string) => {
    return Ajax.get({
        url: `${api.apiUrl}/users/${userId}/projects?view=${view}`,
        auth: true
    });
};

/**
 * Fetches the storage data for the given user
 *
 * @param userId - The ID of the user to get storage data for
 * @returns A request that responds with the storage data
 */
export const userUsage = (userId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/users/${userId}/usage`,
        auth: true
    });
};
