import { Ajax } from '../ajax';
import { globals as api } from '../globals';

type ProjectRequestArgs = {
    /**
     * The name of the project
     */
    name?: string;

    /**
     * The owner of the project
     */
    owner?: string;

    /**
     * The description of the project
     */
    description?: string;

    /**
     * The URL of the project
     */
    website?: string;

    /**
     * Whether the project is private
     */
    private?: boolean;

    /**
     * Whether the project's assets are private
     */
    private_source_assets?: boolean;

    /**
     * The ID of the project to fork from
     */
    fork_from?: number;

    /**
     * The image URL of the project
     */
    image_url?: string;

    /**
     * The settings for the project
     */
    settings?: object;

    /**
     * The primary app ID of the project
     */
    primary_app?: number;

    /**
     * The tags for the project
     */
    tags?: string[];
}

// requests
export type ProjectCreateArgs = Omit<ProjectRequestArgs, 'name'> & {
    /**
     * The name of the project
     */
    name: string;
}
export type ProjectUpdateArgs = ProjectRequestArgs & {
    /**
     * The ID of the project to update
     */
    projectId: number;

};
export type ProjectGetArgs = {
    /**
     * The ID of the project to get
     */
    projectId: number;
};
export type ProjectDeleteArgs = {
    /**
     * The ID of the project to delete
     */
    projectId: number;
};
export type ProjectImportArgs = {
    /**
     * The URL to export the project from
     */
    export_url: string;

    /**
     * The ID of the owner of the project
     */
    owner: number;
};
export type ProjectExportArgs = {
    /**
     * The ID of the project to export
     */
    projectId: number;
};

// TODO: Migrate to more structured args format
export type ProjectTransferData = {
    /**
     * The ID of the new owner of the project
     */
    owner_id: number;
};
export type ProjectCollabCreateData = {
    /**
     * The username of the collaborator
     */
    username: string;

    /**
     * The invitation of the collaborator
     */
    invitation: string;

    /**
     * The access level of the collaborator
     */
    access_level: string;
};
export type ProjectCollabUpdateData = {
    /**
     * The ID of the collaborator
     */
    id: string;

    /**
     * The access level of the collaborator
     */
    access_level: string;
};
export type ProjectBranchesOptions = {
    /**
     * The maximum number of branches to return
     */
    limit?: number;

    /**
     * The number of branches to skip
     */
    skip?: number;

    /**
     * Whether to return closed branches
     */
    closed?: boolean;

    /**
     * Whether to return favorite branches
     */
    favorite?: boolean;
};

// responses
// TODO: Implement response types
export type ProjectCreateResponse = object;
export type ProjectUpdateResponse = object;
export type ProjectGetResponse = object;
export type ProjectDeleteResponse = '';
export type ProjectImportResponse = object;
export type ProjectExportResponse = object;

/**
 * Creates a new project
 */
export const projectCreate = (args: ProjectCreateArgs) => {
    return Ajax.post<ProjectCreateResponse>({
        url: `${api.apiUrl}/projects`,
        auth: true,
        data: {
            name: args.name,
            owner: args.owner,
            description: args.description,
            website: args.website,
            private: args.private,
            private_source_assets: args.private_source_assets,
            fork_from: args.fork_from,
            image_url: args.image_url,
            settings: args.settings,
            primary_app: args.primary_app,
            tags: args.tags
        }
    });
};

/**
 * Updates a project
 */
export const projectUpdate = (args: ProjectUpdateArgs) => {
    return Ajax.put<ProjectUpdateResponse>({
        url: `${api.apiUrl}/projects/${args.projectId}`,
        auth: true,
        data: {
            name: args.name,
            owner: args.owner,
            description: args.description,
            website: args.website,
            private: args.private,
            private_source_assets: args.private_source_assets,
            fork_from: args.fork_from,
            image_url: args.image_url,
            settings: args.settings,
            primary_app: args.primary_app,
            tags: args.tags
        }
    });
};

/**
 * Gets a project by ID
 */
