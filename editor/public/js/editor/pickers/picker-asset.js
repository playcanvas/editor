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
    var assetsGrid = editor.call('assets:grid');
    var assetsPanel = editor.call('layout.assets');

    var pluralize = function (word) {
        return word + ' assets';
    };

    // empty filter messages
    var getNoResultsMessage = function (type, filter) {
        var result;

        if (legacyScripts && type === 'script') {
            result = 'There are no scripts. Click on the <span class="font-icon" style="font-size: 18px">&#57632;</span> button to add one';
        } else if (type === 'material' || type === 'cubemap' || type === 'text' || type === 'json' || type === 'html' || type === 'shader' || type === 'css' || (!legacyScripts && type === 'script')) {
            result = 'There are no ' + pluralize(type) + ' in this folder. Click on the <span class="font-icon" style="font-size: 18px">&#57632;</span> button to add one';
        } else {
            result = 'There are no ' + pluralize(type) + ' in this folder. Add one by uploading a ' + type + ' file';
        }

        if (filter) {
            result += ' or change your search term.';
        } else {
            result += '.';
        }

        return result;
    };

    // esc to close
    editor.call('hotkey:register', 'picker:assets:close', {
        key: 'esc',
        callback: function () {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });

    assetsGrid.on('deselect', function (item) {
        if (overlay.hidden || !item.asset)
            return;

        if (item.asset === currentAsset) {
            this.selected = [item];
        } else {
            if (allowMultiSelection) {
                var idx = assetSelection.indexOf(item.asset);
                if (idx !== -1) {
                    assetSelection.splice(idx, 1);
                    editor.emit('picker:assets', assetSelection);
                }
            }
        }
    });

    // picked asset
    assetsGrid.on('select', function (item) {
        if (item.asset) {
            if (overlay.hidden ||
                (currentType !== '*' && item.asset.get('type') !== currentType) ||
                item.asset === currentAsset) {
                return;
            }

            // emit event
            if (item.asset) {
                if (allowMultiSelection) {
                    assetSelection.push(item.asset);
                    editor.emit('picker:assets', assetSelection);
                } else {
                    editor.emit('picker:asset', item.asset);
                }
            }
        } else if (item.script) {
            if (overlay.hidden ||
                (currentType !== '*' && currentType !== "script")) {
                return;
            }

            if (item.script) {
                if (allowMultiSelection) {
                    assetSelection.push(item.script);
                    editor.emit('picker:assets', assetSelection);
                } else {
                    editor.emit('picker:asset', item.script);
                }
            }
        }

        if (!allowMultiSelection) {
            // hide picker
            overlay.hidden = true;
        }
    });


    // on close asset picker
    overlay.on('hide', function () {
        // show all assets back
        editor.call('assets:filter:type:disabled', false);
        editor.call('assets:filter:type', assetsPanelFilter);
        editor.call('assets:filter:search', assetsPanelSearch);
        editor.call('assets:panel:currentFolder', assetsPanelFolder);
        // fold back assets panel if needed
        if (assetsPanelFolded)
            assetsPanel.collapsed = true;
        // enable selector
        editor.call('selector:enabled', true);
        // select what was selected
        assetsGrid.selected = gridSelected;

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
     * @param {Object} args Arguments
     * @param {String} [args.type] The asset type that this picker can pick. Can also be '*' for all
     * @param {Boolean} [args.multi] Allows selection of multiple assets
     * @param {Observer} [args.currentAsset] The currently selected asset
     */
    editor.method('picker:asset', function (args) {
        var type = args.type;

        allowMultiSelection = !!args.multi;
        assetSelection.length = 0;

        // show only asset assets
        assetsPanelFilter = editor.call('assets:filter:type');
        assetsPanelSearch = editor.call('assets:filter:search');
        assetsPanelFolder = editor.call('assets:panel:currentFolder');
        // navigate to scripts folder

        if (legacyScripts && type === 'script')
            editor.call('assets:panel:currentFolder', 'scripts');
        // initial grid selected items
        gridSelected = assetsGrid.selected;
        // filters
        var pickerType = type;
        if (type === 'texture') {
            pickerType = 'textureTarget';
        } else if (type === 'textureatlas') {
            pickerType = 'textureAtlasTarget';
        } else if (type === 'font') {
            pickerType = 'fontTarget';
        }

        editor.call('assets:filter:type', (pickerType === '*') ? 'all' : pickerType);
        editor.call('assets:filter:type:disabled', (!pickerType || pickerType === '*') ? false : true);

        // disable selector
        editor.call('selector:enabled', false);
        // find current asset
        currentType = type;
        currentAsset = args.currentAsset;
        if (currentAsset) {
            var gridItem = assetsGrid.assetsIndex[currentAsset.get('id')];
            // select in grid
            if (gridItem) {
                assetsGrid.selected = [gridItem];
                // navigate to folder of referenced file
                if (legacyScripts && type === 'script') {
                    editor.call('assets:panel:currentFolder', 'scripts');
                } else {
                    var path = currentAsset.get('path');
                    if (path.length) {
                        editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
                    } else {
                        editor.call('assets:panel:currentFolder', null);
                    }
                }
            }
        }
        // show asset panel in front
        assetsPanel.style.zIndex = 102;
        assetsPanel.style.overflow = 'visible';
        // if panel folded?
        assetsPanelFolded = assetsPanel.collapsed;
        if (assetsPanelFolded)
            assetsPanel.collapsed = false;
        // show overlay
        overlay.hidden = false;
        // flash assets panel
        assetsPanel.flash();
        // focus on panel
        setTimeout(function () {
            if (assetsGrid.selected && assetsGrid.selected.length) {
                assetsGrid.selected[0].element.focus();
            } else {
                assetsGrid.element.focus();
            }

            // if no assets then show message
            var visible = assetsGrid.element.querySelectorAll('.ui-grid-item:not(.hidden)');
            if (visible.length === 0) {
                var msg = getNoResultsMessage(type, assetsPanelSearch);
                editor.call('assets:panel:message', msg);
            }
        }, 100);

    });

    // Deselects all picked assets
    editor.method('picker:asset:deselect', function () {
        assetsGrid.selected = currentAsset ? [currentAsset] : [];
    });

    // close asset picker
    editor.method('picker:asset:close', function () {
        // hide overlay
        overlay.hidden = true;
    });
});
