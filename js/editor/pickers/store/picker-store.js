import { Overlay, Label, Button, Container, BooleanInput, RadioButton, Panel, Progress, TextInput } from '@playcanvas/pcui';
import { sizeToString } from '../../../common/filesystem-utils';
import Markdown from 'markdown-it';
const md = Markdown({});

editor.once('load', () => {

    // global variables
    let selectedFilter;
    let selectedSortRadioButton;
    let sortDescending = true;
    let sortPolicy = 'created';
    let searchBar = null;
    let featuredFilter = null;
    let sortingDropdown = null;
    let sortButton = null;
    let loadMoreButton = null;
    let importStoreItemsButton = null;
    let events = [];

    let storeItems = [];
    let storeItemsCount = 0;
    let startItem = 0;

    let licenses = null;

    const EMPTY_THUMBNAIL_IMAGE = 'https://playcanvas.com/static-assets/images/store-default-thumbnail-480x320.jpg';
    const EMPTY_THUMBNAIL_IMAGE_LARGE = 'https://playcanvas.com/static-assets/images/store-default-thumbnail.jpg';
    const STORE_ITEM_PAGE_SIZE = 24;

    // Create a new Intersection Observer to track visibility of Load More button
    const intersectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Unobserve the element to stop observing visibility changes
                observer.unobserve(entry.target);

                // load new page of content
                loadMoreStore();
            }
        });
    });

    // UI

    // build sorting menu item
    const buildSortingMenuItem = (root, label, sortPolicy, selected) => {
        const sortingMenuItem = new Container({ class: 'sorting-menu-item' });
        root.append(sortingMenuItem);

        const booleanInput = new RadioButton({ class: 'radio' });

        const labelElement = new Label({ text: label });
        sortingMenuItem.append(booleanInput);
        sortingMenuItem.append(labelElement);

        if (selected) {
            booleanInput.value = true;
            selectedSortRadioButton = booleanInput;
        }

        sortingMenuItem.on('click', () => {
            selectedSortRadioButton.value = false;
            booleanInput.value = true;
            selectedSortRadioButton = booleanInput;
            sortStoreItems(sortPolicy);
        });
    };

    const isSketchfabStore = () => {
        return selectedFilter && selectedFilter.text === 'SKETCHFAB';
    };

    // builds sorting dropdown with different sorting algorithms
    const buildSortingDropdown = (sortButton) => {

        sortingDropdown.clear();

        // descending checkbox
        const descendingItem = new Container({ class: 'sorting-menu-item' });
        sortingDropdown.append(descendingItem);
        const booleanInput = new BooleanInput({ class: 'checkbox' });
        const labelElement = new Label({ text: 'Descending' });
        descendingItem.append(booleanInput);
        descendingItem.append(labelElement);
        booleanInput.value = true; // by default we sort in descending order

        booleanInput.on('click', () => {
            booleanInput.value = !booleanInput.value;
        });

        descendingItem.on('click', () => {
            booleanInput.value = !booleanInput.value;  // update checkbox
            sortDescending = booleanInput.value;
            sortStoreItems(sortPolicy);
            sortButton.icon = sortDescending ? 'E437' : 'E438';
        });

        if (isSketchfabStore()) {
            buildSortingMenuItem(sortingDropdown, 'Sort By Created', 'publishedAt');
            buildSortingMenuItem(sortingDropdown, 'Sort By Views', 'viewCount', true);
            buildSortingMenuItem(sortingDropdown, 'Sort By Likes', 'likeCount');
            sortPolicy = 'viewCount';

        } else {
            buildSortingMenuItem(sortingDropdown, 'Sort By Name', 'name');
            buildSortingMenuItem(sortingDropdown, 'Sort By Created', 'created', true);
            buildSortingMenuItem(sortingDropdown, 'Sort By Size', 'size');
            buildSortingMenuItem(sortingDropdown, 'Sort By Downloads', 'downloads');
            buildSortingMenuItem(sortingDropdown, 'Sort By Views', 'views');
            sortPolicy = 'created';
        }

    };

    let searchTimer;

    const buildSearchUI = (rightPanel) => {

        searchBar = new TextInput({
            placeholder: 'Search',
            class: 'search-store',
            keyChange: true
        });
        controlsContainer.append(searchBar);

        searchBar.dom.addEventListener('input', () => {
            clearTimeout(searchTimer); // Clear previous timer

            // search with throttling
            searchTimer = setTimeout(function () {
                searchBar.placeholder = searchBar.value !== '' ? '' : 'Search';
                loadStore();
            }, 500);
        });

        sortButton = new Button({
            icon: 'E437',
            class: ['sort-btn', 'closed']
        });
        controlsContainer.append(sortButton);

        sortingDropdown = new Container({
            flex: true,
            class: 'sorting-container',
            hidden: true
        });

        editor.call('layout.root').append(sortingDropdown);

        sortButton.on('click', () => {
            sortingDropdown.hidden = !sortingDropdown.hidden;

            sortButton.class.toggle('closed');
            sortButton.class.toggle('open');

            // position dropdown menu
            const rect = sortButton.element.getBoundingClientRect();
            const sortingDropdownRect = sortingDropdown.dom.getBoundingClientRect();
            sortingDropdown.dom.style.left = `${rect.right - sortingDropdownRect.width}px`;
            sortingDropdown.dom.style.top = `${rect.bottom + 3}px`;
        });
    };

    const buildFiltersUI = (leftPanel) => {
        // storeItems toggle
        const filtersToggle = new Panel({
            class: 'storeitems-toggle',
            collapsible: true,
            headerText: 'FILTERS'
        });
        leftPanel.append(filtersToggle);

        // filter list
        const filters = [
            { name: 'ALL', icon: 'E244' },
            // { name: 'FEATURED', icon: 'E244' },
            // { name: '2D', icon: 'E201' },
            { name: '3D', icon: 'E189' },
            { name: 'FONT', icon: 'E227' },
            // { name: 'MATERIAL', icon: 'E425' },
            { name: 'SCRIPT', icon: 'E392' },
            // { name: 'SHADER', icon: 'E219' },
            { name: 'SKYBOX', icon: 'E217' },
            // { name: 'SOUND', icon: 'E197' },
            { name: 'TEMPLATE', icon: 'E190' },
            { name: 'TEXTURE', icon: 'E201' }
        ];

        // add sketchfab button for super users
        if (editor.call('users:hasFlag', 'hasSketchfabAccess')) {
            filters.push({ name: 'SKETCHFAB', icon: 'E188' });
        }

        for (const filter of filters) {
            const filterButton = new Button({
                class: 'filter-button',
                icon: filter.icon,
                text: filter.name
            });
            filtersToggle.append(filterButton);
            filterButton.on('click', () => {
                setSelectedFilter(filterButton);
            });
            filter.button = filterButton;
        }
        featuredFilter = filters[0].button;
        setSelectedFilter(featuredFilter, false);
    };

    // builds each of the item CMS UI components
    const buildStoreUI = (root, item) => {
        const gridItem = new Container({
            class: 'grid-item'
        });
        gridItem.hidden = true;

        const thumb = new Image();
        thumb.style.width = '100%';
        thumb.style.height = 'auto';
        thumb.style.display = 'block';
        thumb.style.objectFit = 'cover';
        thumb.style['max-height'] = '100%';

        root.append(gridItem);

        gridItem.dom.loading = 'lazy';  // lazy loading of images
        thumb.src = item.pictures[0];

        thumb.addEventListener('load', () => {
            gridItem.on('click', (evt) => {
                // editor.call('picker:store:cms:close');
                editor.call('picker:storeitem', 'storeitem', item);
            });

            // name
            const nameLabel = new Label({
                class: 'text-item-name',
                text: item.name
            });
            gridItem.append(nameLabel);

            // stats container
            const statsContainer = new Container({
                class: 'text-container'
            });
            gridItem.append(statsContainer);

            // downloads
            if (item.downloads !== undefined) {
                const downloadsLabel = new Label({ class: 'text-item-downloads', text: `${item.downloads}` });
                statsContainer.append(downloadsLabel);
            }

            const viewsLabel = new Label({ class: 'text-item-views', text: `${item.views}` });  // views
            statsContainer.append(viewsLabel);

            // likes
            if (item.likes !== undefined) {
                const likesLabel = new Label({ class: 'text-item-likes', text: `${item.likes}` });
                statsContainer.append(likesLabel);
            }

            const sizeLabel = new Label({ class: 'text-item-size', text: sizeToString(item.size) });  // size
            statsContainer.append(sizeLabel);
        });

        gridItem.append(thumb);
    };

    // updates the current filter UI and triggers reloading
    const setSelectedFilter = (filter, refresh = true) => {

        if (filter === selectedFilter) {
            return;
        }
        const prevFilterSketchfab = isSketchfabStore();

        if (selectedFilter) {
            selectedFilter.class.toggle('selected');
        }
        selectedFilter = filter;
        selectedFilter.class.toggle('selected');

        const newFilterSketchfab = isSketchfabStore();

        // reset search bar after switching filters
        searchBar.value = '';

        // build sorting dropdown (different depending on store)
        if (prevFilterSketchfab !== newFilterSketchfab) {
            buildSortingDropdown(sortButton);
        }

        if (refresh) {
            // reload storeItems
            loadStore();
        }
    };

    // compare to arrays of storeItems
    const itemsAreEqual = (arr1, arr2) => {
        if (arr1.length !== arr2.length) {
            return false;
        }

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].id !== arr2[i].id) {
                return false;
            }
        }
        return true;
    };

    const createFilePicker = () => {

        if (importStoreItemsButton) {
            headerUtils.remove(importStoreItemsButton);
        }

        // add import button for super users
        if (editor.call("users:isSuperUser")) {
            // file picker
            const filePicker = document.createElement('input');
            filePicker.id = "file-picker";
            filePicker.type = "file";
            filePicker.accept = "application/zip";

            filePicker.addEventListener("change", () => {
                uploadStoreItems(filePicker.files);
            });

            // import store items button
            importStoreItemsButton = new Button({
                class: 'import-button',
                icon: 'E222'
            });
            headerUtils.appendBefore(importStoreItemsButton, btnClose);

            importStoreItemsButton.on('click', () => {
                filePicker.value = '';
                filePicker.click();
            });
        }
    };

    // handles the flow for project importing including error and loading states
    const uploadStoreItems = async (files) => {

        if (files.length === 0)
            return;

        toggleProgress(true, 0, 'Uploading... Please stand by');

        // Convert file to form data
        var form = new FormData();
        form.append("file", files[0]);

        try {
            const response = await editor.call('store:uploadStoreItems', form, (progress) => {
                // Progress handler function
                progressBar.value = progress * 100;

                if (progress === 1) progressLabel.text = "Upload Complete! Importing... (Please don't close this window)";
            });
            const jobId = response.jobId;

            var evt = editor.on('messenger:job.update', (msg) => {
                if (msg.job.id === jobId) {
                    evt.unbind();

                    if (msg.error)  {
                        editor.call('picker:project:buildAlert', rightPanel, `error during import: ${msg.error}`);
                    }
                    toggleProgress(false);
                    loadStore();
                }
            });
            events.push(evt);
        } catch (err) {
            editor.call('picker:project:buildAlert', rightPanel, "There was an error while importing");
            toggleProgress(false);
        }
    };

    // overlay
    const root = editor.call('layout.root');
    const overlay = new Overlay({
        clickable: true,
        class: 'picker-store-cms',
        hidden: true
    });
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'PLAYCANVAS ASSET STORE',
        class: 'cms-root-panel'
    });
    overlay.append(panel);

    // header utils container
    const headerUtils = new Container({
        class: 'header-utils'
    });
    panel.header.append(headerUtils);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        overlay.hidden = true;
    });
    headerUtils.append(btnClose);

    // left panel
    const leftPanel = new Container({
        class: 'cms-left-panel'
    });
    panel.append(leftPanel);

    // right panel
    const rightPanel = new Container({
        class: 'cms-right-panel'
    });
    panel.append(rightPanel);

    // progress bar and loading label
    const progressBarContainer = new Container({ class: 'progress-container' });
    const progressBar = new Progress({
        value: 100,
        class: 'progress',
        hidden: true
    });

    const progressLabel = new Label({ text: 'Uploading', hidden: true });
    rightPanel.append(progressBarContainer);
    progressBarContainer.append(progressBar);
    progressBarContainer.append(progressLabel);

    // right panel controls
    const controlsContainer = new Container({
        class: 'list-storeitem-controls'
    });
    rightPanel.append(controlsContainer);

    buildSearchUI(rightPanel);
    buildFiltersUI(leftPanel);

    // right panel storeItems
    const itemsContainer = new Container({
        class: 'grid-container'
    });
    rightPanel.append(itemsContainer);

    // controllers

    // displays or hides the loading bar in the CMS main panel based on parameter
    const toggleProgress = (toggle, progress = 100, label = "") => {
        progressBar.value = progress;
        progressBar.hidden = !toggle;
        if (label !== "") {
            progressLabel.hidden = false;
            progressLabel.text = label;
            progressBarContainer.class.add('progress-container-expand');
        } else {
            progressLabel.hidden = true;
            progressBarContainer.class.remove('progress-container-expand');
        }
    };

    const setupLoadMoreButton = () => {
        // add Load More button if there are more items to load
        loadMoreButton = new Button({
            text: 'Load More',
            class: 'load-more-button'
        });
        rightPanel.append(loadMoreButton);
        intersectionObserver.observe(loadMoreButton.element);
        loadMoreButton.on('click', () => {
            loadMoreStore();
        });
    };

    const closestThumbnailImage = (images, width, height) => {
        // Calculate the difference between each thumbnail's dimensions and 480p
        var closestThumbnail = null;
        var closestDifference = Infinity;

        for (const thumbnail of images) {
            var difference = Math.abs(thumbnail.width - width) + Math.abs(thumbnail.height - height);
            if (difference < closestDifference) {
                closestThumbnail = thumbnail;
                closestDifference = difference;
            }
        }
        return closestThumbnail;
    };

    // prepare sketchfab assets for the items details view
    // extract glb data from the sketchfab item
    const prepareSketchfabAssets = (item) => {
        if (item.archives && item.archives.glb) {
            return [{
                name: 'model.glb',
                size: sizeToString(item.archives.glb.size),
                type: 'model'
            }];
        }
    };

    // prepare playcanvas store assets for the items details view
    // extract glb data from the sketchfab item
    const prepareStoreAssets = (items) => {
        const newItems = [];
        if (!items) {
            return newItems;
        }

        for (const item of items) {
            const newItem = {
                name: item.file ? item.file.filename : item.name,
                size: item.file ? sizeToString(item.file.size) : '0B',
                type: item.type,
                id: item.id
            };
            newItems.push(newItem);
        }
        return newItems;
    };

    // prepare sketchfab item for the items details view
    const prepareSketchfabItem = (item, assets) => {

        let thumbnail = EMPTY_THUMBNAIL_IMAGE_LARGE;

        // select the thumbnail image, with resolution closest to 1920x1080
        if (item.thumbnails.images.length > 0) {
            thumbnail = closestThumbnailImage(item.thumbnails.images, 1920, 1080).url;
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
    };

    // prepare sketchfab item for the list view
    const prepareSketchfabItems = (items) => {
        const newItems = [];

        if (!items) {
            return newItems;
        }

        const load = async function (item) {
            const url = `https://api.sketchfab.com/v3/models/${item.id}`;
            const response = await fetch(url);
            return prepareSketchfabItem(await response.json(), item.assets);
        };

        for (const item of items) {

            // select the thumbnail image, with resolution closest to 480x320
            const thumb = closestThumbnailImage(item.thumbnails.images, 480, 320);

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
                assets: prepareSketchfabAssets(item),
                load: load
            };
            newItems.push(newItem);
        }
        return newItems;
    };

    const isGlbAsset = (asset) => {
        const filename = asset.file ? asset.file.filename : null;
        return filename && String(filename).match(/\.glb$/) !== null;
    };

    const isTextureAsset = (asset) => {
        const type = asset.type;
        return ['texture', 'textureatlas'].includes(type);
    };

    const prepareViewerUrl = (item, assets) => {

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
            if (isGlbAsset(asset) && modelUrls.length === 0) {
                modelUrls.push(encodeUrl(url));
            } else if (isTextureAsset(asset)) {
                textureUrls.push(encodeUrl(url));
            }
        }

        if (modelUrls.length) {
            return `/viewer?load=${modelUrls.join('&load=')}`;
        }

        if (textureUrls.length) {
            return `/texture-tool?load=${textureUrls.join('&load=')}`;
        }
    };

    const loadAssets = async function (id) {
        const url = `${config.url.api}/store/${id}/assets`;
        const response = await fetch(url);
        const results = await response.json();
        return results.result;
    };

    const prepareStoreItem = async (item) => {

        let thumbnail = EMPTY_THUMBNAIL_IMAGE_LARGE;
        if (item.pictures.length) {
            const pictures = `${config.url.images}/${config.aws.s3Prefix}files/pictures/`;
            thumbnail = pictures + item.pictures[0] + "/1280x720.jpg";
        }

        const assets = await loadAssets(item.id);
        let viewerUrl;
        if (assets && assets.length) {
            viewerUrl = prepareViewerUrl(item, assets);
        }
        const processedAssets = prepareStoreAssets(assets);

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
    };


    const prepareStoreItems = (items) => {
        const newItems = [];

        if (!items) {
            return newItems;
        }

        const load = async function (item) {
            const url = `${config.url.api}/store/${item.id}`;
            const response = await fetch(url);
            return prepareStoreItem(await response.json());
        };

        for (const item of items) {
            let url = EMPTY_THUMBNAIL_IMAGE;
            if (item.pictures.length) {
                const pictures = `${config.url.images}/${config.aws.s3Prefix}files/pictures/`;
                url = pictures + item.pictures[0] + "/480x320.jpg";
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
                load: load
            };
            newItems.push(newItem);
        }
        return newItems;
    };

    const removeLoadMoreButton = () => {
        if (loadMoreButton) {
            loadMoreButton.destroy();
            loadMoreButton = null;
        }
    };

    // loads licenses
    const loadLicenses = () => {
        if (licenses) {
            return licenses;
        }
        return editor.call('store:license:list');
    };

    // loads the current store items into the store main panel
    const loadStore = async () => {
        let newItems = [];
        storeItemsCount = 0;
        startItem = 0;

        // shows progress with a delay to avoid flickering
        const timeoutId = setTimeout(() => {
            toggleProgress(true);
        }, 500);

        let searchResults = null;
        let tags = null;
        let searchString = searchBar.value.trim();
        if (searchString.length > 1 && searchString[0] === '#') {
            if (isSketchfabStore()) {
                searchString = searchString.toLowerCase();
            }
            tags = [searchString.substring(1)];
            searchString = '';
        }

        try {

            if (isSketchfabStore()) {
                // sketchfab store - get the list of items
                searchResults = await editor.call('store:sketchfab:list',
                    searchString,
                    0,
                    STORE_ITEM_PAGE_SIZE,
                    tags,
                    sortPolicy,
                    sortDescending);

                newItems = prepareSketchfabItems(searchResults.results);

            } else {
                searchResults = await editor.call('store:list',
                    searchString,
                    0,
                    STORE_ITEM_PAGE_SIZE,
                    selectedFilter.text,
                    tags,
                    sortPolicy,
                    sortDescending);

                // real number of records matching the query
                storeItemsCount = searchResults.pagination?.total || 0;
                newItems = prepareStoreItems(searchResults.result);
            }
        } catch (err) {
            console.error('failed to retrieve a list of store items', err);
        } finally {
            if (newItems && !itemsAreEqual(storeItems, newItems)) {
                itemsContainer.clear();
                storeItems = newItems;
                await refreshStore();
            }
            toggleProgress(false);
            clearTimeout(timeoutId);
            createFilePicker();

            removeLoadMoreButton();
            if (isSketchfabStore()) {
                if (searchResults.next) {
                    setupLoadMoreButton();
                }
            } else {
                if (storeItems.length < storeItemsCount) {
                    setupLoadMoreButton();
                }
            }
        }
    };

    // reloads the storeItems that are currently in view in the CMS main panel
    const refreshStore = (startItem = 0) => {
        itemsContainer.hidden = storeItems.length === 0;
        for (let i = startItem; i < storeItems.length; i++) {
            buildStoreUI(itemsContainer, storeItems[i]);
        }
    };

    // loads the current store items into the store main panel
    const loadMoreStore = async () => {
        // shows progress with a delay to avoid flickering
        const timeoutId = setTimeout(() => {
            toggleProgress(true);
        }, 500);

        try {

            let tags = null;
            let searchString = searchBar.value.trim();
            if (searchString.length > 1 && searchString[0] === '#') {
                if (isSketchfabStore()) {
                    searchString = searchString.toLowerCase();
                }
                tags = [searchString.substring(1)];
                searchString = '';
            }

            if (isSketchfabStore()) {
                // sketchfab store - get the list of items
                const searchResults = await editor.call('store:sketchfab:list',
                    searchString,
                    storeItems.length,
                    STORE_ITEM_PAGE_SIZE,
                    tags,
                    sortPolicy,
                    sortDescending);

                if (searchResults.results) {
                    startItem = storeItems.length;
                    storeItems = storeItems.concat(prepareSketchfabItems(searchResults.results));
                    await refreshStore(startItem);
                    removeLoadMoreButton();
                    if (searchResults.next) {
                        setupLoadMoreButton();
                    }
                }
            } else {
                const values = await editor.call('store:list',
                    searchString,
                    storeItems.length,
                    STORE_ITEM_PAGE_SIZE,
                    selectedFilter.text,
                    tags,
                    sortPolicy,
                    sortDescending);

                // real number of records matching the query
                storeItemsCount = values.pagination.total;
                if (values.result) {
                    startItem = storeItems.length;
                    storeItems = storeItems.concat(prepareStoreItems(values.result));
                    await refreshStore(startItem);
                    removeLoadMoreButton();
                    if (storeItems.length < storeItemsCount) {
                        setupLoadMoreButton();
                    }
                }
            }

        } catch (err) {
            console.error('failed to retrieve a list of store items', err);
        } finally {
            clearTimeout(timeoutId);
            toggleProgress(false);
        }
    };

    // sort apps by primary first and then created date
    const sortStoreItems = async (policy = 'created') => {
        sortPolicy = policy;
        sortingDropdown.hidden = true;
        await loadStore();
    };

    const destroyEvents = () => {
        if (events) {
            events.forEach(e => e.unbind());
            events = [];
        }
    };


    // LOCAL UTILS

    // EVENTS

    // ESC key should close popup
    var onKeyDown = function (e) {
        if (e.target && /(input)|(textarea)/i.test(e.target.tagName))
            return;

        if (e.key === 'Escape' && overlay.clickable && !editor.call('picker:storeitem:opened')) {
            overlay.hidden = true;
        }
    };

    // load and show data
    overlay.on('show', () => {
        window.addEventListener('keydown', onKeyDown);

        // determine if a scene has been loaded
        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', false);
    });

    // clean up
    overlay.on('hide', () => {
        destroyEvents();

        // reset sorting dropdown state
        sortingDropdown.hidden = true;
        sortButton.class.remove('open');
        sortButton.class.add('closed');

        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // prevent viewport hovering when picker is shown
    editor.on('viewport:hover', function (state) {
        if (state && !overlay.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // hook to close the CMS modal
    editor.method('picker:store:cms:close', () => {
        overlay.hidden = true;
    });

    // method to display panel
    editor.method('picker:store:cms', async () => {

        licenses = await loadLicenses();

        loadStore();
        overlay.hidden = false;
    });

    // method to get licenses
    editor.method('picker:store:licenses', async () => {
        licenses = await loadLicenses();
        return licenses;
    });

    // method to search sketchfab store with tags
    editor.method('picker:store:search:tags', (tags, tagNames) => {
        searchBar.value = `#${tagNames && tagNames.length ? tagNames[0] : ''}`;
        searchBar.placeholder = searchBar.value !== '' ? '' : 'Search';
        loadStore();
    });

    // hook to retrieve main CMS panel (used to display errors from other files)
    editor.method('picker:store:cms:getPanel', () => {
        return panel;
    });
});
