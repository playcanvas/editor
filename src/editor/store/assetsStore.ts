import filenamify from 'filenamify/browser';

import { bytesToHuman } from '@/common/utils';

import { BaseStore, EMPTY_THUMBNAIL_IMAGE, EMPTY_THUMBNAIL_IMAGE_LARGE, STORE_ITEM_PAGE_SIZE } from './baseStore';

class AssetsStore extends BaseStore {
    constructor(args) {
        super();
        this.searchResults = [];
        this.sortPolicy = 'created';
    }

    get name() {
        return 'playcanvasStore';
    }

    async load(selectedFilter, searchString, tags, sortDescending) {
        this.totalCount = 0;
        this.startItem = 0;

        this.searchResults = await editor.call('store:list',
            searchString,
            0,
            STORE_ITEM_PAGE_SIZE,
            selectedFilter.text,
            tags,
            this.sortPolicy,
            sortDescending);

        // real number of records matching the query
        this.totalCount = this.searchResults.pagination?.total || 0;
        return this.prepareItems(this.searchResults.result);
    }

    async loadMore(selectedFilter, searchString, tags, sortDescending) {
        const values = await editor.call('store:list',
            searchString,
            this.items.length,
            STORE_ITEM_PAGE_SIZE,
            selectedFilter.text,
            tags,
            this.sortPolicy,
            sortDescending);

        // real number of records matching the query
        this.totalCount = values.pagination.total;
        if (values.result) {
            this.startItem = this.items.length;
            this.items = this.items.concat(this.prepareItems(values.result));
        }
    }

    moreExists() {
        return this.items.length < this.totalCount;
    }

    async cloneItem(storeItem) {
        // use invoke to handle exceptions
        await editor.call('store:clone', storeItem.id, filenamify(storeItem.name), storeItem.license, config.project.id);
    }

    buildSorting(sortingDropdown, sortCallback) {
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Name', 'name');
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Created', 'created', true);
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Size', 'size');
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Downloads', 'downloads');
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Views', 'views');
        this.sortPolicy = 'created';
        this.sortCallback = sortCallback;
    }

    // prepare playcanvas store assets for the items details view
    // extract glb data from the sketchfab item
    _prepareAssets(items) {
        const newItems = [];
        if (!items) {
            return newItems;
        }

        for (const item of items) {
            const newItem = {
                name: item.file ? item.file.filename : item.name,
                size: item.file ? bytesToHuman(item.file.size) : '0 B',
                type: item.type,
                id: item.id
            };
            newItems.push(newItem);
        }
        return newItems;
    }

    async _loadAssets(id) {
        const results =  await editor.api.globals.rest.store.storeAssets(id).promisify();
        return results.result;
    }

    _isModelAsset(asset) {
        const filename = asset.file ? asset.file.filename : null;
        return (filename && String(filename).match(/\.glb$/) !== null) || (asset.type === 'gsplat');
    }

    _isTextureAsset(asset) {
        const type = asset.type;
        return ['texture', 'textureatlas'].includes(type);
    }

    _prepareViewerUrl(item, assets) {

        // model viewer with the first asset in the list
        const hostname = window.location.hostname;
        const encodeUrl = (url) => {
            return encodeURIComponent(`https://${hostname}${url}`);
        };

        const modelUrls = [];
        const textureUrls = [];

        for (const asset of assets) {
            if (!asset.file || !asset.file.filename) {
                return;
            }

            const url = `/api/store/assets/${asset.id}/file/${asset.file.filename}`;
            if (this._isModelAsset(asset) && modelUrls.length === 0) {
                modelUrls.push(encodeUrl(url));
            } else if (this._isTextureAsset(asset)) {
                textureUrls.push(encodeUrl(url));
            }
        }

        if (modelUrls.length) {
            return `/viewer?load=${modelUrls.join('&load=')}`;
        }

        if (textureUrls.length) {
            return `/texture-tool?load=${textureUrls.join('&load=')}`;
        }
    }

    async _prepareItem(item) {

        let thumbnail = EMPTY_THUMBNAIL_IMAGE_LARGE;
        if (item.pictures.length) {
            const pictures = `${config.url.images}/${config.aws.s3Prefix}files/pictures/`;
            thumbnail = `${pictures + item.pictures[0]}/1280x720.jpg`;
        }

        const assets = await this._loadAssets(item.id);
        let viewerUrl;
        if (assets && assets.length) {
            viewerUrl = this._prepareViewerUrl(item, assets);
        }
        const processedAssets = this._prepareAssets(assets);

        const tags = [];
        for (const tag of item.tags) {
            tags.push({ name: tag, slug: tag });
        }

        return {
            id: item.id,
            name: item.name,
            size: item.size,
            modified: item.modified,
            views: item.views,
            downloads: item.downloads,
            description: item.description,
            license: item.license,
            thumbnail: thumbnail,
            viewerUrl: viewerUrl,
            assets: processedAssets,
            tags: tags,
            store: 'playcanvas'
        };
    }

    prepareItems(items) {
        const newItems = [];

        if (!items) {
            return newItems;
        }

        const self = this;
        const load = async function (item) {
            return self._prepareItem(await editor.api.globals.rest.store.storeGet(item.id).promisify());
        };

        for (const item of items) {
            let url = EMPTY_THUMBNAIL_IMAGE;
            if (item.pictures.length) {
                const pictures = `${config.url.images}/${config.aws.s3Prefix}files/pictures/`;
                url = `${pictures + item.pictures[0]}/480x320.jpg`;
            }

            const newItem = {
                id: item.id,
                name: item.name,
                description: item.description,
                pictures: [url],
                views: item.views,
                size: item.size,
                downloads: item.downloads,
                created: item.created,
                license: item.license,
                store: 'playcanvas',
                load: load,
                enabled: true
            };
            newItems.push(newItem);
        }
        return newItems;
    }
}

export { AssetsStore };
