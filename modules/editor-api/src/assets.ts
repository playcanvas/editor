import { Events, ObserverList } from '@playcanvas/observer';

import { Asset, AssetObserver } from './asset';
import { createScript } from './assets/create-script';
import { createTemplate } from './assets/create-template';
import { instantiateTemplates } from './assets/instantiate-templates';
import { uploadFile } from './assets/upload';
import { Entity } from './entity';
import { globals as api } from './globals';
/**
 * Arguments passed when uploading an asset file.
 */
export type AssetUploadArguments = {
    /**
     * The parent folder asset where the asset should be placed.
     */
    folder?: Asset;

    /**
     * The id of the parent folder asset.
     */
    folderId?: number;

    /**
     * The filename of the uploaded file.
     */
    filename?: string;

    /**
     * The file being uploaded.
     */
    file?: File | Blob;

    /**
     * The type of the asset we are uploading. See {@link Asset} for available asset types.
     */
    type?: string;

    /**
     * The name of the asset.
     */
    name?: string;

    /**
     * The tags of the asset.
     */
    tags?: string[];

    /**
     * The id of the source asset.
     */
    sourceAssetId?: number;

    /**
     * The asset data. This depends on the asset type. See {@link Asset} for asset data depending on the type.
     */
    data?: object;

    /**
     * Whether to preload the asset. Defaults to true.
     */
    preload?: boolean;

    /**
     * If an asset id is specified then this asset will be updated instead of creating a new asset.
     */
    id?: number;
};

/**
 * Import settings used when uploading a texture asset.
 */
export type TextureImportSettings = {
    /**
     * Whether to resize the texture to power of 2.
     */
    pow2?: boolean;

    /**
     * Whether to search for target assets to update throughout the whole project instead of just the same folder.
     */
    searchRelatedAssets?: boolean;
};

/**
 * Import settings used when uploading a scene (fbx etc.).
 */
export type SceneImportSettings = {
    /**
     * Whether to search for target assets to update throughout the whole project instead of just the same folder. Defaults to true.
     */
    searchRelatedAssets?: boolean;

    /**
     * Whether to overwrite existing model or create a new one. Defaults to true.
     */
    overwriteModel?: boolean;

    /**
     * Whether to overwrite existing animations or create new ones. Defaults to true.
     */
    overwriteAnimation?: boolean;

    /**
     * Whether to overwrite existing materials or create new ones. Defaults to true.
     */
    overwriteMaterial?: boolean;

    /**
     * Whether to overwrite existing textures or create new ones. Defaults to true.
     */
    overwriteTexture?: boolean;

    /**
     * Whether to resize embedded textures to power of 2. Defaults to true.
     */
    pow2?: boolean;

    /**
     * Whether to convert models to GLB. Defaults to true.
     */
    useGlb?: boolean;

    /**
     * The desired animation sample rate. Defaults to 10.
     */
    animSampleRate?: number;

    /**
     * The animation curve tolerance. Defaults to 0.
     */
    animCurveTolerance?: number;

    /**
     * Whether to enable cubic curves. Defaults to false.
     */
    animEnableCubic?: boolean;

    /**
     * Whether to use the fbx filename for animation names. Defaults to false.
     */
    animUseFbxFilename?: boolean;
};

/**
 * The Assets Editor API
 */
class Assets extends Events {
    private _uniqueIdToItemId: Record<number, number>;

    private _assets: ObserverList;

    private _parseScriptCallback: (asset: Asset) => any;

    private _defaultUploadCompletedCallback: (uploadId: number, asset: Asset) => any;

    private _defaultUploadProgressCallback: (uploadId: number, progress: number) => any;

    private _defaultUploadErrorCallback: (uploadId: number, error: Error) => any;

    private _uploadId: number;

    private _autoSubscribe: boolean;

