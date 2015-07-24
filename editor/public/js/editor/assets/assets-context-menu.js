editor.once('load', function() {
    'use strict';

    var currentAsset = null;
    var root = editor.call('layout.root');

    // menu
    var menu = new ui.Menu();
    root.append(menu);

    // edit
    var menuItemEdit = new ui.MenuItem({
        text: 'Edit',
        value: 'edit'
    });
    menuItemEdit.on('select', function() {
        editor.call('assets:edit', currentAsset);
    });
    menu.append(menuItemEdit);


    // duplicate
    var menuItemDuplicate = new ui.MenuItem({
        text: 'Duplicate',
        value: 'duplicate'
    });
    menuItemDuplicate.on('select', function() {
        editor.call('assets:duplicate', currentAsset);
    });
    menu.append(menuItemDuplicate);


    // delete
    var menuItemDelete = new ui.MenuItem({
        text: 'Delete',
        value: 'delete'
    });
    menuItemDelete.on('select', function() {
        var asset = currentAsset;
        var assetType = asset.get('type');

        var multiple = false;
        var type = editor.call('selector:type');
        var items;

        if (type === 'asset') {
            items = editor.call('selector:items');
            for(var i = 0; i < items.length; i++) {
                if ((assetType === 'script' && items[i].get('filename') === asset.get('filename')) || (assetType !== 'script' && items[i].get('id') === asset.get('id'))) {
                    multiple = true;
                    break;
                }
            }
        }

        editor.call('assets:delete:picker', multiple ? items : [ asset ]);
    });
    menu.append(menuItemDelete);


    // filter buttons
    menu.on('open', function() {
        if (currentAsset.get('type') === 'material') {
            menuItemEdit.hidden = true;
            if (editor.call('selector:type') === 'asset') {
                var items = editor.call('selector:items');
                menuItemDuplicate.hidden = (items.length > 1 && items.indexOf(currentAsset) !== -1);
            } else {
                menuItemDuplicate.hidden = false;
            }
        } else {
            menuItemDuplicate.hidden = true;

            if (/^(html)|(css)|(json)|(text)|(script)$/.test(currentAsset.get('type'))) {
                if (editor.call('selector:type') === 'asset') {
                    var items = editor.call('selector:items');
                    menuItemEdit.hidden = (items.length > 1 && items.indexOf(currentAsset) !== -1);
                } else {
                    menuItemEdit.hidden = false;
                }
            } else {
                menuItemEdit.hidden = true;
            }
        }
    });


    // for each asset added
    editor.on('assets:add', function(asset) {
        // get grid item
        var item = editor.call('assets:panel:get', asset.get('id'));
        if (! item) return;

        // attach contextmenu event
        item.element.addEventListener('contextmenu', function(evt) {
            if (! editor.call('permissions:write')) return;

            currentAsset = asset;
            menu.open = true;
            menu.position(evt.clientX + 1, evt.clientY);
        });
    });

    editor.on('sourcefiles:add', function(asset) {
        // get grid item
        var item = editor.call('assets:panel:get', asset.get('filename'));
        if (! item) return;

        // attach contextmenu event
        item.element.addEventListener('contextmenu', function(evt) {
            if (! editor.call('permissions:write')) return;

            currentAsset = asset;
            menu.open = true;
            menu.position(evt.clientX + 1, evt.clientY);
        });
    });
});
