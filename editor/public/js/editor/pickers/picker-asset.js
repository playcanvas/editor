editor.once('load', function() {
    'use strict';


    var selectorList = null;

    var overlay = new ui.Overlay();
    overlay.class.add('picker-asset');
    overlay.center = false;
    // overlay.transparent = true;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    // initial select state
    var currentType = '';
    var currentAsset = null;
    var gridSelected = null;
    var assetsPanelFolded = false;
    // elements
    var assetsGrid = editor.call('assets:grid');
    var assetsPanel = editor.call('layout.assets');


    // esc to close
    assetsPanel.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode !== 27 || overlay.hidden)
            return;

        overlay.hidden = true;
    }, false);


    assetsGrid.on('deselect', function(item) {
        if (overlay.hidden || ! item.asset || item.asset !== currentAsset)
            return;

        this.selected = [ item ];
    });

    // picked asset
    assetsGrid.on('select', function(item) {
        if (overlay.hidden || ! item.asset || item.asset.get('type') !== currentType || item.asset === currentAsset)
            return;

        // emit event
        editor.emit('picker:asset', item.asset);

        // hide picker
        overlay.hidden = true;
    });


    // on close asset picker
    overlay.on('hide', function() {
        // show all assets back
        editor.call('assets:panel:filter', function(asset) {
            return true;
        });
        // select what was selected
        assetsGrid.selected = gridSelected;
        // fold back assets panel if needed
        if (assetsPanelFolded)
            assetsPanel.folded = true;
        // disable selector
        editor.call('selector:enabled', true);
        // emit event
        editor.emit('picker:asset:close');
        // z-index
        assetsPanel.style.zIndex = '';
    });


    // open asset picker
    editor.method('picker:asset', function(type, asset) {
        // show only asset assets
        editor.call('assets:panel:filter', function(item) {
            return item.get('type') === type;
        });
        // disable selector
        editor.call('selector:enabled', false);
        // initial grid selected items
        gridSelected = assetsGrid.selected;
        // find current asset
        currentType = type;
        currentAsset = asset;
        if (currentAsset) {
            var gridItem = assetsGrid.assetsIndex[currentAsset];
            // select in grid
            if (gridItem)
                assetsGrid.selected = [ gridItem ];
        }
        // show asset panel in front
        assetsPanel.style.zIndex = 102;
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
    });


    // close asset picker
    editor.method('picker:asset:close', function() {
        // hide overlay
        overlay.hidden = true;
    });
});
