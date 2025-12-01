import { Ajax } from '../ajax';
import { globals as api } from '../globals';


export type SceneCreateData = {
    /**
     * The ID of the project the scene is in
     */
    projectId: number;

    /**
     * The ID of the branch the scene is in
     */
    branchId: string;

    /**
     * The name of the scene
     */
    name?: string;

    /**
     * The ID of the scene to duplicate
     */
    duplicateFrom?: number;
};

/**
 * Creates a new scene
 *
 * @param data - The data for the new scene
 * @returns A request that responds with the new scene
 */
export const sceneCreate = (data: SceneCreateData) => {
    return Ajax.post({
        url: `${api.apiUrl}/scenes`,
        auth: true,
        data
    });
};

/**
 * Deletes the scene with the given ID
 *
 * @param sceneId - The ID of the scene to delete
 * @returns A request that responds when the scene is deleted
 */
export const sceneDelete = (sceneId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/scenes/${sceneId}?branchId=${api.branchId}`,
        auth: true
    });
};

/**
 * Gets the scene with the given ID
 *
 * @param sceneId - The ID of the scene to get
 * @param cookies - Whether to include cookies in the request
 * @returns A request that responds with the scene data
 */
export const sceneGet = (sceneId: number, cookies = false) => {
    return Ajax.get({
        url: `${api.apiUrl}/scenes/${sceneId}?branchId=${api.branchId}`,
        auth: true,
        cookies
    });
};
