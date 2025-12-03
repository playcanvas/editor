import { Ajax } from '../ajax';
import { globals as api } from '../globals';

export type StoreCloneData = {
    scope: {
        /**
         * The type of the scope
         */
        type: string;

        /**
         * The ID of the scope
         */
        id: string;
    };

    /**
     * The name of the store item
     */
    name?: string;

    /**
     * The ID of the store to clone the item to
     */
    store?: string;

    /**
     * The ID of the folder to clone the item to
     */
    targetFolderId?: string;

    /**
     * The license of the store item
     */
    license?: string;
};

export type StoreListOptions = {
    /**
     * The search term to filter store items by
     */
    search?: string;

    /**
     * Whether to use regex to filter store items
     */
    regex?: boolean;

    /**
     * The field to sort store items by
     */
    sort?: string;

    /**
     * The order to sort store items by
     */
    order?: number;

    /**
     * The number of store items to skip
     */
    skip?: number;

    /**
     * The number of store items to return
     */
    limit?: number;

    /**
     * The tags to filter store items by
     */
    tags?: string;

    /**
     * The tags to exclude from the store items
     */
    excludeTags?: string;
};

export type StoreMoveData = {
    /**
     * The ID of the branch to move the assets from
     */
    branchId: string;

    /**
     * The IDs of the assets to move
     */
    assetIds: string[];
}

/**
 * Fetches store item
 *
 * @param storeId - The ID of the store item to fetch
 * @returns A request that responds with the store item
 */
export const storeGet = (storeId: number) => {
    return Ajax.get({
        url: `${api.apiUrl}/store/${storeId}`
    });
};

/**
 * Uploads a store item
 *
 * @param data - The data for the new store item
 * @param mimeType - The MIME type of the store item
 * @returns A request that responds with the new store item
 */
export const storeUpload = (data: object, mimeType: string) => {
    return Ajax.post({
        url: `${api.apiUrl}/store/upload`,
        auth: true,
        data,
        mimeType
    });
};

/**
 * Clones store item
 *
 * @param storeId - The ID of the store item to clone
 * @param data - The data for the new store item
 * @returns A request that responds with the new store item
 */
export const storeClone = (storeId: number, data: StoreCloneData) => {
    return Ajax.post({
        url: `${api.apiUrl}/store/${storeId}/clone`,
        auth: true,
        data,
        notJson: true
    });
};

/**
 * Fetches store assets
 *
 * @param storeId - The ID of the store to fetch assets from
 * @returns A request that responds with the store asset
 */
export const storeAssets = (storeId: string) => {
    return Ajax.get({
        url: `${api.apiUrl}/store/${storeId}/assets`
    });
};

/**
 * Fetches store asset file
 *
 * @param assetId - The ID of the asset to fetch
 * @param assetName - The name of the asset to fetch
 * @returns A request that responds with the store asset
 */
export const storeAssetFile = (assetId: string, assetName: string) => {
    return Ajax.get({
        url: `${api.apiUrl}/store/assets/${assetId}/file/${assetName}`,
        notJson: true
    });
};

/**
 * Fetches store licenses
 *
 * @returns A request that responds with the store licenses
 */
export const storeLicenses = () => {
    return Ajax.get({
        url: `${api.apiUrl}/store/licenses`
    });
};

/**
 * List store items filtered by search
 *
 * @param options - The options to filter store items by
 * @returns A request that responds with the list of store items
 */
export const storeList = (options: StoreListOptions) => {
    const params = [];

    if (options.search) {
        params.push(`search=${options.search}`);
    }

    if (options.regex) {
        params.push(`regexp=${options.regex}`);
    }

    if (options.sort) {
        params.push(`sort=${options.sort}`);
    }

    if (options.order) {
        params.push(`order=${options.order}`);
    }

    if (options.skip) {
        params.push(`skip=${options.skip}`);
    }

    if (options.limit) {
        params.push(`limit=${options.limit}`);
    }

    if (options.tags) {
        params.push(`tags=${options.tags}`);
    }

    if (options.excludeTags) {
        params.push(`excludeTags=${options.excludeTags}`);
    }

    return Ajax.get({
        url: `${api.apiUrl}/store?${params.join('&')}`,
        auth: true
    });
};

/**
 * Move assets to store
 *
 * @param storeId - The storeId to move the assets to
 * @param data - The data for the assets to move
 * @returns A request that responds when the assets are moved
 */
export const storeMove = (storeId: number, data: StoreMoveData) => {
    return Ajax.put({
        url: `${api.apiUrl}/store/move/${storeId}`,
        auth: true,
        data
    });
};
