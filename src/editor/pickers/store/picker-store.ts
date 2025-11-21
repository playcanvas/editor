import { Overlay, Label, Button, Container, BooleanInput, Panel, Progress, TextInput } from '@playcanvas/pcui';

import { bytesToHuman } from '../../../common/utils';
import { AssetsStore } from '../../store/assetsStore';
import { MyAssetsStore } from '../../store/myAssetsStore';
import { SketchFabStore } from '../../store/sketchFabStore';

editor.once('load', () => {

    // global variables
    let selectedFilter;
    let selectedStoreFilter;
    let sortDescending = true;
    let searchBar = null;
    let sortingDropdown = null;
    let sortButton = null;
    let loadMoreButton = null;
    let importStoreItemsButton = null;
    let events = [];
    let filtersToggle = null;
    let leftPanel = null;

    let licenses = null;

    // store object (AssetsStore, MyAssetsStore, SketchfabStore)
    let store = new AssetsStore();

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
    const isSketchfabStore = () => {
        return selectedStoreFilter && selectedStoreFilter.text === 'SKETCHFAB';
    };

    const isMyAssetsStore = () => {
        return selectedStoreFilter && selectedStoreFilter.text === 'MY ASSETS';
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
        sortDescending = booleanInput.value;

        booleanInput.on('click', () => {
            booleanInput.value = !booleanInput.value;
        });

        descendingItem.on('click', () => {
            booleanInput.value = !booleanInput.value;  // update checkbox
            sortDescending = booleanInput.value;
            sortStoreItems(store.sortPolicy);
            sortButton.icon = sortDescending ? 'E437' : 'E438';
        });

        store.buildSorting(sortingDropdown, onSort);
    };

    let searchTimer;

    const buildSearchUI = (overlay) => {

        searchBar = new TextInput({
            placeholder: 'Search',
            class: 'search-store',
            keyChange: true
        });
        controlsContainer.append(searchBar);

        searchBar.dom.addEventListener('input', () => {
            clearTimeout(searchTimer); // Clear previous timer

            // search with throttling
            searchTimer = setTimeout(() => {
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

        overlay.append(sortingDropdown);

        sortButton.on('click', () => {
            sortingDropdown.hidden = !sortingDropdown.hidden;

            sortButton.class.toggle('closed');
            sortButton.class.toggle('open');

            // position dropdown menu
            const parent = overlay.domContent.getBoundingClientRect();
            const rect = sortButton.element.getBoundingClientRect();
            const sortingDropdownRect = sortingDropdown.dom.getBoundingClientRect();
            sortingDropdown.dom.style.left = `${rect.right - sortingDropdownRect.width - parent.left}px`;
            sortingDropdown.dom.style.top = `${rect.bottom + 3 - parent.top}px`;
        });
    };

    const onSort = async (policy = 'created') => {
        sortingDropdown.hidden = true;
        await loadStore();
    };

    const buildFiltersUI = (leftPanel) => {

        if (filtersToggle) {
            leftPanel.remove(filtersToggle);
        }

        // storeItems toggle
        filtersToggle = new Panel({
            class: 'storeitems-toggle',
            headerText: 'FILTERS'
        });
        leftPanel.append(filtersToggle);

        // filter list
        let filters = [];

        if (isSketchfabStore()) {
            filters = [
                { name: '3D', icon: 'E189' }
            ];
        } else if (isMyAssetsStore()) {
            filters = [
                { name: 'ALL', icon: 'E244' }
            ];
        } else {
            filters = [
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
        setSelectedFilter(filters[0].button, false);
    };


    const buildStoreFiltersUI = (leftPanel) => {

        // storeItems toggle
        const filtersStores = new Panel({
            class: 'storeitems-toggle',
            headerText: 'STORES'
        });
        leftPanel.append(filtersStores);

        // filter list
        const filters = [
            { name: 'PLAYCANVAS', icon: 'E268' },
            { name: 'SKETCHFAB', icon: 'E188' },
            { name: 'MY ASSETS', icon: 'E439' }
        ];

        for (const filter of filters) {
            const filterButton = new Button({
                class: 'filter-button',
                icon: filter.icon,
                text: filter.name
            });
            filtersStores.append(filterButton);
            filterButton.on('click', () => {
                setSelectedStore(filterButton);
            });
            filter.button = filterButton;
        }
        setSelectedStore(filters[0].button, false);
    };


    // builds each of the item CMS UI components
    const buildStoreUI = (root, item) => {
        const gridItem = new Container({
            class: 'grid-item'
        });
        gridItem.hidden = true;

        const thumb = new Image();
        thumb.style.width = '100%';
        thumb.style.height = isMyAssetsStore() ? '200px' : 'auto';
        thumb.style.display = 'block';
        thumb.style.objectFit = 'cover';
        thumb.style['max-height'] = isMyAssetsStore() ? '200px' : '100%';

        root.append(gridItem);

        gridItem.dom.loading = 'lazy';  // lazy loading of images
        thumb.src = item.pictures[0];

        thumb.addEventListener('load', () => {
            gridItem.on('click', (evt) => {
                // editor.call('picker:store:cms:close');
                sortingDropdown.hidden = true;
                editor.call('picker:storeitem:open', panel, 'storeitem', item);
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

            if (item.views !== undefined) {
                const viewsLabel = new Label({ class: 'text-item-views', text: `${item.views}` });  // views
                statsContainer.append(viewsLabel);
            }

            // likes
            if (item.likes !== undefined) {
                const likesLabel = new Label({ class: 'text-item-likes', text: `${item.likes}` });
                statsContainer.append(likesLabel);
            }

            if (item.modified !== undefined) {
                const date = new Date(item.modified);
                const modifiedLabel = new Label({ class: 'text-item-modified', text: `${date.toLocaleDateString()}` });
                statsContainer.append(modifiedLabel);
            }

            const sizeLabel = new Label({ class: 'text-item-size', text: bytesToHuman(item.size) });  // size
            statsContainer.append(sizeLabel);
        });

        gridItem.append(thumb);
    };

    // updates the current filter UI and triggers reloading
    const setSelectedFilter = (filter, refresh = true) => {

        sortingDropdown.hidden = true;

        if (filter === selectedFilter) {
            return;
        }

        if (selectedFilter) {
            selectedFilter.class.toggle('selected');
        }
        selectedFilter = filter;
        selectedFilter.class.toggle('selected');

        // reset search bar after switching filters
        searchBar.value = '';

        if (refresh) {
            // reload storeItems
            loadStore();
        }
    };


    // updates the current store UI and triggers reloading
    const setSelectedStore = (filter, refresh = true) => {

        sortingDropdown.hidden = true;

        if (filter === selectedStoreFilter) {
            return;
        }

        const storeName = store?.name || '';

        if (selectedStoreFilter) {
            selectedStoreFilter.class.toggle('selected');
        }
        selectedStoreFilter = filter;
        selectedStoreFilter.class.toggle('selected');

        if (isSketchfabStore()) {
            store = new SketchFabStore();
            // @ts-ignore
            metrics.increment({ metricsName: 'store.opened.sketchfab' });
        } else if (isMyAssetsStore()) {
            store = new MyAssetsStore();
            // @ts-ignore
            metrics.increment({ metricsName: 'store.opened.myassets' });
        } else {
            store = new AssetsStore();
        }

        // reset search bar after switching filters
        searchBar.value = '';

        // build sorting dropdown (different depending on store)
        if (storeName !== store.name) {
            buildSortingDropdown(sortButton);
        }

        if (refresh) {
            // reload storeItems
            buildFiltersUI(leftPanel);
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
        if (editor.call('users:isSuperUser')) {
            // file picker
            const filePicker = document.createElement('input');
            filePicker.id = 'file-picker';
            filePicker.type = 'file';
            filePicker.accept = 'application/zip';

            filePicker.addEventListener('change', () => {
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

        if (files.length === 0) {
            return;
        }

        toggleProgress(true, 0, 'Uploading... Please stand by');

        // Convert file to form data
        const form = new FormData();
        form.append('file', files[0]);

        try {
            const response = await editor.call('store:uploadStoreItems', form, (progress) => {
                // Progress handler function
                progressBar.value = progress * 100;

                if (progress === 1) {
                    progressLabel.text = 'Upload Complete! Importing... (Please don\'t close this window)';
                }
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
            editor.call('picker:project:buildAlert', rightPanel, 'There was an error while importing');
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
    btnClose.on('click', () => {
        overlay.hidden = true;
    });
    headerUtils.append(btnClose);

    // left panel
    leftPanel = new Container({
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

    buildSearchUI(overlay);
    buildStoreFiltersUI(leftPanel);
    buildFiltersUI(leftPanel);
    buildSortingDropdown(sortButton);

    // right panel storeItems
    const itemsContainer = new Container({
        class: 'grid-container'
    });
    rightPanel.append(itemsContainer);

    // controllers

    // displays or hides the loading bar in the CMS main panel based on parameter
    const toggleProgress = (toggle, progress = 100, label = '') => {
        progressBar.value = progress;
        progressBar.hidden = !toggle;
        if (label !== '') {
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

        // shows progress with a delay to avoid flickering
        const timeoutId = setTimeout(() => {
            toggleProgress(true);
        }, 500);

        let tags = null;
        let searchString = searchBar.value.trim();
        if (searchString.length > 1 && searchString[0] === '#') {
            if (isSketchfabStore() || isMyAssetsStore()) {
                searchString = searchString.toLowerCase();
            }
            tags = [searchString.substring(1)];
            searchString = '';
        }
        let newItems;
        try {
            newItems = await store.load(selectedFilter, searchString, tags, sortDescending);

        } catch (err) {
            console.error('failed to retrieve a list of store items', err);
        } finally {
            if (!newItems.length || !itemsAreEqual(store.items, newItems)) {
                itemsContainer.clear();
                store.setItems(newItems);
                await refreshStore();
            }
            toggleProgress(false);
            clearTimeout(timeoutId);
            createFilePicker();

            removeLoadMoreButton();
            if (store.moreExists()) {
                setupLoadMoreButton();
            }
        }
    };

    // reloads the storeItems that are currently in view in the CMS main panel
    const refreshStore = (startItem = 0) => {
        itemsContainer.hidden = store.items.length === 0;
        for (let i = startItem; i < store.items.length; i++) {
            if (store.items[i].enabled) {
                buildStoreUI(itemsContainer, store.items[i]);
            }
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
                if (isSketchfabStore() || isMyAssetsStore()) {
                    searchString = searchString.toLowerCase();
                }
                tags = [searchString.substring(1)];
                searchString = '';
            }

            await store.loadMore(selectedFilter.text, searchString, tags, sortDescending);

            await refreshStore(store.startItem);
            removeLoadMoreButton();
            if (store.moreExists()) {
                setupLoadMoreButton();
            }

        } catch (err) {
            console.error('failed to retrieve a list of store items', err);
        } finally {
            clearTimeout(timeoutId);
            toggleProgress(false);
        }
    };

    const sortStoreItems = async (policy = 'created') => {
        store.sortPolicy = policy;
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
    const onKeyDown = function (e) {
        if (e.target && /input|textarea/i.test(e.target.tagName)) {
            return;
        }

        if (e.key === 'Escape' && overlay.clickable && !editor.call('picker:storeitem:opened')) {
            overlay.hidden = true;
        }
    };

    // load and show data
    overlay.on('show', () => {
        window.addEventListener('keydown', onKeyDown);

        // determine if a scene has been loaded
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
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

        editor.call('picker:storeitem:close');
    });

    // prevent viewport hovering when picker is shown
    editor.on('viewport:hover', (state) => {
        if (state && !overlay.hidden) {
            setTimeout(() => {
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

    // hook to retrieve the current store
    editor.method('picker:store:getStore', () => {
        return store;
    });
});
