editor.once('load', function() {
    'use strict';

    var currentAsset = null;
    var root = editor.call('layout.root');

    // menu
    var menu = new ui.Menu();
    root.append(menu);


    // duplicate
    var menuItemDuplicate = new ui.MenuItem({
        text: 'Duplicate',
        value: 'duplicate'
    });
    menuItemDuplicate.on('select', function() {
        // editor.call('assets:duplicate', currentAsset);
    });
    menu.append(menuItemDuplicate);

    // delete
    var menuItemDelete = new ui.MenuItem({
        text: 'Delete',
        value: 'delete'
    });
    menuItemDelete.on('select', function() {
        // editor.call('assets:delete', currentAsset);
    });
    menu.append(menuItemDelete);


    // filter buttons
    menu.on('open', function() {
        menuItemDuplicate.enabled = currentAsset.get('type') === 'material';
    });


    // for each asset added
    editor.on('assets:add', function(asset) {
        // get grid item
        var item = editor.call('assets:panel:get', asset.get('id'));
        if (! item) return;

        // attach contextmenu event
        item.element.addEventListener('contextmenu', function(evt) {
            currentAsset = asset;
            menu.position(evt.clientX, evt.clientY);
            menu.open = true;
        });
    });
});