    /**
     * Constructor
     *
     * @param options.autoSubscribe - Whether to auto subscribe to asset changes when assets are loaded.
     */
    constructor(options: { autoSubscribe?: boolean } = {}) {
        super();

        this._uniqueIdToItemId = {};

        this._assets = new ObserverList({
            index: 'id',
            sorted: (a: any, b: any) => {
                const f = +(b._data.type === 'folder') - +(a._data.type === 'folder');
                if (f !== 0) {
                    return f;
                }
                if ((a._data.name || '').toLowerCase() > (b._data.name || '').toLowerCase()) {
                    return 1;
                } else if ((a._data.name || '').toLowerCase() < (b._data.name || '').toLowerCase()) {
                    return -1;
                }
                return 0;
            }
        });

        this._parseScriptCallback = null;
        this._defaultUploadCompletedCallback = null;
        this._defaultUploadProgressCallback = null;
        this._defaultUploadErrorCallback = null;
        this._uploadId = 0;

        this._autoSubscribe = options.autoSubscribe || false;
        if (this._autoSubscribe && !api.messenger) {
            throw new Error('Cannot autosubscribe to asset changes without the messenger API');
        }

        if (api.messenger) {
            api.messenger.on('asset.new', this._onMessengerAddAsset.bind(this));
            api.messenger.on('asset.delete', this._onMessengerDeleteAsset.bind(this));
            api.messenger.on('assets.delete', this._onMessengerDeleteAssets.bind(this));
        }
    }

    private _onMessengerAddAsset(data: { asset: { branchId: string; id: string; source: boolean; status: string; type: any; source_asset_id: string; createdAt: any; }; }) {
        if (data.asset.branchId !== api.branchId) return;

        const uniqueId = parseInt(data.asset.id, 10);

        if (data.asset.source === false && data.asset.status && data.asset.status !== 'complete') {
            return;
        }

        let asset = this.getUnique(uniqueId);
        if (asset) return;

        asset = new Asset({
            id: uniqueId,
            uniqueId: uniqueId,
            type: data.asset.type,
            source: data.asset.source,
            source_asset_id: parseInt(data.asset.source_asset_id, 10),
            createdAt: data.asset.createdAt
        });

        if (this._autoSubscribe) {
            asset.loadAndSubscribe().then(() => {
                this.add(asset);
            });
        } else {
            asset.load().then(() => {
                this.add(asset);
            });
        }
    }

    private _onMessengerDeleteAsset(data: { asset: { id: any; }; }) {
        const asset = this.getUnique(data.asset.id);
        if (asset) {
            this.remove(asset);
        }
    }

    private _onMessengerDeleteAssets(data: { assets: string | any[]; }) {
        for (let i = 0; i < data.assets.length; i++) {
            const asset = this.getUnique(parseInt(data.assets[i], 10));
            if (asset) {
                this.remove(asset);
            }
        }
    }

    /**
     * Gets asset by id
     *
     * @param id - The asset id
     * @returns The asset
     */
    get(id: number): Asset | null {
        const a = this._assets.get(id);
        return a ? a.apiAsset : null;
    }

    /**
     * Gets asset by its unique id
     *
     * @param uniqueId - The unique id
     * @returns The asset
     */
    getUnique(uniqueId: number): Asset | null {
        const id = this._uniqueIdToItemId[uniqueId];
        return id ? this.get(id) : null;
    }

    /**
     * Returns array of all assets
     *
     * @returns The assets
     */
    list() {
        return this._assets.array().map((a: AssetObserver) => a.apiAsset);
    }

    /**
     * Finds all assets with specified tags
     *
     * @param tags - The tags. If multiple tags are specified then assets that contain ANY of the specified
     * tags will be included. If an argument is an array of tags then assets that contain ALL of the tags in the array will be included.
     * @returns The assets
     */
    listByTag(...tags: any[]) {
        return this.filter((asset: Asset) => {
            const t = asset.get('tags');
            for (let i = 0; i < tags.length; i++) {
                if (Array.isArray(tags[i])) {
                    let countTags = 0;
                    for (let j = 0; j < tags[i].length; j++) {
                        if (t.includes(tags[i][j])) {
                            countTags++;
                        } else {
                            break;
                        }
                    }

                    if (countTags === tags[i].length) {
                        return true;
                    }
                } else {
                    if (t.includes(tags[i])) {
                        return true;
                    }
                }
            }

            return false;
        });
    }

