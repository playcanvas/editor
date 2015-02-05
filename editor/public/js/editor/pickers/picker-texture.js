editor.once('load', function() {
    'use strict';


    var selectorList = null;

    var overlay = new ui.Overlay();
    overlay.class.add('picker-texture');
    overlay.center = false;
    // overlay.transparent = true;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    // initial select state
    var gridSelected = null;
    var currentTexture = null;
    var assetsPanelFolded = false;
    // elements
    var assetsGrid = editor.call('assets:grid');
    var assetsPanel = editor.call('layout.assets');


    assetsGrid.on('deselect', function(item) {
        if (overlay.hidden || ! item.asset || item.asset !== currentTexture)
            return;

        this.selected = [ item ];
    });

    // picked asset
    assetsGrid.on('select', function(item) {
        if (overlay.hidden || ! item.asset || item.asset.type !== 'texture' || item.asset === currentTexture)
            return;

        // emit event
        editor.emit('picker:texture', item.asset);

        // hide picker
        overlay.hidden = true;
    });


    // on close texture picker
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
        editor.emit('picker:texture:close');
    });


    // open texture picker
    editor.method('picker:texture', function(asset) {
        // show only texture assets
        editor.call('assets:panel:filter', function(item) {
            return item.type === 'texture';
        });
        // disable selector
        editor.call('selector:enabled', false);
        // initial grid selected items
        gridSelected = assetsGrid.selected;
        // find current texture
        currentTexture = asset;
        if (currentTexture) {
            var gridItem = assetsGrid.assetsIndex[currentTexture.id];
            // select in grid
            if (gridItem)
                assetsGrid.selected = [ gridItem ];
        }
        // show texture panel in front
        assetsPanel.style.zIndex = 102;
        // if panel folded?
        assetsPanelFolded = assetsPanel.folded;
        if (assetsPanelFolded)
            assetsPanel.folded = false;
        // show overlay
        overlay.hidden = false;
    });


    // close texture picker
    editor.method('picker:texture:close', function() {
        // hide overlay
        overlay.hidden = true;
    });
});
