editor.once('load', function() {
    'use strict';

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
    var assetsPanelFolded = false;
    var assetsPanelFilter = '';
    var assetsPanelSearch = '';
    // elements
    var assetsGrid = editor.call('assets:grid');
    var assetsPanel = editor.call('layout.assets');


    // esc to close
    editor.call('hotkey:register', 'picker:assets:close', {
        key: 'esc',
        callback: function() {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });

    assetsGrid.on('deselect', function(item) {
        if (overlay.hidden || ! item.asset || item.asset !== currentAsset)
            return;

        this.selected = [ item ];
    });

    // picked asset
    assetsGrid.on('select', function(item) {
        if (item.asset) {
            if (overlay.hidden ||
                (currentType !== '*' && item.asset.get('type') !== currentType) ||
                item.asset === currentAsset) {
                return;
            }

            // emit event
            if (item.asset)
                editor.emit('picker:asset', item.asset);
        } else if (item.script) {
            if (overlay.hidden ||
                (currentType !== '*' && currentType !== "script")) {
                return;
            }

            if (item.script)
                editor.emit('picker:asset', item.script);
        }


        // hide picker
        overlay.hidden = true;
    });


    // on close asset picker
    overlay.on('hide', function() {
        // show all assets back
        editor.call('assets:filter:type:disabled', false);
        editor.call('assets:filter:type', assetsPanelFilter);
        editor.call('assets:filter:search', assetsPanelSearch);
        // fold back assets panel if needed
        if (assetsPanelFolded)
            assetsPanel.folded = true;
        // enable selector
        editor.call('selector:enabled', true);
        // select what was selected
        assetsGrid.selected = gridSelected;
        // emit event
        editor.emit('picker:asset:close');
        // styling
        assetsPanel.style.zIndex = '';
        assetsPanel.style.overflow = '';
    });


    // open asset picker
    editor.method('picker:asset', function(type, asset) {
        // show only asset assets
        assetsPanelFilter = editor.call('assets:filter:type');
        assetsPanelSearch = editor.call('assets:filter:search');
        // initial grid selected items
        gridSelected = assetsGrid.selected;
        // filters
        editor.call('assets:filter:type', (type === '*') ? 'all' : type);
        editor.call('assets:filter:type:disabled', (! type || type === '*') ? false : true);
        // disable selector
        editor.call('selector:enabled', false);
        // find current asset
        currentType = type;
        currentAsset = asset;
        if (currentAsset) {
            var gridItem = assetsGrid.assetsIndex[currentAsset.get('id')];
            // select in grid
            if (gridItem)
                assetsGrid.selected = [ gridItem ];
        }
        // show asset panel in front
        assetsPanel.style.zIndex = 102;
        assetsPanel.style.overflow = 'visible';
        // if panel folded?
        assetsPanelFolded = assetsPanel.folded;
        if (assetsPanelFolded)
            assetsPanel.folded = false;
        // show overlay
        overlay.hidden = false;
        // flash assets panel
        assetsPanel.flash();
        // focus on panel
        setTimeout(function() {
            if (assetsGrid.selected && assetsGrid.selected.length) {
                assetsGrid.selected[0].element.focus();
            } else {
                assetsGrid.element.focus();
            }
        }, 100);

        // if no assets then show message
        var visible = assetsGrid.element.querySelectorAll('.ui-grid-item:not(.hidden)');
        if (visible.length === 0) {
            var msg = type === 'script' ? 'scripts' : type + ' assets';
            editor.call('assets:panel:message', 'There are no ' + msg + '. Click on the <span class="font-icon" style="font-size: 18px">&#57632;</span> button to add one.');
        }
    });


    // close asset picker
    editor.method('picker:asset:close', function() {
        // hide overlay
        overlay.hidden = true;
    });
});