export const projectGet = (args: ProjectGetArgs) => {
    return Ajax.get<ProjectGetResponse>({
        url: `${api.apiUrl}/projects/${args.projectId}`,
        auth: true
    });
};

/**
 * Deletes a project by ID
 */
export const projectDelete = (args: ProjectDeleteArgs) => {
    return Ajax.delete<ProjectDeleteResponse>({
        url: `${api.apiUrl}/projects/${args.projectId}`,
        auth: true,
        notJson: true
    });
};

/**
 * Imports a project
 */
export const projectImport = (args: ProjectImportArgs) => {
    return Ajax.post<ProjectImportResponse>({
        url: `${api.apiUrl}/projects/import`,
        auth: true,
        data: args
    });
};

/**
 * Exports a project by ID
 */
export const projectExport = (args: ProjectExportArgs) => {
    return Ajax.post<ProjectExportResponse>({
        url: `${api.apiUrl}/projects/${args.projectId}/export`,
        auth: true
    });
};

/**
 * Unlocks a project by ID
 *
 * @param projectId - The ID of the project to unlock
 * @returns A request that responds when the project is unlocked
 */
export const projectUnlock = (projectId: number) => {
    return Ajax.post({
        url: `${api.apiUrl}/projects/${projectId}/unlock`,
        auth: true
    });
};

/**
 * Transfers a project by ID
 *
 * @param projectId - The ID of the project to transfer
 * @param data - The data for the project transfer
 * @returns A request that responds when the project is transferred
 */
export const projectTransfer = (projectId: number, data: ProjectTransferData) => {
    return Ajax.post({
        url: `${api.apiUrl}/projects/${projectId}/transfer`,
        auth: true,
        data
    });
};

/**
 * Accepts a project transfer by ID
 *
 * @param projectId - The ID of the project to accept the transfer for
 * @returns A request that responds when the project transfer is accepted
 */
export const projectAcceptTransfer = (projectId: number) => {
    return Ajax.post({
        url: `${api.apiUrl}/projects/${projectId}/accept_transfer`,
        auth: true
    });
};

/**
 * Declines a project transfer by ID
 *
 * @param projectId - The ID of the project to decline the transfer for
 * @returns A request that responds when the project transfer is declined
 */
export const projectDeclineTransfer = (projectId: number) => {
    return Ajax.post({
        url: `${api.apiUrl}/projects/${projectId}/decline_transfer`,
        auth: true
    });
};

/**
 * Get the project activity
 *
 * @param projectId - The ID of the project to get the activity for
 * @returns A request that responds with the project activity
 */
export const projectActivity = (projectId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${projectId}/activity`,
        auth: true
    });
};

/**
 * Get the project collaborators
 *
 * @param projectId - The ID of the project to get the collaborators for
 * @returns A request that responds with the project collaborators
 */
export const projectCollabList = (projectId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${projectId}/collaborators`,
        auth: true
    });
};

/**
 * Creates a new project collaborator
 *
 * @param projectId - The ID of the project to create the collaborator for
 * @param collab - The data for the new collaborator
 * @returns A request that responds with the new collaborator
 */
export const projectCollabCreate = (projectId: number, collab: ProjectCollabCreateData) => {
    return Ajax.post({
        url: `${api.apiUrl}/projects/${projectId}/collaborators`,
        auth: true,
        data: collab
    });
};

/**
 * Updates a project collaborator
 *
 * @param projectId - The ID of the project to update the collaborator for
 * @param collab - The data for the collaborator
 * @returns A request that responds with the updated collaborator
 */
export const projectCollabUpdate = (projectId: number, collab: ProjectCollabUpdateData) => {
    return Ajax.put({
        url: `${api.apiUrl}/projects/${projectId}/collaborators/${collab.id}`,
        auth: true,
        data: {
            access_level: collab.access_level
        }
    });
};

/**
 * Deletes a project collaborator
 *
 * @param projectId - The ID of the project to delete the collaborator for
 * @param collabId - The ID of the collaborator to delete
 * @returns A request that responds when the collaborator is deleted
 */
