import { Observer } from '@playcanvas/observer';

import { Ajax } from '../ajax';
import { globals as api } from '../globals';

export type AssetListOptions = {
    /**
     * The search string to use
     */
    search?: string;

    /**
     * Whether to use regex for the search
     */
    regex?: boolean;

    /**
     * The field to sort by
     */
    sort?: string;

    /**
     * The order to sort by
     */
    order?: number;

    /**
     * The number of assets to skip
     */
    skip?: number;

    /**
     * The number of assets to return
     */
    limit?: number;

    /**
     * The tags to filter by
     */
    tags?: string;
};

export type AssetGetFileOptions = {
    /**
     * The ID of the branch to get the file from
     */
    branchId?: string;

    /**
     * The immutable backup ID to get the file from
     */
    immutableBackup?: string;
};

export type AssetReimportData = {
    /**
     * Whether to use power of two textures
     */
    pow2?: boolean;

    /**
     * The animation sample rate
     */
    searchRelatedAssets?: boolean;

    /**
     * Whether to search for related assets
     */
    overwriteModel?: boolean;

    /**
     * Whether to overwrite the model
     */
    overwriteAnimation?: boolean;

    /**
     * Whether to overwrite the animation
     */
    overwriteMaterial?: boolean;

    /**
     * Whether to overwrite the material
     */
    overwriteTexture?: boolean;

    /**
     * Whether to overwrite the texture
     */
    preserveMapping?: boolean;

    /**
     * Whether to preserve the mapping
     */
    useGlb?: boolean;

    /**
     * The animation sample rate
     */
    useContainers?: boolean;

    /**
     * Whether to use containers
     */
    meshCompression?: boolean;

    /**
     * Whether to use mesh compression
     */
    dracoDecodeSpeed?: number;

    /**
     * The speed of Draco decoding
     */
    dracoMeshSize?: number;

    /**
     * The size of Draco meshes
     */
    animUseFbxFilename?: boolean;
};

export type AssetDuplicateData = {
    /**
     * The type of the asset to duplicate
     */
    type: string;

    /**
     * The ID of the branch to duplicate the asset to
     */
    branchId: string;
};

export type AssetPasteData = {
    /**
     * The ID of the project the assets are from
     */
    projectId: number;

    /**
     * The ID of the branch the assets are from
     */
    branchId: string;

    /**
     * The ID of the project to paste the assets to
     */
    targetProjectId: string;

    /**
     * The ID of the branch to paste the assets to
     */
    targetBranchId: string;

    /**
     * Whether to keep the folder structure when pasting
     */
    keepFolderStructure: boolean;

    /**
     * The assets to paste
     */
    assets: string[];
};

export type AssetUpdateData = {
    /**
     * The name of the asset
     */
    name?: string;

    /**
     * The parent folder of the asset
     */
    parent?: Observer | string;

    /**
     * The type of the asset
     */
    type?: string;

    /**
     * The filename of the asset
     */
    filename?: string;

    /**
     * The file to add to the form
     */
    file?: File;
};

export type AssetCreateData = AssetUpdateData & {
    /**
     * The name of the asset
     */
    type: string;

    /**
     * The parent folder of the asset
     */
    asset?: Observer;

    /**
     * The type of the asset
     */
    tags?: string[];

    /**
     * The tags of the asset
     */
    source_asset_id?: string;

    /**
     * The source asset ID
     */
    data?: object;

    /**
     * The data of the asset
     */
    meta?: object;

    /**
     * The meta of the asset
     */
    preload?: boolean;

    /**
     * Whether to preload the asset
     */
    preloadDefault?: boolean;
};

