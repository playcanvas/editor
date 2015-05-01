editor.once('load', function() {
    'use strict';

    var currentAsset = null;
    var root = editor.call('layout.root');

    // menu
    var menu = new ui.Menu();
    root.append(menu);


    // // duplicate
    // var menuItemDuplicate = new ui.MenuItem({
    //     text: 'Duplicate',
    //     value: 'duplicate'
    // });
    // menuItemDuplicate.on('select', function() {
    //     // editor.call('assets:duplicate', currentAsset);
    // });
    // menu.append(menuItemDuplicate);

    // delete
    var menuItemDelete = new ui.MenuItem({
        text: 'Delete',
        value: 'delete'
    });
    menuItemDelete.on('select', function() {
        var asset = currentAsset;

        var multiple = false;
        var type = editor.call('selector:type');

        if (type === 'asset') {
            var items = editor.call('selector:items');
            for(var i = 0; i < items.length; i++) {
                if (items[i].get('id') === asset.get('id')) {
                    multiple = true;
                    break;
                }
            }
        }

        var msg = 'Delete Asset?';
        if (multiple)
            msg = 'Delete ' + items.length + ' Assets?';

        editor.call('picker:confirm', msg, function() {
            if (multiple) {
                for(var i = 0; i < items.length; i++) {
                    editor.call('assets:delete', items[i]);
                }
            } else {
                editor.call('assets:delete', asset);
            }
        });
    });
    menu.append(menuItemDelete);


    // // filter buttons
    // menu.on('open', function() {
    //     menuItemDuplicate.enabled = currentAsset.get('type') === 'material';
    // });


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
});