export const projectCollabDelete = (projectId: number, collabId: number) => {
    return Ajax.delete({
        url: `${api.apiUrl}/projects/${projectId}/collaborators/${collabId}`,
        auth: true
    });
};

/**
 * Uploads a project image
 *
 * @param projectId - The ID of the project to upload the image for
 * @param file - The image file to upload
 * @returns A request that responds with the uploaded image
 */
export const projectImage = (projectId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);

    return Ajax.post({
        url: `${api.apiUrl}/projects/${projectId}/image`,
        auth: true,
        data: form,
        ignoreContentType: true,
        headers: {
            Accept: 'application/json'
        }
    });
};

/**
 * Fetches a list of assets for the current project
 *
 * @param view - The view to get assets for
 * @param cookies - Whether to include cookies in the request
 * @returns A request that responds with the list of assets
 */
export const projectAssets = (view: string, cookies = false) => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${api.projectId}/assets?branchId=${api.branchId}&view=${view}`,
        auth: true,
        cookies
    });
};

/**
 * Fetches a list of scenes for the current project
 *
 * @returns A request that responds with the list of scenes
 */
export const projectScenes = () => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${api.projectId}/scenes?branchId=${api.branchId}`,
        auth: true
    });
};

/**
 * Fetches a list of branches for the current project
 *
 * @param options - The options for the request
 * @returns A request that responds with the list of branches
 */
export const projectBranches = (options: ProjectBranchesOptions) => {
    const params = [];
    if (options.limit) {
        params.push(`limit=${options.limit}`);
    }
    if (options.skip) {
        params.push(`skip=${options.skip}`);
    }
    if (options.closed) {
        params.push(`closed=${options.closed}`);
    }
    if (options.favorite) {
        params.push(`favorite=${options.favorite}`);
    }

    return Ajax.get({
        url: `${api.apiUrl}/projects/${api.projectId}/branches?${params.join('&')}`,
        auth: true
    });
};

/**
 * Fetches a list of apps for the current project
 *
 * @param limit - The maximum number of apps to return
 * @param skip - The number of apps to skip
 * @returns A request that responds with the list of apps
 */
export const projectApps = (limit = 0, skip = 0) => {
    const params = [];
    params.push(`limit=${limit}`);
    params.push(`skip=${skip}`);

    return Ajax.get({
        url: `${api.apiUrl}/projects/${api.projectId}/apps?${params.join('&')}`,
        auth: true
    });
};

/**
 * Fetches a list of repositories for the current project
 *
 * @returns A request that responds with the list of repositories
 */
export const projectRepoList = () => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${api.projectId}/repositories`,
        auth: true
    });
};

/**
 * Gets list of source files in the repository
 *
 * @param repoService - The repository to get the source files for
 * @returns A request that responds with the list of source files
 */
export const projectRepoSourcefilesList = (repoService: string) => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${api.projectId}/repositories/${repoService}/sourcefiles`,
        auth: true
    });
};

/**
 * Gets a source file from the repository
 *
 * @param repoService - The repository to get the source file from
 * @param relativePath - The relative path of the source file
 * @returns A request that responds with the source file
 */
export const projectRepoSourcefile = (repoService: string, relativePath: string) => {
    return Ajax.get({
        url: `${api.apiUrl}/projects/${api.projectId}/repositories/${repoService}/sourcefiles/${relativePath}`,
        auth: true,
        notJson: true
    });
};

/**
 * Deletes a source file from the repository
 *
 * @param fileName - The name of the source file to remove
 * @param repoService - The repository to remove the source file from
 * @returns A request that responds when the source file is removed
 */
export const projectRepoSourcefilesDelete = (fileName: string, repoService = 'directory') => {
    return Ajax.delete({
        url: `${api.apiUrl}/projects/${api.projectId}/repositories/${repoService}/sourcefiles/${fileName}`,
        auth: true
    });
};