export type AssetPipelineOptions = {
    /**
     * Whether to use power of two textures
     */
    pow2?: boolean;

    /**
     * Whether to search for related assets
     */
    searchRelatedAssets?: boolean;

    /**
     * Whether to overwrite the model
     */
    overwriteModel?: boolean;

    /**
     * Whether to overwrite the animation
     */
    overwriteAnimation?: boolean;

    /**
     * Whether to overwrite the material
     */
    overwriteMaterial?: boolean;

    /**
     * Whether to overwrite the texture
     */
    overwriteTexture?: boolean;

    /**
     * Whether to preserve the mapping
     */
    preserveMapping?: boolean;

    /**
     * Whether to use GLB
     */
    useGlb?: boolean;

    /**
     * The animation sample rate
     */
    animSampleRate?: number;

    /**
     * The animation curve tolerance
     */
    animCurveTolerance?: number;

    /**
     * Whether to enable cubic animations
     */
    animEnableCubic?: boolean;

    /**
     * Whether to use the FBX filename for animations
     */
    animUseFbxFilename?: boolean;

    /**
     * Whether to use containers
     */
    useContainers?: boolean;

    /**
     * Whether to use mesh compression
     */
    meshCompression?: boolean;

    /**
     * Whether to unwrap UVs
     */
    unwrapUv?: boolean;

    /**
     * The number of texels per meter for UV unwrapping
     */
    unwrapUvTexelsPerMeter?: number;

    /**
     * Whether to import morph normals
     */
    importMorphNormals?: boolean;
};

/**
 * Fetches asset data for the given asset
 *
 * @param options - The options for the request
 * @returns A request that responds with the asset data
 */
export const assetsList = (options: AssetListOptions) => {
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

    return Ajax.get({
        url: `${api.apiUrl}/assets?${params.join('&')}`
    });
};

/**
 * Gets the asset with the given ID
 *
 * @param assetId - The ID of the asset to get
 * @returns A request that responds with the asset
 */
export const assetGet = (assetId: string) => {
    return Ajax.get({
        url: `${api.apiUrl}/assets/${assetId}`
    });
};


/**
 * Fetches file data for the given asset
 *
 * @param assetId - The ID of the asset to get
 * @param fileName - The name of the file to get
 * @param options - The options for the request
 * @returns A request that responds with the file data
 */
export const assetGetFile = (assetId: string, fileName: string, options: AssetGetFileOptions) => {
    const params = [];
    if (options.branchId) {
        params.push(`branchId=${options.branchId}`);
    }
    if (options.immutableBackup) {
        params.push(`immutableBackup=${options.immutableBackup}`);
    }

    return Ajax.get({
        url: `${api.apiUrl}/assets/${assetId}/file/${fileName}?${params.join('&')}`,
        auth: true,
        notJson: true
    });
};

/**
 * Reimport asset
 *
 * @param assetId - The ID of the asset to reimport
 * @param data - The data to reimport
 * @returns A request that responds with the result of the reimport
 */
export const assetReimport = (assetId: string, data: AssetReimportData) => {
    return Ajax.post({
        url: `${api.apiUrl}/assets/${assetId}/reimport?branchId=${api.branchId}`,
        auth: true,
        data
    });
};

/**
 * Duplicates the asset with the given ID
 *
 * @param assetId - The ID of the asset to duplicate
 * @param data - The data to duplicate
 * @returns A request that responds with the result of the duplicate
 */
export const assetDuplicate = (assetId: string, data: AssetDuplicateData) => {
    return Ajax.post({
        url: `${api.apiUrl}/assets/${assetId}/duplicate`,
        auth: true,
        data,
        headers: {
            Accept: 'application/json'
        }
    });
};

/**
 * Pastes the given assets
 *
 * @param data - The data to paste
 * @param data.assets - The assets to paste
 * @returns A request that responds with the result of the paste
 */
export const assetPaste = (data: AssetPasteData) => {
    return Ajax.post({
        url: `${api.apiUrl}/assets/paste`,
        auth: true,
        data
    });
};

/**
 * Adds common asset fields to the given form
 *
 * @param form - The form to add the fields to
 * @param data - The data to use for the asset
 * @param pipeline - The pipeline options to use for the asset
 * @returns The form with the added fields
 */
