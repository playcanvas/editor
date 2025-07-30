import filenamify from 'filenamify/browser'; // eslint-disable-line import/no-unresolved
import Markdown from 'markdown-it';

import { BaseStore, EMPTY_THUMBNAIL_IMAGE_LARGE, STORE_ITEM_PAGE_SIZE } from './baseStore.ts';
import { bytesToHuman } from '../../common/utils.ts';

const md = Markdown({});

class SketchFabStore extends BaseStore {
    constructor(args) {
        super();
        this.sortPolicy = 'viewCount';
    }

    get name() {
        return 'sketchfabStore';
    }

    async load(selectedFilter, searchString, tags, sortDescending) {
        this.totalCount = 0;
        this.startItem = 0;

        // sketchfab store - get the list of items
        this.searchResults = await editor.call('store:sketchfab:list',
            searchString,
            0,
            STORE_ITEM_PAGE_SIZE,
            tags,
            this.sortPolicy,
            sortDescending);

        return this.prepareItems(this.searchResults.results);
    }

    async loadMore(selectedFilter, searchString, tags, sortDescending) {
        // sketchfab store - get the list of items
        this.searchResults = await editor.call('store:sketchfab:list',
            searchString,
            this.items.length,
            STORE_ITEM_PAGE_SIZE,
            tags,
            this.sortPolicy,
            sortDescending);

        if (this.searchResults.results) {
            this.startItem = this.items.length;
            this.items = this.items.concat(this.prepareItems(this.searchResults.results));
        }
    }

    moreExists() {
        return this.searchResults.next;
    }

    async cloneItem(storeItem) {
        // use invoke to handle exceptions
        await editor.invoke('store:clone:sketchfab', storeItem.id, filenamify(storeItem.name), storeItem.license, config.project.id);
    }

    buildSorting(sortingDropdown, sortCallback) {
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Created', 'publishedAt');
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Views', 'viewCount', true);
        this.buildSortingMenuItem(sortingDropdown, 'Sort By Likes', 'likeCount');
        this.sortPolicy = 'viewCount';
        this.sortCallback = sortCallback;
    }

    // Calculate the thumbnail image with the closest dimensions to the specified width and height
    _closestThumbnailImage(images, width, height) {
        // Calculate the difference between each thumbnail's dimensions and 480p
        let closestThumbnail = null;
        let closestDifference = Infinity;

        for (const thumbnail of images) {
            const difference = Math.abs(thumbnail.width - width) + Math.abs(thumbnail.height - height);
            if (difference < closestDifference) {
                closestThumbnail = thumbnail;
                closestDifference = difference;
            }
        }
        return closestThumbnail;
    }

    // prepare sketchfab assets for the items details view
    // extract glb data from the sketchfab item
    _prepareAssets(item) {
        if (item.archives && item.archives.glb) {
            return [{
                name: 'model.glb',
                size: bytesToHuman(item.archives.glb.size),
                type: 'model'
            }];
        }
    }

    // prepare sketchfab item for the items details view
    _prepareItem(item, assets) {

        let thumbnail = EMPTY_THUMBNAIL_IMAGE_LARGE;

        // select the thumbnail image, with resolution closest to 1920x1080
        if (item.thumbnails.images.length > 0) {
            thumbnail = this._closestThumbnailImage(item.thumbnails.images, 1920, 1080).url;
        }

        const description = md.render(item.description);

        const tags = [];
        for (const tag of item.tags) {
            tags.push({ name: tag.name, slug: tag.slug });
        }

        return {
            id: item.uid,
            name: item.name,
            description: description,
            thumbnail: thumbnail,
            views: item.viewCount,
            vertexCount: item.vertexCount,
            textureCount: item.textureCount,
            animationCount: item.animationCount,
            downloads: item.downloadCount,
            likes: item.likeCount,
            modified: item.updatedAt,
            store: 'sketchfab',
            viewerUrl: item.viewerUrl,
            assets: assets,
            tags: tags,
            license: {
                id: item.license.slug,
                author: item.user.displayName,
                authorUrl: item.user.profileUrl
            }
        };
    }

    // prepare sketchfab item for the list view
    prepareItems(items) {
        const newItems = [];

        if (!items) {
            return newItems;
        }

        const self = this;
        const load = async function (item) {
            const url = `https://api.sketchfab.com/v3/models/${item.id}`;
            const response = await fetch(url);
            return self._prepareItem(await response.json(), item.assets);
        };

        for (const item of items) {

            // select the thumbnail image, with resolution closest to 480x320
            const thumb = this._closestThumbnailImage(item.thumbnails.images, 480, 320);

            const newItem = {
                id: item.uid,
                name: item.name,
                description: item.description,
                pictures: [thumb.url],
                views: item.viewCount,
                likes: item.likeCount,
                size: item.archives?.glb?.size || 0,
                created: item.createdAt,
                license: item.license || '',
                store: 'sketchfab',
                assets: this._prepareAssets(item),
                load: load,
                enabled: true
            };
            newItems.push(newItem);
        }
        return newItems;
    }
}

export { SketchFabStore };