    /**
     * Adds asset to the list
     *
     * @category Internal
     * @param asset - The asset
     */
    add(asset: Asset) {
        asset.initializeHistory();

        const pos = this._assets.add(asset.observer);
        if (pos === null) return;

        const id = asset.get('id');
        this._uniqueIdToItemId[asset.get('uniqueId')] = id;

        asset.observer.on('name:set', (name: string, oldName: string) => {
            name = (name || '').toLowerCase();
            oldName = (oldName || '').toLowerCase();

            const ind = this._assets.data.indexOf(asset.observer);
            let pos = this._assets.positionNextClosest(asset.observer, (a: any, b: any) => {
                const f = +(b._data.type === 'folder') - +(a._data.type === 'folder');

                if (f !== 0) {
                    return f;
                }

                if ((a === b ? oldName : (a._data.name || '').toLowerCase()) > name) {
                    return 1;
                } else if ((a === b ? oldName : (a._data.name || '').toLowerCase()) < name) {
                    return -1;
                }
                return 0;

            });

            if (pos === -1 && (ind + 1) === this._assets.data.length) {
                return;
            }

            if (ind !== -1 && (ind + 1 === pos) || (ind === pos)) {
                return;
            }

            if (ind < pos) {
                pos--;
            }

            this._assets.move(asset.observer, pos);
            this.emit('move', asset, pos);
        });

        this.emit(`add[${id}]`, asset, pos);
        this.emit('add', asset, pos);
    }

    /**
     * Removes asset from the list
     *
     * @category Internal
     * @param asset - The asset
     */
    remove(asset: Asset) {
        if (!this._assets.has(asset.observer)) return;

        this._assets.remove(asset.observer);

        delete this._uniqueIdToItemId[asset.get('uniqueId')];
        asset.observer.destroy();

        if (api.realtime) {
            api.realtime.assets.unload(asset.get('uniqueId'));
        }

        this.emit('remove', asset);
        this.emit(`remove[${asset.get('id')}]`);
    }

    /**
     * Removes all assets from the list
     *
     * @category Internal
     */
    clear() {
        const assets = this.list();
        if (!assets.length) return;

        this._assets.clear();

        let i = assets.length;
        while (i--) {
            this.remove(assets[i]);
        }

        this.emit('clear');
    }

    /**
     * Gets assets that satisfy function
     *
     * @param fn - The function (takes an asset as an argument and returns boolean).
     * @returns The assets
     */
    filter(fn: Function) {
        return this._assets.data
        .filter((observer: { apiAsset: any; }) => fn(observer.apiAsset))
        .map((observer: { apiAsset: any; }) => observer.apiAsset);
    }

    /**
     * Finds first asset that satisfies function
     *
     * @param fn - A function that takes an asset as an argument and returns boolean.
     * @returns The asset
     */
    findOne(fn: Function) {
        const result = this._assets.data.find((observer: { apiAsset: any; }) => fn(observer.apiAsset));
        return result ? result.apiAsset : null;
    }

    /**
     * Loads all assets in the current project / branch. Does not
     * subscribe to realtime changes.
     *
     * @category Internal
     * @param options.view - The desired view for the REST API e.g 'designer', 'shader-editor'. This might limit
     * the assets returned to a smaller subset depending on the view.
     */
    async loadAll(options: { view?: string } = {}) {
        this.clear();

        this.emit('load:progress', 0.1);

        const response = await fetch(`/api/projects/${api.projectId}/assets?branchId=${api.branchId}&view=${options.view || 'designer'}`);
        if (!response.ok) {
            console.error(`Could not load assets: [${response.status}] - ${response.statusText}`);
            return;
        }

        const assets = await response.json();
        this.emit('load:progress', 0.5);

        const total = assets.length;
        if (!total) {
            this.emit('load:progress', 1);
            this.emit('load:all');
            return;
        }

        let loaded = 0;

        const onProgress = () => {
            loaded++;
            if (loaded === total) {
                this.emit('load:progress', 1);
                this.emit('load:all');
            } else {
                this.emit('load:progress', (loaded / total) * 0.5 + 0.5);
            }
        };

        for (let i = 0; i < total; i++) {
            const asset = new Asset(assets[i]);
            asset.load().then(() => {
                this.add(asset);
                onProgress();
            }).catch((err) => {
                onProgress();
            });
        }
    }

