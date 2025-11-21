import filenamify from 'filenamify/browser';

import { BaseStore, EMPTY_THUMBNAIL_IMAGE, EMPTY_THUMBNAIL_IMAGE_LARGE, STORE_ITEM_PAGE_SIZE } from './baseStore';
import { bytesToHuman } from '@/common/utils';

class MyAssetsStore extends BaseStore {
    constructor(args) {
        super();
        this.sortPolicy = 'createdAt';
    }

    get name() {
        return 'myAssetsStore';
    }

    async load(selectedFilter, searchString, tags, sortDescending) {
        this.totalCount = 0;
        this.startItem = 0;
        this.searchResults = await editor.call('store:assets:list',
            searchString,
            0,
            STORE_ITEM_PAGE_SIZE,
            tags,
            this.sortPolicy,
            sortDescending);

        // real number of records matching the query
        this.totalCount = this.searchResults.pagination?.total || 0;
        return this.prepareItems(this.searchResults.result);
    }

    async loadMore(selectedFilter, searchString, tags, sortDescending) {
        // sketchfab store - get the list of items
        const searchResults = await editor.call('store:assets:list',
            searchString,
            this.items.length,
            STORE_ITEM_PAGE_SIZE,
            tags,
            this.sortPolicy,
            sortDescending);

        if (searchResults.result) {
            this.startItem = this.items.length;
            this.items = this.items.concat(this.prepareItems(searchResults.result));
        }
    }

    moreExists() {
        return this.items.length < this.totalCount;
    }

    async cloneItem(asset) {
        // use invoke to handle exceptions
        await editor.call('myassets:clone', asset.id, filenamify(asset.name), config.project.id);
    }

    buildSorting(sortingDropdown, sortCallback) {
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Name', 'name', false);
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Created', 'created', true);
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Size', 'size');
        this.sortPolicy = 'created';
        this.sortCallback = sortCallback;
    }

    _getThumbnailUrl(id) {
        return `/api/assets/${id}/thumbnail/large`;
    }

    // prepare users assets for the list view
    prepareItems(items) {
        const newItems = [];

        if (!items) {
            return newItems;
        }

        const self = this;
        const load = async function (item) {
            return self._prepareItem(await editor.api.globals.rest.assets.assetGet(item.id).promisify());
        };

        for (const item of items) {
            let thumb = EMPTY_THUMBNAIL_IMAGE;
            if (item.hasThumbnail) {
                thumb =  this._getThumbnailUrl(item.id);
            }

            const newItem = {
                id: item.id,
                name: item.name,
                description: 'User generated splat',
                pictures: [thumb],
                size: item.file?.size || 0,
                created: item.createdAt,
                modified: item.modifiedAt,
                license: '',
                store: 'myassets',
                load: load,
                assets: [],
                enabled: true
            };
            newItems.push(newItem);
        }
        return newItems;
    }

    _prepareViewerUrl(asset) {
        // model viewer with the splat
        const splatUrl = encodeURIComponent(`/api/assets/${asset.id}/file/${asset.file.filename}`);
        return `/viewer?load=${splatUrl}`;
    }

    _prepareItem(asset) {

        let thumbnail = EMPTY_THUMBNAIL_IMAGE_LARGE;
        if (asset.hasThumbnail) {
            thumbnail =  `/api/assets/${asset.id}/thumbnail/xlarge`;
        }

        const viewerUrl = this._prepareViewerUrl(asset);

        const tags = [];
        for (const tag of asset.tags) {
            tags.push({ name: tag, slug: tag });
        }

        const assets = asset.file ? [{ name: asset.file.filename, size: bytesToHuman(asset.file.size) }] : [];

        return {
            id: asset.id,
            name: asset.name,
            size: asset.file?.size || 0,
            modified: asset.modifiedAt,
            description: 'User generated splat',
            license: '',
            thumbnail: thumbnail,
            viewerUrl: viewerUrl,
            assets: assets,
            tags: tags,
            store: 'myassets'
        };
    }
}

export { MyAssetsStore };
