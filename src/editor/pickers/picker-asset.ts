import type { Observer } from '@playcanvas/observer';

import { LegacyOverlay } from '@/common/ui/overlay';

editor.once('load', () => {
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    const overlay = new LegacyOverlay();
    overlay.class.add('picker-asset');
    overlay.center = false;
    overlay.hidden = true;

    const root = editor.call('layout.root');
    root.append(overlay);

    // initial select state
    let currentType = '';
    let currentAsset = null;
    let gridSelected = null;
    let allowMultiSelection = false;
    let assetSelection = [];

    let assetsPanelFolded = false;
    let assetsPanelFilter = '';
    let assetsPanelSearch = '';
    let assetsPanelFolder = null;
    // elements
    const assetsPanel = editor.call('layout.assets');

    // esc to close
    editor.call('hotkey:register', 'picker:assets:close', {
        key: 'Escape',
        callback: function () {
            if (overlay.hidden) {
                return;
            }

            overlay.hidden = true;
        }
    });

    // picked asset
    assetsPanel.on('select', (asset: Observer) => {
        if (overlay.hidden) {
            return;
        }

        // Do not allow selecting source assets or folders for the picker result
        if (asset.get('source') || asset.get('type') === 'folder') {
            return;
        }

        const assetType = asset.get('type');
        const isLegacyScript = !parseInt(asset.get('id'), 10);

        // Validate asset type
        let isValidType = false;
        if (currentType === '*') {
            isValidType = true;
        } else if (Array.isArray(currentType)) {
            isValidType = currentType.includes(assetType);
        } else if (assetType === currentType) {
            isValidType = true;
        } else if (isLegacyScript && currentType === 'script') {
            isValidType = true; // Allow legacy scripts if 'script' type is expected
        }

        if (!isValidType) {
            return;
        }

        if (allowMultiSelection) {
            if (!assetSelection.includes(asset)) {
                assetSelection.push(asset);
            }
            editor.emit('picker:assets', assetSelection);
        } else {
            // For single selection, the 'select' event just updates the *potential* selection.
            // The actual confirmation happens on double-click.
            assetSelection = [asset];
        }
    });

    assetsPanel.on('deselect', (asset: Observer) => {
        if (overlay.hidden || !asset) {
            return;
        }

        if (allowMultiSelection) {
            const idx = assetSelection.indexOf(asset);
            if (idx !== -1) {
                assetSelection.splice(idx, 1);
                editor.emit('picker:assets', assetSelection);
            }
        }
    });

    assetsPanel.on('doubleclick', (asset: Observer) => {
        if (overlay.hidden) {
            return;
        }

        // If double-clicked asset is a folder, the assetsPanel itself will navigate.
        // We don't want to select a folder as an asset for the picker.
        if (asset.get('type') === 'folder') {
            return;
        }

        // Do not allow selecting source assets
        if (asset.get('source')) {
            return;
        }

        const assetType = asset.get('type');
        const isLegacyScript = !parseInt(asset.get('id'), 10);

        // Validate asset type
        let isValidType = false;
        if (currentType === '*') {
            isValidType = true;
        } else if (Array.isArray(currentType)) {
            isValidType = currentType.includes(assetType);
        } else if (assetType === currentType) {
            isValidType = true;
        } else if (isLegacyScript && currentType === 'script') {
            isValidType = true; // Allow legacy scripts if 'script' type is expected
        }

        if (!isValidType) {
            return;
        }

        // If we reach here, the asset is valid and double-clicked. Confirm selection.
        if (allowMultiSelection) {
            // For multi-selection, double-clicking an asset confirms the *current* selection.
            // Ensure the double-clicked asset is part of the selection.
            if (!assetSelection.includes(asset)) {
                assetSelection.push(asset);
            }
            editor.emit('picker:assets', assetSelection);
        } else {
            // For single selection, the double-clicked asset is the chosen one.
            assetSelection = [asset]; // Ensure it's the only one
            editor.emit('picker:asset', asset);
        }

        // Hide picker after confirmation
        overlay.hidden = true;
    });

    // on close asset picker
    overlay.on('hide', () => {
        // show all assets back
        assetsPanel.suspendFiltering = true;
        assetsPanel.showSourceAssets = true;
        assetsPanel.dropdownType.enabled = true;
        assetsPanel.dropdownType.value = assetsPanelFilter;
        assetsPanel.searchInput.value = assetsPanelSearch;
        assetsPanel.currentFolder = assetsPanelFolder;
        assetsPanel.suspendFiltering = false;
        assetsPanel.assetTypes = null;
        assetsPanel.filter();

        // fold back assets panel if needed
        if (assetsPanelFolded) {
            assetsPanel.collapsed = true;
        }
        // enable selector
        editor.call('selector:enabled', true);
        // select what was selected
        assetsPanel.suspendSelectionEvents = true;
        assetsPanel.selectedAssets = gridSelected;
        assetsPanel.suspendSelectionEvents = false;

        if (allowMultiSelection) {
            editor.emit('picker:assets', assetSelection);
        }

        assetSelection = [];

        // emit event
        editor.emit('picker:asset:close');
        // styling
        assetsPanel.style.zIndex = '';
        assetsPanel.style.overflow = '';
    });


    /**
     * Opens the asset picker. To get the selected asset(s) listen for the 'picker:asset' event or
     * the 'picker:assets' event if args.multi is true.
     *
     * @param args - Arguments
     */
    editor.method('picker:asset', (args: { type?: string; multi?: boolean; currentAsset?: import('@playcanvas/observer').Observer; validateAssetsFn?: (asset: import('@playcanvas/observer').Observer) => boolean }) => {
        const type = args.type;

        allowMultiSelection = !!args.multi;
        assetSelection = [];

        currentType = type;
        currentAsset = args.currentAsset;

        // remember previous settings
        assetsPanelFilter = assetsPanel.dropdownType.value;
        assetsPanelSearch = assetsPanel.searchInput.value;
        assetsPanelFolder = assetsPanel.currentFolder;

        assetsPanel.suspendFiltering = true;

        // navigate to scripts folder
        if (legacyScripts && type === 'script') {
            assetsPanel.currentFolder = 'scripts';
        }

        // remember selected
        assetsPanel.suspendSelectionEvents = true;
        gridSelected = assetsPanel.selectedAssets;
        assetsPanel.selectedAssets = [];

        // filters
        let pickerType = type;
        if (pickerType === '*') {
            pickerType = 'all';
            assetsPanel.dropdownType.value = pickerType;
            assetsPanel.dropdownType.enabled = true;
        } else if (Array.isArray(pickerType)) {
            assetsPanel.assetTypes = pickerType;
            assetsPanel.dropdownType.value = 'all';
            assetsPanel.dropdownType.enabled = false;
        } else {
            assetsPanel.dropdownType.value = pickerType;
            assetsPanel.dropdownType.enabled = false;
        }

        // disable selector
        editor.call('selector:enabled', false);

        // disable showing source assets
        assetsPanel.showSourceAssets = false;

        // set current folder to currentAsset
        if (currentAsset) {
            assetsPanel.selectedAssets = [currentAsset];
            let currentFolder = null;
            const path = currentAsset.get('path');
            if (path.length) {
                currentFolder = editor.call('assets:get', path[path.length - 1]);
            }
            assetsPanel.currentFolder = currentFolder;
        }

        assetsPanel.suspendFiltering = false;
        assetsPanel.validateAssetsFn = args.validateAssetsFn;
        assetsPanel.filter();
        assetsPanel.validateAssetsFn = null;

        // show asset panel in front
        assetsPanel.style.zIndex = 102;
        assetsPanel.style.overflow = 'visible';
        // if panel folded?
        assetsPanelFolded = assetsPanel.collapsed;
        if (assetsPanelFolded) {
            assetsPanel.collapsed = false;
        }
        // show overlay
        overlay.hidden = false;

        assetsPanel.suspendSelectionEvents = false;
    });

    // Deselects all picked assets
    editor.method('picker:asset:deselect', () => {
        assetsPanel.selectedAssets = currentAsset ? [currentAsset] : [];
    });

    // close asset picker
    editor.method('picker:asset:close', () => {
        // hide overlay
        overlay.hidden = true;
    });
});