    /**
     * Loads all assets in the current project / branch
     * and subscribes to changes.
     *
     * @param options.view - The desired view for the REST API e.g 'designer', 'shader-editor'. This might limit
     * the assets returned to a smaller subset depending on the view.
     * @category Internal
     */
    async loadAllAndSubscribe(options: { view?: string } = {}) {
        this.clear();

        this.emit('load:progress', 0.1);

        const response = await fetch(`/api/projects/${api.projectId}/assets?branchId=${api.branchId}&view=${options.view || 'designer'}`);
        if (!response.ok) {
            console.error(`Could not load assets: [${response.status}] - ${response.statusText}`);
            return;
        }

        const assets = await response.json();
        this.emit('load:progress', 0.5);

        const total = assets.length;
        if (!total) {
            this.emit('load:progress', 1);
            this.emit('load:all');
            return;
        }

        const batchSize = 256;
        let loaded = 0;
        let startBatch = 0;

        const onProgress = () => {
            loaded++;
            if (loaded === total) {
                this.emit('load:progress', 1);
                this.emit('load:all');
            } else {
                this.emit('load:progress', (loaded / total) * 0.5 + 0.5);
            }
        };

        while (startBatch < total) {
            api.realtime.connection.startBulkSubscribe();
            for (let i = startBatch; i < startBatch + batchSize && i < total; i++) {
                const asset = new Asset(assets[i]);
                asset.loadAndSubscribe().then(() => {
                    this.add(asset);
                    onProgress();
                }).catch((err) => {
                    onProgress();
                });
            }
            api.realtime.connection.endBulkSubscribe();

            startBatch += batchSize;
        }
    }

    /**
     * Gets the first script asset that contains the specified script
     *
     * @param script - The script name
     * @returns The script asset
     */
    getAssetForScript(script: string) {
        return this.findOne((asset: Asset) => {
            return asset.get('type') === 'script' &&
                   asset.has(`data.scripts.${script}`);
        });
    }

    /**
     * Creates new asset
     *
     * @param data - The asset fields
     * @param settings - Import settings
     * @param onProgress - Function to report progress
     * @returns The new asset
     */
    async upload(data: AssetUploadArguments, settings: TextureImportSettings | SceneImportSettings = {}, onProgress: Function | null = null) {
        if (data.folder) {
            data.folderId = data.folder.get('id');
        }

        const uploadId = this._uploadId++;
        if (!onProgress && this._defaultUploadProgressCallback) {
            onProgress = (progress: number) => {
                this._defaultUploadProgressCallback(uploadId, progress);
            };
        }

        try {
            const result = await uploadFile(data, settings, onProgress || this._defaultUploadProgressCallback);
            let asset = this.get(result.id);
            if (!asset) {
                asset = await new Promise((resolve) => {
                    this.once(`add[${result.id}]`, (a) => {
                        resolve(a);
                    });
                });
            }

            if (this._defaultUploadCompletedCallback) {
                this._defaultUploadCompletedCallback(uploadId, asset);
            }

            return asset;
        } catch (err) {
            if (this._defaultUploadErrorCallback) {
                this._defaultUploadErrorCallback(uploadId, err);
            }

            throw err;
        }
    }

