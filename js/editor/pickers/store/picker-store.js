import { Overlay, Label, Button, Container, BooleanInput, RadioButton, Panel, Progress, TextInput } from '@playcanvas/pcui';
import { sizeToString } from '../../../common/filesystem-utils';

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
    const EMPTY_THUMBNAIL_IMAGE = 'https://playcanvas.com/static-assets/images/store-default-thumbnail-480x320.jpg';
    const STORE_ITEM_PAGE_SIZE = 40;

    // UI

    const buildSortingMenuItem = (root, type, label) => {
        const sortingMenuItem = new Container({ class: 'sorting-menu-item' });
        root.append(sortingMenuItem);

        let booleanInput;
        if (type === 'checkbox') booleanInput = new BooleanInput({ class: type });
        else booleanInput = new RadioButton({ class: type });

        const labelElement = new Label({ text: label });
        sortingMenuItem.append(booleanInput);
        sortingMenuItem.append(labelElement);

        return [sortingMenuItem, booleanInput];
    };

    const updateRadioButtons = (newSelectedRadio) => {
        selectedSortRadioButton.value = false;
        newSelectedRadio.value = true;
        selectedSortRadioButton = newSelectedRadio;
    };

    // builds sorting dropdown with different sorting algorithms
    const buildSortingDropdown = (sortButton) => {
        const sortingContainer = new Container({
            flex: true,
            class: 'sorting-container',
            hidden: true
        });
        editor.call('layout.root').append(sortingContainer);

        // descending checkbox
        const [descendingItem, descendingCheckbox] = buildSortingMenuItem(sortingContainer, 'checkbox', 'Descending');

        // by default we sort in descending order
        descendingCheckbox.value = true;

        const [sortByName, nameRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Name');
        const [sortByCreated, createdRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Created');
        const [sortBySize, sizeRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Size');
        const [sortByDownloads, downloadsRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Downloads');
        const [sortByViews, viewsRadio] = buildSortingMenuItem(sortingContainer, 'radio', 'Sort By Views');

        selectedSortRadioButton = createdRadio;
        selectedSortRadioButton.value = true;

        descendingCheckbox.on('click', () => {
            descendingCheckbox.value = !descendingCheckbox.value;
        });

        descendingItem.on('click', () => {
            descendingCheckbox.value = !descendingCheckbox.value;  // update checkbox
            sortDescending = descendingCheckbox.value;
            sortStoreItems(sortPolicy);
            sortButton.icon = sortDescending ? 'E437' : 'E438';
        });

        descendingItem.dom.id = 'checkbox-menu-item';

        sortByName.on('click', () => {
            updateRadioButtons(nameRadio);
            sortStoreItems('name');
        });

        sortByCreated.on('click', () => {
            updateRadioButtons(createdRadio);
            sortStoreItems('created');
        });

        sortBySize.on('click', () => {
            updateRadioButtons(sizeRadio);
            sortStoreItems('size');
        });

        sortByDownloads.on('click', () => {
            updateRadioButtons(downloadsRadio);
            sortStoreItems('downloads');
        });

        sortByViews.on('click', () => {
            updateRadioButtons(viewsRadio);
            sortStoreItems('views');
        });
        return sortingContainer;
    };

    const buildSortingUI = (rightPanel) => {

        searchBar = new TextInput({
            placeholder: 'Search',
            class: 'search-store',
            keyChange: true
        });
        controlsContainer.append(searchBar);

        searchBar.on('change', () => {
            searchBar.placeholder = searchBar.value !== '' ? '' : 'Search';
            loadStore();
        });

        sortButton = new Button({
            icon: 'E437',
            class: ['sort-btn', 'closed']
        });
        controlsContainer.append(sortButton);

        sortingDropdown = buildSortingDropdown(sortButton);

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

        for (const filter of filters) {
            const filterButton = new Button({
                class: 'filter-button',
                icon: filter.icon,
                text: filter.name
            });
            filtersToggle.append(filterButton);
            filterButton.on('click', () => { setSelectedFilter(filterButton); });
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
        if (item.pictures.length) {
            const pictures = `${config.url.images}/${config.aws.s3Prefix}files/pictures/`;
            thumb.src = pictures + item.pictures[0] + "/480x320.jpg";
        } else {
            thumb.src = EMPTY_THUMBNAIL_IMAGE;
        }

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
            const downloadsLabel = new Label({ class: 'text-item-downloads', text: `${item.downloads}` });
            const viewsLabel = new Label({ class: 'text-item-views', text: `${item.views}` });  // views
            statsContainer.append(downloadsLabel);
            statsContainer.append(viewsLabel);
            const sizeLabel = new Label({ class: 'text-item-size', text: sizeToString(item.size) });  // size
            statsContainer.append(sizeLabel);
        });

        gridItem.append(thumb);
    };

    // updates the current filter UI and triggers reloading
    const setSelectedFilter = (filter, refresh = true) => {
        if (selectedFilter) {
            selectedFilter.class.toggle('selected');
        }
        selectedFilter = filter;
        selectedFilter.class.toggle('selected');

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
        clickable: false,
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

    buildFiltersUI(leftPanel);

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

    buildSortingUI(rightPanel);

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
        if (loadMoreButton) {
            loadMoreButton.destroy();
            loadMoreButton = null;
        }

        // add Load More button if there are more items to load
        if (storeItems.length < storeItemsCount) {
            loadMoreButton = new Button({
                text: 'Load More',
                class: 'load-more-button'
            });
            rightPanel.append(loadMoreButton);
            loadMoreButton.on('click', () => {
                loadMoreStore();
            });
        }
    };

    // loads the current store items into the store main panel
    const loadStore = async () => {
        // shows progress with a delay to avoid flickering
        const timeoutId = setTimeout(() => {
            toggleProgress(true);
        }, 500);

        const values = await editor.call('store:list',
            searchBar.value,
            0,
            STORE_ITEM_PAGE_SIZE,
            selectedFilter.text,
            sortPolicy,
            sortDescending);

        // real number of records matching the query
        storeItemsCount = values.pagination.total;
        if (values.result && !itemsAreEqual(storeItems, values.result)) {
            itemsContainer.clear();
            storeItems = values.result;
            await refreshStore();
        }

        createFilePicker();

        setupLoadMoreButton();
        clearTimeout(timeoutId);
        toggleProgress(false);
    };

    // loads the current store items into the store main panel
    const loadMoreStore = async () => {
        // shows progress with a delay to avoid flickering
        const timeoutId = setTimeout(() => {
            toggleProgress(true);
        }, 500);

        const values = await editor.call('store:list',
            searchBar.value,
            storeItems.length,
            STORE_ITEM_PAGE_SIZE,
            selectedFilter.text,
            sortPolicy,
            sortDescending);

        // real number of records matching the query
        storeItemsCount = values.pagination.total;

        if (values.result) {
            const startItem = storeItems.length;
            storeItems = storeItems.concat(values.result);
            await refreshStore(startItem);
        }

        setupLoadMoreButton();
        clearTimeout(timeoutId);
        toggleProgress(false);
    };

    // reloads the storeItems that are currently in view in the CMS main panel
    const refreshStore = (startItem = 0) => {
        itemsContainer.hidden = storeItems.length === 0;
        for (let i = startItem; i < storeItems.length; i++) {
            buildStoreUI(itemsContainer, storeItems[i]);
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

    // load and show data
    overlay.on('show', () => {
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
    editor.method('picker:store:cms', () => {
        loadStore();
        overlay.hidden = false;
    });

    // hook to retrieve main CMS panel (used to display errors from other files)
    editor.method('picker:store:cms:getPanel', () => {
        return panel;
    });
});