const assetUpdateFields = (form: FormData, data: AssetUpdateData, pipeline: AssetPipelineOptions) => {
    // branch
    form.append('branchId', api.branchId);

    // name
    if (data.name) {
        form.append('name', data.name);
    }

    // parent
    if (data.parent) {
        if (data.parent instanceof Observer) {
            form.append('parent', data.parent.get('id'));
        } else {
            const id = parseInt(data.parent, 10);
            if (!isNaN(id)) {
                form.append('parent', `${id}`);
            }
        }
    }

    if (data.type) {
        switch (data.type) {
            case 'texture':
            case 'textureatlas':
                form.append('pow2', `${pipeline.pow2}`);
                form.append('searchRelatedAssets', `${pipeline.searchRelatedAssets}`);
                break;
            case 'scene':
                form.append('searchRelatedAssets', `${pipeline.searchRelatedAssets}`);
                form.append('overwriteModel', `${pipeline.overwriteModel}`);
                form.append('overwriteAnimation', `${pipeline.overwriteAnimation}`);
                form.append('overwriteMaterial', `${pipeline.overwriteMaterial}`);
                form.append('overwriteTexture', `${pipeline.overwriteTexture}`);
                form.append('pow2', `${pipeline.pow2}`);
                form.append('preserveMapping', `${pipeline.preserveMapping}`);
                form.append('useGlb', `${pipeline.useGlb}`);
                form.append('animSampleRate', `${pipeline.animSampleRate}`);
                form.append('animCurveTolerance', `${pipeline.animCurveTolerance}`);
                form.append('animEnableCubic', `${pipeline.animEnableCubic}`);
                form.append('animUseFbxFilename', `${pipeline.animUseFbxFilename}`);
                form.append('useContainers', `${pipeline.useContainers}`);
                form.append('meshCompression', `${pipeline.meshCompression}`);
                form.append('unwrapUv', `${pipeline.unwrapUv}`);
                form.append('unwrapUvTexelsPerMeter', `${pipeline.unwrapUvTexelsPerMeter}`);
                form.append('importMorphNormals', `${pipeline.importMorphNormals}`);
                break;
            case 'font':
                break;
            default:
                break;
        }
    }

    // filename
    if (data.filename) {
        form.append('filename', data.filename);
    }

    // file
    if (data.file && data.file.size) {
        form.append('file', data.file, data.filename || data.name);
    }

    return form;
};

/**
 * Creates a new asset
 *
 * @param data - The data to upload
 * @param pipeline - The pipeline options to use for the asset
 * @returns A request that responds with the result of the upload
 */
export const assetCreate = (data: AssetCreateData, pipeline: AssetPipelineOptions = {}) => {
    // NOTE
    // non-file form data should be above file,
    // to make it parsed on back-end first

    const form = new FormData();

    // scope
    form.append('projectId', `${api.projectId}`);

    // type
    if (!data.type) {
        throw new Error('Type is required for asset upload');
    }
    form.append('type', data.type);

    // update asset
    if (data.asset) {
        form.append('asset', data.asset.get('id'));
    }

    // tags
    if (data.tags) {
        form.append('tags', data.tags.join('\n'));
    }

    // source_asset_id
    if (data.source_asset_id) {
        form.append('source_asset_id', data.source_asset_id);
    }

    // data
    if (data.data) {
        form.append('data', JSON.stringify(data.data));
    }

    // meta
    if (data.meta) {
        form.append('meta', JSON.stringify(data.meta));
    }

    // preload
    form.append('preload', `${data.preload === undefined ? (data.preloadDefault ?? true) : data.preload}`);

    // update fields
    assetUpdateFields(form, data, pipeline);

    return Ajax.post({
        url: `${api.apiUrl}/assets`,
        auth: true,
        data: form,
        ignoreContentType: true,
        headers: {
            Accept: 'application/json'
        }
    });
};

/**
 * Updates the asset with the given ID
 *
 * @param assetId - The ID of the asset to update
 * @param data - The data to update
 * @param pipeline - The pipeline options to use for the asset
 * @returns A request that responds with the result of the update
 */
export const assetUpdate = (assetId: string, data: AssetUpdateData, pipeline: AssetPipelineOptions = {}) => {
    // NOTE
    // non-file form data should be above file,
    // to make it parsed on back-end first

    const form = new FormData();

    // update fields
    assetUpdateFields(form, data, pipeline);

    return Ajax.put({
        url: `${api.apiUrl}/assets/${assetId}`,
        auth: true,
        data: form,
        ignoreContentType: true,
        headers: {
            Accept: 'application/json' // Verified to be JSON response
        }
    });
};