    /**
     * Creates new anim state graph asset.
     *
     * @param options.name - The asset name
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.data - The asset data. See {@link Asset} for Animstategraph data.
     * @param options.folder - The parent folder asset
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createAnimStateGraph(options: { name?: string; preload?: boolean; data?: object; folder?: Asset; onProgress?: Function; } = {}) {
        return this.upload({
            name: options.name || 'New Anim State Graph',
            type: 'animstategraph',
            data: options.data || api.schema.assets.getDefaultData('animstategraph'),
            folder: options.folder,
            preload: options.preload
        }, null, options.onProgress);
    }

    /**
     * Creates new bundle asset
     *
     * @param options.name - The asset name
     * @param options.assets - The assets that the bundle will contain
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createBundle(options: { name?: string; assets?: any[]; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        return this.upload({
            name: options.name || 'New Bundle',
            type: 'bundle',
            folder: options.folder,
            data: {
                assets: (options.assets || []).map((a: any) => a.get('id'))
            },
            preload: options.preload
        }, null, options.onProgress);
    }

    /**
     * Creates new CSS asset
     *
     * @param options.name - The asset name
     * @param options.text - The CSS
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createCss(options: { name?: string; text?: string; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        return this.upload({
            name: options.name || 'New Css',
            type: 'css',
            folder: options.folder,
            filename: 'asset.css',
            file: new Blob([options.text || '\n'], { type: 'text/css' }),
            preload: options.preload
        }, null, options.onProgress);
    }

    /**
     * Creates new cubemap asset
     *
     * @param options.name - The asset name
     * @param options.textures - The textures for each cubemap face in this order:
     * right, left, up, down, front, back
     * @param options.minFilter - Cubemap minFilter value. Defaults to pc.FILTER_LINEAR_MIPMAP_LINEAR.
     * @param options.magFilter - Cubemap magFilter value. Defaults to pc.FILTER_LINEAR.
     * @param options.anisotropy - Cubemap anisotropy value. Defaults to 1.
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createCubemap(options: { name?: string; textures?: any[]; minFilter?: number; magFilter?: number; anisotropy?: number; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        const textures = (options.textures || new Array(6)).slice(0, 6);
        for (let i = 0; i < 6; i++) {
            textures[i] = (textures[i] ? textures[i].get('id') : null);
        }

        return this.upload({
            name: options.name || 'New Cubemap',
            type: 'cubemap',
            folder: options.folder,
            preload: options.preload,
            data: {
                name: options.name || 'New Cubemap',
                textures: textures,
                minFilter: options.minFilter !== undefined ? options.minFilter : 5, // linear mipmap linear
                magFilter: options.magFilter !== undefined ? options.magFilter : 1, // linear
                anisotropy: options.anisotropy !== undefined ? options.anisotropy : 1
            }
        }, null, options.onProgress);
    }

    /**
     * Creates a new folder asset
     *
     * @param options.name - The asset name
     * @param options.folder - The parent folder asset
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createFolder(options: { name?: string; folder?: Asset; onProgress?: Function; }) {
        return this.upload({
            name: options.name || 'New Folder',
            type: 'folder',
            folder: options.folder
        }, null, options.onProgress);
    }

    /**
     * Creates new HTML asset
     *
     * @param options.name - The asset name
     * @param options.text - The HTML
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createHtml(options: { name?: string; text?: string; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        return this.upload({
            name: options.name || 'New Html',
            type: 'html',
            folder: options.folder,
            preload: options.preload,
            filename: 'asset.html',
            file: new Blob([options.text || '\n'], { type: 'text/html' })
        }, null, options.onProgress);
    }

    /**
     * Creates new JSON asset
     *
     * @param options.name - The asset name
     * @param options.json - The JSON
     * @param options.spaces - The number of spaces used for indentation. Defaults to 0
     * (tightly packed output).
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createJson(options: { name?: string; json?: object; spaces?: number; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        const spaces = options.spaces ?? 0;
        const str = JSON.stringify(options.json || {}, null, spaces);

        return this.upload({
            name: options.name || 'New Json',
            type: 'json',
            folder: options.folder,
            preload: options.preload,
            filename: 'asset.json',
            file: new Blob([str], { type: 'application/json' })
        }, null, options.onProgress);
    }

    /**
     * Creates new localization JSON asset
     *
     * @param options.name - The asset name
     * @param options.localizationData - The localization data. If null then default data will be used.
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createI18n(options: { name?: string; localizationData?: object; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        return this.createJson({
            name: options.name,
            json: options.localizationData || {
                'header': {
                    'version': 1
                },
                'data': [{
                    'info': {
                        'locale': 'en-US'
                    },
                    'messages': {
                        'key': 'Single key translation',
                        'key plural': ['One key translation', 'Translation for {number} keys']
                    }
                }]
            },
            folder: options.folder,
            preload: options.preload,
            spaces: 4,
            onProgress: options.onProgress
        });
    }

    /**
     * Creates new material asset
     *
     * @param options.name - The asset name
     * @param options.data - The material data. Default values will be used for missing fields. See {@link Asset} for material data.
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createMaterial(options: { name?: string; data?: Record<string, any>; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        const defaultData = api.schema.assets.getDefaultData('material') as any;
        if (options.data) {
            for (const key in defaultData) {
                if (options.data[key]) {
                    defaultData[key] = options.data[key];
                }
            }
        }

        return this.upload({
            name: options.name || 'New Material',
            type: 'material',
            folder: options.folder,
            data: defaultData,
            preload: options.preload
        }, null, options.onProgress);
    }

    /**
     * Creates new script asset
     *
     * @param options.filename - The filename of the script. This will also be the name of the script asset. If not defined it will be generated
     * from the name of the script.
     * @param options.text - The contents of the script. If none then boilerplate code will be used.
     * @param options.data - The script data. See {@link Asset} for Script data.
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    async createScript(options: { filename?: string; text?: string; data?: object; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        if (!options.filename) {
            throw new Error('createScript: missing required filename');
        }

        const result = createScript(options.filename, options.text);

        const asset = await this.upload({
            name: result.filename,
            type: 'script',
            folder: options.folder,
            filename: result.filename,
            file: new Blob([result.content], { type: 'text/javascript' }),
            preload: options.preload,
            data: options.data || {
                scripts: { },
                loading: false,
                loadingType: 0 // load script as asset
            }
        }, null, options.onProgress);

        // wait for asset to have a file url
        if (this._parseScriptCallback) {
            if (!asset.get('file.url')) {
                await new Promise((resolve) => {
                    asset.once('file.url:set', resolve);
                });
            }

            const scripts = await this._parseScriptCallback(asset);
            // check if all scripts have been set to the asset
            // because of possible network delays.
            // if not then wait until those scripts have been set
            // before returning
            const wait: Promise<any>[] = [];
            scripts.forEach((script: string) => {
                if (!asset.has(`data.scripts.${script}`)) {
                    wait.push(new Promise((resolve) => {
                        asset.once(`data.scripts.${script}:set`, resolve);
                    }));
                }
            });

            await Promise.all(wait);
        }

        return asset;
    }

    /**
     * Creates new shader asset
     *
     * @param options.name - The asset name
     * @param options.text - The GLSL
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createShader(options: { name?: string; text?: string; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        return this.upload({
            name: options.name || 'New Shader',
            type: 'shader',
            folder: options.folder,
            preload: options.preload,
            filename: 'asset.glsl',
            file: new Blob([options.text || '\n'], { type: 'text/x-glsl' })
        }, null, options.onProgress);
    }

    /**
     * Creates new sprite asset
     *
     * @param options.name - The asset name
     * @param options.pixelsPerUnit - The sprite's pixels per unit value. Defaults to 100.
     * @param options.frameKeys - The sprite's frame keys
     * @param options.textureAtlas - The sprite's texture atlas asset
     * @param options.renderMode - The sprite's render mode. Defaults to pc.SPRITE_RENDERMODE_SIMPLE.
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createSprite(options: { name?: string; pixelsPerUnit?: number; frameKeys?: any[]; textureAtlas?: Asset; renderMode?: number; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        const data: any = {};
        data.pixelsPerUnit = options.pixelsPerUnit !== undefined ? options.pixelsPerUnit : 100;
        data.frameKeys = options.frameKeys ? options.frameKeys.map((val: any) => val.toString()) : [];
        data.textureAtlasAsset = options.textureAtlas ? options.textureAtlas.get('id') : null;
        data.renderMode = options.renderMode !== undefined ? options.renderMode : 0;

        return this.upload({
            name: options.name || 'New Sprite',
            type: 'sprite',
            folder: options.folder,
            preload: options.preload,
            data: data
        }, null, options.onProgress);
    }

    /**
     * Creates new text asset
     *
     * @param options.name - The asset name
     * @param options.text - The text
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    createText(options: { name?: string; text?: string; folder?: Asset; preload?: boolean; onProgress?: Function; } = {}) {
        return this.upload({
            name: options.name || 'New Text',
            type: 'text',
            folder: options.folder,
            preload: options.preload,
            filename: 'asset.txt',
            file: new Blob([options.text || '\n'], { type: 'text/plain' })
        }, null, options.onProgress);
    }

    /**
     * Creates new template asset
     *
     * @param options.name - The asset name
     * @param options.entity - The entity to create the template from
     * @param options.folder - The parent folder asset
     * @param options.preload - Whether to preload the asset. Defaults to true.
     * @param options.onProgress - Function to report progress
     * @returns The new asset
     */
    async createTemplate(options: { name?: string; entity: Entity; folder?: Asset; preload?: boolean; onProgress?: Function; }) {
        const {
            entities,
            oldToNewIds
        } = createTemplate(options.entity);

        const asset = await this.upload({
            name: options.name || options.entity.get('name'),
            type: 'template',
            folder: options.folder,
            preload: options.preload,
            data: { entities }
        }, null, options.onProgress);

        const history = options.entity.history.enabled;
        options.entity.history.enabled = false;
        options.entity.set('template_id', parseInt(asset.get('id'), 10));
        options.entity.set('template_ent_ids', oldToNewIds);
        options.entity.history.enabled = history;
    }

