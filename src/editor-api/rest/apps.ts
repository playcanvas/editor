import { Ajax } from '../ajax';
import { globals as api } from '../globals';

/**
 * Creates a new app
 *
 * @param data - The app data to create
 * @returns A request that responds with the app data
 */
export const appCreate = (data: object) => {
    return Ajax.post({
        url: `${api.apiUrl}/apps`,
        auth: true,
        data
    });
};

/**
 * Deletes the app with the given ID
 *
 * @param appId - The ID of the app to delete
 * @returns A request that responds when the app is deleted
 */
export const appDelete = (appId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/apps/${appId}`,
        auth: true
    });
};

/**
 * Get list of apps
 *
 * @param tags - The tags to filter the apps by
 * @returns A request that responds with the list of apps
 */
export const appList = (tags: string) => {
    return Ajax.get({
        url: `${api.apiUrl}/apps?tags=${tags}`,
        auth: true
    });
};

/**
 * Fetches the app with the given ID
 *
 * @param appId - The ID of the app to get
 * @returns A request that responds with the app data
 */
export const appGet = (appId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/apps/${appId}`,
        auth: true
    });
};

/**
 * Downloads the app with the given ID
 *
 * @param data - The app data to download
 * @returns A request that responds with the app data
 */
export const appDownload = (data: object) => {
    return Ajax.post({
        url: `${api.apiUrl}/apps/download`,
        auth: true,
        data
    });
};
