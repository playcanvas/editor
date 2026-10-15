import { Ajax } from '../ajax';
import { globals as api } from '../globals';

export type PostCreateData = {
    /**
     * What the post belongs to; only projects are supported
     */
    scope: {
        type: 'project';
        id: number;
    };

    /**
     * The post title, up to 100 characters
     */
    title: string;

    /**
     * The post body, in markdown
     */
    text: string;
};

export type PostUpdateData = {
    /**
     * The post title, up to 100 characters
     */
    title?: string;

    /**
     * The post body, in markdown
     */
    text?: string;
};

/**
 * Lists the dev log posts of a project, without their text
 *
 * @param projectId - The ID of the project
 * @returns A request that responds with the posts
 */
export const postList = (projectId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${projectId}/posts`,
        auth: true
    });
};

/**
 * Fetches a post, including its text
 *
 * @param postId - The ID of the post
 * @returns A request that responds with the post
 */
export const postGet = (postId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/posts/${postId}`,
        auth: true
    });
};

/**
 * Creates a post
 *
 * @param data - The post to create
 * @returns A request that responds with the new post
 */
export const postCreate = (data: PostCreateData) => {
    return Ajax.post({
        url: `${api.apiUrl}/posts`,
        auth: true,
        data
    });
};

/**
 * Updates a post
 *
 * @param postId - The ID of the post
 * @param data - The fields to change
 * @returns A request that responds with the updated post
 */
export const postUpdate = (postId: number, data: PostUpdateData) => {
    return Ajax.put({
        url: `${api.apiUrl}/posts/${postId}`,
        auth: true,
        data
    });
};

/**
 * Deletes a post
 *
 * @param postId - The ID of the post
 * @returns A request that responds when the post is deleted
 */
export const postDelete = (postId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/posts/${postId}`,
        auth: true
    });
};
