import { Ajax } from '../ajax';
import { globals as api } from '../globals';

export type HomeSceneEventData = {
    /**
     * The name of the event
     */
    name: string;

    /**
     * The title of the event
     */
    title: string;

    /**
     * The text of the event
     */
    text: string;
};

/**
 * Gets the current checked out branch from the server
 *
 * @returns The request object
 */
export const homeBranch = () => {
    return Ajax.get({
        url: `${api.homeUrl}/editor/project/${api.projectId}/branch`,
        auth: true
    });
};

/**
 * Gets raw file from the server
 *
 * @param url - The URL of the file to get
 * @param notJson - If the file is not JSON
 * @returns The request object
 */
export const homeFile = (url: string, notJson: boolean = false) => {
    return Ajax.get({
        url: `${url}`,
        notJson
    });
};

/**
 * Set the users editorOpened flag to true
 *
 * @param sceneId - The ID of the scene
 * @returns The request object
 */
export const homeSceneOpened = (sceneId: number) => {
    return Ajax.post({
        url: `${api.homeUrl}/editor/scene/${sceneId}/opened`
    });
};

/**
 * Store event on the scene
 *
 * @param sceneId - The ID of the scene
 * @param data - The event data
 * @returns The request object
 */
export const homeSceneEvent = (sceneId: number, data: HomeSceneEventData) => {
    return Ajax.post({
        url: `${api.homeUrl}/editor/scene/${sceneId}/events`,
        data
    });
};

/**
 * Update tip on the scene
 *
 * @param sceneId - The ID of the scene
 * @param tip - The name of the tip
 * @returns The request object
 */
export const homeSceneTip = (sceneId: number, tip: string) => {
    return Ajax.post({
        url: `${api.homeUrl}/editor/scene/${sceneId}/tips/${tip}`
    });
};
