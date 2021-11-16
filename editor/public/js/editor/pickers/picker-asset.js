editor.once('load', function () {
    'use strict';

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var overlay = new ui.Overlay();
    overlay.class.add('picker-asset');
    overlay.center = false;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    // initial select state
    var currentType = '';
    var currentAsset = null;
    var gridSelected = null;
    var allowMultiSelection = false;
    var assetSelection = [];

    var assetsPanelFolded = false;
    var assetsPanelFilter = '';
    var assetsPanelSearch = '';
    var assetsPanelFolder = null;
    // elements
    var assetsPanel = editor.call('layout.assets');

    // esc to close
    editor.call('hotkey:register', 'picker:assets:close', {
        key: 'esc',
        callback: function () {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });

    // picked asset
    assetsPanel.on('select', asset => {
        if (overlay.hidden) return;

        // do not allow selecting source assets
        if (asset.get('source')) return;

        if (!parseInt(asset.get('id'), 10)) {
            // probably a legacy script
            if (overlay.hidden ||
                (currentType !== '*' && currentType !== "script")) {
                return;
            }
        } else if ((currentType !== '*' && asset.get('type') !== currentType) || asset === currentAsset) {
            return;
        }

        if (allowMultiSelection) {
            assetSelection.push(asset);
            editor.emit('picker:assets', assetSelection);
        } else {
            editor.emit('picker:asset', asset);
        }

        assetsPanel.deselect(asset);

        if (!allowMultiSelection) {
            // hide picker
            overlay.hidden = true;
        }
    });

    assetsPanel.on('deselect', asset => {
        if (overlay.hidden || !asset) return;

        if (asset === currentAsset) {
            assetsPanel.selectedAssets = [asset];
        } else {
            if (allowMultiSelection) {
                var idx = assetSelection.indexOf(asset);
                if (idx !== -1) {
                    assetSelection.splice(idx, 1);
                    editor.emit('picker:assets', assetSelection);
                }
            }
        }
    });

    // on close asset picker
    overlay.on('hide', function () {
        // show all assets back
        assetsPanel.suspendFiltering = true;
        assetsPanel.showSourceAssets = true;
        assetsPanel.dropdownType.enabled = true;
        assetsPanel.dropdownType.value = assetsPanelFilter;
        assetsPanel.searchInput.value = assetsPanelSearch;
        assetsPanel.currentFolder = assetsPanelFolder;
        assetsPanel.suspendFiltering = false;
        assetsPanel.filter();

        // fold back assets panel if needed
        if (assetsPanelFolded)
            assetsPanel.collapsed = true;
        // enable selector
        editor.call('selector:enabled', true);
        // select what was selected
        assetsPanel.suspendSelectionEvents = true;
        assetsPanel.selectedAssets = gridSelected;
        assetsPanel.suspendSelectionEvents = false;

        if (allowMultiSelection) {
            editor.emit('picker:assets', assetSelection);
        }

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
     * @param {object} args - Arguments
     * @param {string} [args.type] - The asset type that this picker can pick. Can also be '*' for all
     * @param {boolean} [args.multi] - Allows selection of multiple assets
     * @param {Observer} [args.currentAsset] - The currently selected asset
     */
    editor.method('picker:asset', function (args) {
        var type = args.type;

        allowMultiSelection = !!args.multi;
        assetSelection.length = 0;

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
        var pickerType = type;
        if (pickerType === '*') {
            pickerType = 'all';
            assetsPanel.dropdownType.value = pickerType;
            assetsPanel.dropdownType.enabled = true;
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
        if (assetsPanelFolded)
            assetsPanel.collapsed = false;
        // show overlay
        overlay.hidden = false;

        assetsPanel.suspendSelectionEvents = false;
    });

    // Deselects all picked assets
    editor.method('picker:asset:deselect', function () {
        assetsPanel.selectedAssets = currentAsset ? [currentAsset] : [];
    });

    // close asset picker
    editor.method('picker:asset:close', function () {
        // hide overlay
        overlay.hidden = true;
    });
});