    /**
     * Deletes specified assets
     *
     * @param assets - The assets
     */
    async delete(assets: Asset[]) {
        const response = await fetch('/api/assets', {
            body: JSON.stringify({
                assets: assets.map(a => a.get('id')),
                branchId: api.branchId
            }),
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`${response.status}: ${response.statusText}`);
        }

        assets.forEach(a => this.remove(a));
    }

    /**
     * Instantiates the specified template assets under the specified
     * parent entity.
     *
     * @param assets - The template assets.
     * @param parent - The parent entity
     * @param options.index - The desired index under the parent to instantiate the templates.
     * @param options.history - Whether to record a history action.
     * @param options.select - Whether to select the new entities.
     * @param options.extraData - Extra data passed to the backend. Used by the Editor on specific cases.
     * @returns The new entities
     */
    instantiateTemplates(assets: Asset[], parent: Entity, options: { index?: number; history?: boolean; select?: boolean; extraData?: object; } = {}) {
        return instantiateTemplates(assets, parent, options);
    }

    get raw() {
        return this._assets;
    }

    /**
     * Sets the default callback called when on asset upload succeeds.
     * The function takes 2 arguments: the upload id, and the new asset.
     */
    set defaultUploadCompletedCallback(value) {
        this._defaultUploadCompletedCallback = value;
    }

