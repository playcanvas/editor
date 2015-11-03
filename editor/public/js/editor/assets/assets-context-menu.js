editor.once('load', function() {
    'use strict';

    var currentAsset = null;
    var root = editor.call('layout.root');

    // menu
    var menu = new ui.Menu();
    root.append(menu);


    // edit
    var menuItemNewScript = new ui.MenuItem({
        text: 'New Script',
        icon: '&#57910;',
        value: 'script'
    });
    menuItemNewScript.on('select', function() {
        editor.call('sourcefiles:new');
    });
    menu.append(menuItemNewScript);


    // new asset
    var menuItemNew = new ui.MenuItem({
        text: 'New Asset',
        icon: '&#57632;',
        value: 'new'
    });
    menu.append(menuItemNew);

    var assets = {
        'upload': {
            title: 'Upload',
            icon: '&#57909;'
        },
        'folder': {
            title: 'Folder',
            icon: '&#57657;'
        },
        'css': {
            title: 'CSS',
            icon: '&#57862;'
        },
        'cubemap': {
            title: 'CubeMap',
            icon: '&#57879;'
        },
        'html': {
            title: 'HTML',
            icon: '&#57861;'
        },
        'json': {
            title: 'JSON',
            icon: '&#57863;'
        },
        'material': {
            title: 'Material',
            icon: '&#57749;'
        },
        'script': {
            title: 'Script',
            icon: '&#57910;'
        },
        'shader': {
            title: 'Shader',
            icon: '&#57881;'
        },
        'text': {
            title: 'Text',
            icon: '&#57865;'
        }
    };

    var addNewMenuItem = function(key, data) {
        // new folder
        var item = new ui.MenuItem({
            text: data.title,
            icon: data.icon || '',
            value: key
        });
        item.on('select', function() {
            var args = { };

            if (currentAsset && currentAsset.get('type') === 'folder') {
                args.parent = currentAsset;
            } else if (currentAsset === undefined) {
                args.parent = editor.call('assets:panel:currentFolder');
            }

            if (key === 'upload') {
                editor.call('assets:upload:picker', args);
            } else if (key === 'script') {
                editor.call('sourcefiles:new');
            } else {
                editor.call('assets:create:' + key, args)
            }
        });
        menuItemNew.append(item);

        if (key === 'script') {
            editor.on('repositories:load', function (repositories) {
                if (repositories.get('current') !== 'directory')
                    item.disabled = true;
            });
        }
    };

    var keys = Object.keys(assets);
    for(var i = 0; i < keys.length; i++) {
        if (! assets.hasOwnProperty(keys[i]))
            continue;

        addNewMenuItem(keys[i], assets[keys[i]]);
    }


    // edit
    var menuItemEdit = new ui.MenuItem({
        text: 'Edit',
        icon: '&#57648;',
        value: 'edit'
    });
    menuItemEdit.on('select', function() {
        editor.call('assets:edit', currentAsset);
    });
    menu.append(menuItemEdit);


    // duplicate
    var menuItemDuplicate = new ui.MenuItem({
        text: 'Duplicate',
        icon: '&#57638;',
        value: 'duplicate'
    });
    menuItemDuplicate.on('select', function() {
        editor.call('assets:duplicate', currentAsset);
    });
    menu.append(menuItemDuplicate);


    // delete
    var menuItemDelete = new ui.MenuItem({
        text: 'Delete',
        icon: '&#57636;',
        value: 'delete'
    });
    menuItemDelete.style.fontWeight = 200;
    menuItemDelete.on('select', function() {
        var asset = currentAsset;
        var multiple = false;

        if (asset) {
            var assetType = asset.get('type');
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
        }
    });
    menu.append(menuItemDelete);


    // filter buttons
    menu.on('open', function() {
        menuItemNewScript.hidden = ! (currentAsset !== undefined && editor.call('assets:panel:currentFolder') === 'scripts');
        menuItemNew.hidden = ! menuItemNewScript.hidden;

        if (currentAsset) {
            // duplicate
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
            }

            // edit
            if (['html', 'css', 'json', 'text', 'script', 'shader'].indexOf(currentAsset.get('type')) !== -1) {
                if (editor.call('selector:type') === 'asset') {
                    var items = editor.call('selector:items');
                    menuItemEdit.hidden = (items.length > 1 && items.indexOf(currentAsset) !== -1);
                } else {
                    menuItemEdit.hidden = false;
                }
            } else {
                menuItemEdit.hidden = true;
            }

            // delete
            menuItemDelete.hidden = false;
        } else {
            // no asset
            menuItemDuplicate.hidden = true;
            menuItemEdit.hidden = true;
            menuItemDelete.hidden = true;
        }
    });


    // for each asset added
    editor.on('assets:add', function(asset) {
        // get grid item
        var item = editor.call('assets:panel:get', asset.get('id'));
        if (! item) return;

        var contextMenuHandler = function(evt) {
            evt.stopPropagation();
            evt.preventDefault();

            if (! editor.call('permissions:write'))
                return;

            currentAsset = asset;
            menu.open = true;
            menu.position(evt.clientX + 1, evt.clientY);
        };

        // grid
        item.element.addEventListener('contextmenu', contextMenuHandler, false);

        // tree
        if (item.tree)
            item.tree.elementTitle.addEventListener('contextmenu', contextMenuHandler, false);
    });

    editor.on('sourcefiles:add', function(asset) {
        // get grid item
        var item = editor.call('assets:panel:get', asset.get('filename'));
        if (! item) return;

        // attach contextmenu event
        item.element.addEventListener('contextmenu', function(evt) {
            evt.stopPropagation();
            evt.preventDefault();

            if (! editor.call('permissions:write'))
                return;

            currentAsset = asset;
            menu.open = true;
            menu.position(evt.clientX + 1, evt.clientY);
        });
    });


    // folders
    editor.call('assets:panel:folders').innerElement.addEventListener('contextmenu', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if (! editor.call('permissions:write'))
            return;

        currentAsset = undefined;
        menu.open = true;
        menu.position(evt.clientX + 1, evt.clientY);
    }, false);

    // files
    editor.call('assets:panel:files').innerElement.addEventListener('contextmenu', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if (! editor.call('permissions:write'))
            return;

        currentAsset = null;
        menu.open = true;
        menu.position(evt.clientX + 1, evt.clientY);
    }, false);
});
