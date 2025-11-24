import { Label, Container, RadioButton } from '@playcanvas/pcui';

import { bytesToHuman } from '@/common/utils';

const EMPTY_THUMBNAIL_IMAGE = 'https://playcanvas.com/static-assets/images/store-default-thumbnail-480x320.jpg';
const STORE_ITEM_PAGE_SIZE = 24;
const EMPTY_THUMBNAIL_IMAGE_LARGE = 'https://playcanvas.com/static-assets/images/store-default-thumbnail.jpg';

class BaseStore {
    constructor(args) {
        this.searchResults = [];
        this.items = [];
        this.startItem = 0;
        this.selectedSortRadioButton = null;
        this.sortPolicy = 'created';
        this.sortCallback = null;
    }

    setItems(items) {
        this.items = items;
    }

    // prepare playcanvas store assets for the items details view
    // extract glb data from the sketchfab item
    prepareStoreAssets(items) {
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

    refreshStore(startItem) {
        // refresh the store
    }

    // build sorting menu item
    buildSortingMenuItem(root, label, sortPolicy, selected) {
        const sortingMenuItem = new Container({ class: 'sorting-menu-item' });
        root.append(sortingMenuItem);

        const booleanInput = new RadioButton({ class: 'radio' });

        const labelElement = new Label({ text: label });
        sortingMenuItem.append(booleanInput);
        sortingMenuItem.append(labelElement);

        if (selected) {
            booleanInput.value = true;
            this.selectedSortRadioButton = booleanInput;
        }

        sortingMenuItem.on('click', () => {
            this.selectedSortRadioButton.value = false;
            booleanInput.value = true;
            this.selectedSortRadioButton = booleanInput;
            this.sortPolicy = sortPolicy;
            this.sortCallback();
        });
    }
}

export { BaseStore, EMPTY_THUMBNAIL_IMAGE_LARGE, EMPTY_THUMBNAIL_IMAGE, STORE_ITEM_PAGE_SIZE };