    /**
     * Gets the default callback called when on asset upload succeeds.
     */
    get defaultUploadCompletedCallback() {
        return this._defaultUploadCompletedCallback;
    }

    /**
     * Sets the default callback called when on asset upload progress.
     * The function takes 2 arguments: the upload id and the progress.
     */
    set defaultUploadProgressCallback(value) {
        this._defaultUploadProgressCallback = value;
    }

    /**
     * Gets the default callback called when on asset upload progress.
     */
    get defaultUploadProgressCallback() {
        return this._defaultUploadProgressCallback;
    }

    /**
     * Sets the default callback called when on asset upload progress.
     * The function takes 2 arguments: the upload id, and the error.
     */
    set defaultUploadErrorCallback(value) {
        this._defaultUploadErrorCallback = value;
    }

    /**
     * Gets the default callback called when on asset upload fails.
     */
    get defaultUploadErrorCallback() {
        return this._defaultUploadErrorCallback;
    }

    /**
     * Sets the callback which parses script assets. When this
     * callback is set, new script assets will be parsed after they
     * are created. The function takes the asset as a parameter and returns
     * a promise with a list of script names when it is done parsing.
     */
    set parseScriptCallback(value) {
        this._parseScriptCallback = value;
    }

    /**
     * Gets the callback which parses script assets.
     */
    get parseScriptCallback() {
        return this._parseScriptCallback;
    }
}

export { Assets };
