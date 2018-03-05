editor.once('load', function() {
    'use strict';

    var currentAsset = null;
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    var root = editor.call('layout.root');

    var customMenuItems = [ ];

    // menu
    var menu = new ui.Menu();
    root.append(menu);


    // edit
    var menuItemNewScript = new ui.MenuItem({
        text: 'New Script',
        icon: '&#57864;',
        value: 'script'
    });
    menuItemNewScript.on('select', function() {
        if (legacyScripts) {
            editor.call('sourcefiles:new');
        } else {
            editor.call('picker:script-create', function(filename) {
                editor.call('assets:create:script', {
                    filename: filename,
                    boilerplate: true
                });
            });
        }
    });
    menu.append(menuItemNewScript);


    // new asset
    var menuItemNew = new ui.MenuItem({
        text: 'New Asset',
        icon: '&#57632;',
        value: 'new'
    });
    menu.append(menuItemNew);

    var downloadable = {
        'texture': 1,
        'textureatlas': 1,
        'html': 1,
        'css': 1,
        'shader': 1,
        'scene': 1,
        'json': 1,
        'audio': 1,
        'text': 1
    };

    var icons = {
        'upload': '&#57909;',
        'folder': '&#57657;',
        'css': '&#57864;',
        'cubemap': '&#57879;',
        'html': '&#57864;',
        'json': '&#57864;',
        'layers': '&#57992',
        'material': '&#57749;',
        'script': '&#57864;',
        'shader': '&#57864;',
        'sprite': '&#57858',
        'text': '&#57864;',
        'texture': '&#57857;',
        'textureatlas': '&#57857;',
        'model': '&#57735;',
        'scene': '&#57735;',
        'animation': '&#57875;',
        'audio': '&#57872;'
    };

    var assets = {
        'upload': 'Upload',
        'folder': 'Folder',
        'css': 'CSS',
        'cubemap': 'CubeMap',
        'html': 'HTML',
        'json': 'JSON',
        'material': 'Material',
        'script': 'Script',
        'shader': 'Shader',
        'text': 'Text'
    };

    if (editor.call('users:isSpriteTester')) {
        assets.sprite = 'Sprite';
    }

    var addNewMenuItem = function(key, title) {
        // new folder
        var item = new ui.MenuItem({
            text: title,
            icon: icons[key] || '',
            value: key
        });
        item.on('select', function() {
            var args = { };

            if (currentAsset && currentAsset.get('type') === 'folder') {
                args.parent = currentAsset;
            } else if (currentAsset === undefined) {
                args.parent = null;
            }

            if (key === 'upload') {
                editor.call('assets:upload:picker', args);
            } else if (key === 'script') {
                if (legacyScripts) {
                    editor.call('sourcefiles:new');
                } else {
                    editor.call('picker:script-create', function(filename) {
                        editor.call('assets:create:script', {
                            filename: filename,
                            boilerplate: true
                        });
                    });
                }
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


    // related
    var menuItemReferences = new ui.MenuItem({
        text: 'References',
        icon: '&#57622;',
        value: 'references'
    });
    menu.append(menuItemReferences);


    // replace
    var replaceAvailable = {
        'material': true,
        'texture': true,
        'textureatlas': true,
        'model': true,
        'animation': true,
        'audio': true,
        'cubemap': true,
        'css': true,
        'html': true,
        'shader': true,
        'json': true,
        'text': true
    };
    var menuItemReplace = new ui.MenuItem({
        text: 'Replace',
        icon: '&#57640;',
        value: 'replace'
    });
    menuItemReplace.on('select', function() {
        var id = parseInt(currentAsset.get('id'), 10);

        editor.call('picker:asset', currentAsset.get('type'), currentAsset);

        var evtPick = editor.once('picker:asset', function(asset) {
            editor.call('assets:replace', currentAsset, asset);
            evtPick = null;
        });

        editor.once('picker:asset:close', function() {
            if (evtPick) {
                evtPick.unbind();
                evtPick = null;
            }
        });
    });
    menu.append(menuItemReplace);

    // todo: xdu.
    // todo: merge these 2 items.
    
    // extract. Used for source assets.
    var menuItemExtract = new ui.MenuItem({
        text: 'Re-Import',
        icon: '&#57889;',
        value: 'extract'
    });
    menuItemExtract.on('select', function() {
        editor.call('assets:reimport', currentAsset.get('id'), currentAsset.get('type'));
    });
    menu.append(menuItemExtract);


    // re-import. Used for target assets.
    var menuItemReImport = new ui.MenuItem({
        text: 'Re-Import',
        icon: '&#57889;',
        value: 're-import'
    });
    menuItemReImport.on('select', function() {
        editor.call('assets:reimport', currentAsset.get('id'), currentAsset.get('type'));
    });
    menu.append(menuItemReImport);

    // download
    var menuItemDownload = new ui.MenuItem({
        text: 'Download',
        icon: '&#57896;',
        value: 'download'
    });
    menuItemDownload.on('select', function() {
        window.open(currentAsset.get('file.url'));
    });
    menu.append(menuItemDownload);


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
        menuItemNewScript.hidden = ! ((currentAsset === null || (currentAsset && currentAsset.get('type') === 'script')) && editor.call('assets:panel:currentFolder') === 'scripts');
        menuItemNew.hidden = ! menuItemNewScript.hidden;

        if (currentAsset) {
            // download
            menuItemDownload.hidden = ! ((! config.project.privateAssets || (config.project.privateAssets && editor.call('permissions:read'))) && currentAsset.get('type') !== 'folder' && (currentAsset.get('source') || downloadable[currentAsset.get('type')] || (! legacyScripts && currentAsset.get('type') === 'script')) && currentAsset.get('file.url'));

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
            if (! currentAsset.get('source') && ['html', 'css', 'json', 'text', 'script', 'shader'].indexOf(currentAsset.get('type')) !== -1) {
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

            if (! currentAsset.get('source')) {
                menuItemExtract.hidden = true;

                // re-import
                var sourceId = currentAsset.get('source_asset_id');
                if (sourceId) {
                    var source = editor.call('assets:get', sourceId)
                    if (source) {
                        if (source.get('type') === 'scene' && ([ 'texture', 'material' ].indexOf(currentAsset.get('type')) !== -1 || ! source.get('meta'))) {
                            menuItemReImport.hidden = true;
                        } else if (currentAsset.get('type') === 'animation' && ! source.get('meta.animation.available')) {
                            menuItemReImport.hidden = true;
                        } else if (currentAsset.get('type') === 'material' && ! currentAsset.has('meta.index')) {
                            menuItemReImport.hidden = true;
                        } else {
                            menuItemReImport.hidden = false;
                        }
                    } else {
                        menuItemReImport.hidden = true;
                    }
                } else {
                    menuItemReImport.hidden = true;
                }

                // references
                var ref = editor.call('assets:used:index')[currentAsset.get('id')];
                if (ref && ref.count && ref.ref) {
                    menuItemReferences.hidden = false;
                    menuItemReplace.hidden = replaceAvailable[currentAsset.get('type')] ? false : true;

                    while(menuItemReferences.innerElement.firstChild)
                        menuItemReferences.innerElement.firstChild.ui.destroy();

                    var menuItems = [ ];

                    var addReferenceItem = function(type, id) {
                        var menuItem = new ui.MenuItem();
                        var item = null;

                        if (type === 'editorSettings') {
                            menuItem.text = 'Scene Settings';
                            menuItem.icon = '&#57652;';
                            item = editor.call('settings:projectUser');
                            if (! item) return;
                        } else {
                            if (type === 'entity') {
                                item = editor.call('entities:get', id);
                                menuItem.icon = '&#57734;';
                            } else if (type === 'asset') {
                                item = editor.call('assets:get', id);
                                menuItem.icon = icons[item.get('type')] || '';
                            }
                            if (! item) return;
                            menuItem.text = item.get('name');
                        }

                        menuItems.push({
                            name: menuItem.text,
                            type: type,
                            element: menuItem
                        });

                        menuItem.on('select', function() {
                            editor.call('selector:set', type, [ item ]);

                            var folder = null;
                            var path = item.get('path') || [ ];
                            if (path.length)
                                folder = editor.call('assets:get', path[path.length - 1]);

                            editor.call('assets:panel:currentFolder', folder);

                            // unfold rendering tab
                            if (type === 'editorSettings') {
                                setTimeout(function() {
                                    editor.call('editorSettings:panel:unfold', 'rendering');
                                }, 0);
                            }
                        });
                    };

                    for(var key in ref.ref)
                        addReferenceItem(ref.ref[key].type, key);

                    var typeSort = {
                        'editorSettings': 1,
                        'asset': 2,
                        'entity': 3
                    };

                    menuItems.sort(function(a, b) {
                        if (a.type !== b.type) {
                            return typeSort[a.type] - typeSort[b.type];
                        } else {
                            if (a.name > b.name) {
                                return 1;
                            } else if (a.name < b.name) {
                                return -1;
                            } else {
                                return 0;
                            }
                        }
                    });

                    for(var i = 0; i < menuItems.length; i++)
                        menuItemReferences.append(menuItems[i].element);
                } else {
                    menuItemReferences.hidden = true;
                    menuItemReplace.hidden = true;
                }
            } else {
                menuItemReferences.hidden = true;
                menuItemReplace.hidden = true;
                menuItemReImport.hidden = true;
                menuItemExtract.hidden = [ 'scene', 'texture', 'textureatlas' ].indexOf(currentAsset.get('type')) === -1 || ! currentAsset.get('meta');
            }
        } else {
            // no asset
            menuItemExtract.hidden = true;
            menuItemReImport.hidden = true;
            menuItemDownload.hidden = true;
            menuItemDuplicate.hidden = true;
            menuItemEdit.hidden = true;
            menuItemDelete.hidden = true;
            menuItemReferences.hidden = true;
            menuItemReplace.hidden = true;
        }

        for(var i = 0; i < customMenuItems.length; i++) {
            if (! customMenuItems[i].filter)
                continue;

            customMenuItems[i].hidden = ! customMenuItems[i].filter(currentAsset);
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

    editor.method('assets:contextmenu:add', function(data) {
        var item = new ui.MenuItem({
            text: data.text,
            icon: data.icon,
            value: data.value
        });

        item.on('select', function() {
            data.select.call(item, currentAsset);
        });

        var parent = data.parent || menu;
        parent.append(item);

        if (data.filter)
            item.filter = data.filter;

        customMenuItems.push(item);

        return item;
    });
});
