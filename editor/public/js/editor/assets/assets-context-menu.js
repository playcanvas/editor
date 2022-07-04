editor.once('load', function () {
    'use strict';

    let currentAsset = null;
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    const projectUserSettings = editor.call('settings:projectUser');
    const root = editor.call('layout.root');

    const LEGACY_SCRIPTS_ID = 'legacyScripts';

    const isGlbAsset = (asset) => {
        const filename = asset.get('file.filename');
        return filename && String(filename).match(/\.glb$/) !== null;
    };

    const isTextureAsset = (asset) => {
        const type = asset.get('type');
        return type && ['texture', 'textureatlas'].indexOf(type) !== -1;
    };

    // menu
    const menu = new pcui.Menu();
    root.append(menu);

    // menu related only to creating assets
    const menuCreate = new pcui.Menu();
    if (editor.call('permissions:write')) root.append(menuCreate);

    // edit
    const menuItemNewScript = new pcui.MenuItem({
        text: 'New Script',
        icon: 'E208',
        onSelect: () => {
            if (legacyScripts) return;

            editor.call('picker:script-create', function (filename) {
                editor.assets.createScript({
                    folder: folder,
                    filename: filename
                })
                .then((asset) => {
                    editor.selection.set([asset]);
                })
                .catch(err => {
                    editor.call('status:error', err);
                });
            });
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemNewScript);

    // new asset
    const menuItemNew = new pcui.MenuItem({
        text: 'New Asset',
        icon: 'E120'
    });
    if (editor.call('permissions:write')) menu.append(menuItemNew);

    const downloadable = {
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

    const icons = {
        'upload': 'E235',
        'folder': 'E139',
        'css': 'E208',
        'cubemap': 'E217',
        'html': 'E208',
        'json': 'E208',
        'layers': 'E288',
        'material': 'E195',
        'font': 'E406',
        'script': 'E208',
        'shader': 'E208',
        'text': 'E208',
        'texture': 'E201',
        'textureatlas': 'E201',
        'model': 'E187',
        'scene': 'E187',
        'animation': 'E213',
        'audio': 'E210',
        'bundle': 'E410',
        'animstategraph': 'E412'
    };

    const ICONS = {
        REFERENCES: 'E116',
        TEXTURE_ATLAS: 'E332',
        SPRITE_ASSET: 'E395',
        COPY: 'E351',
        PASTE: 'E348',
        REPLACE: 'E128',
        REIMPORT: 'E221',
        DOWNLOAD: 'E228',
        EDIT: 'E130',
        DUPLICATE: 'E126',
        DELETE: 'E124',
        SCENE_SETTINGS: 'E134',
        OPEN_IN_VIEWER: 'E117',
        ITEM_HISTORY: 'E399'
    };

    const assets = {
        'upload': 'Upload',
        'folder': 'Folder',
        'css': 'CSS',
        'cubemap': 'CubeMap',
        'html': 'HTML',
        'json': 'JSON',
        'material': 'Material',
        'script': 'Script',
        'shader': 'Shader',
        'text': 'Text',
        'animstategraph': 'Anim State Graph'
    };

    const assetCreateCallback = {
        'folder': 'createFolder',
        'css': 'createCss',
        'cubemap': 'createCubemap',
        'html': 'createHtml',
        'json': 'createJson',
        'material': 'createMaterial',
        'script': 'createScript',
        'shader': 'createShader',
        'text': 'createText',
        'animstategraph': 'createAnimStateGraph'
    };

    if (editor.call('users:hasFlag', 'hasBundles')) {
        assets.bundle = 'Asset Bundle';
        assetCreateCallback.bundle = 'createBundle';
    }

    function isCurrentFolderLegacyScripts() {
        return editor.call('assets:panel:currentFolder') === 'scripts';
    }

    const addNewMenuItem = function (menu, key, title) {
        // new folder
        const item = new pcui.MenuItem({
            text: title,
            icon: icons[key] || null,
            onSelect: () => {
                const args = {};
                const preload = projectUserSettings.get('editor.pipeline.defaultAssetPreload');
                let folder = null;

                if (currentAsset && currentAsset.get('type') === 'folder') {
                    args.parent = currentAsset;
                    folder = currentAsset.apiAsset;
                } else if (currentAsset === undefined) {
                    args.parent = null;
                }

                if (!folder) {
                    folder = editor.call('assets:panel:currentFolder');
                    if (folder) {
                        folder = folder.apiAsset;
                    }
                }

                if (key === 'upload') {
                    editor.call('assets:upload:picker', args);
                } else if (key === 'script') {
                    if (legacyScripts) {
                        editor.call('sourcefiles:new');
                    } else {
                        editor.call('picker:script-create', function (filename) {
                            editor.assets.createScript({
                                filename: filename,
                                folder: folder
                            })
                            .then((asset) => {
                                editor.selection.set([asset]);
                            })
                            .catch(err => {
                                editor.call('status:error', err);
                            });
                        });
                    }
                } else {
                    if (assetCreateCallback[key]) {
                        editor.assets[assetCreateCallback[key]]({
                            folder: folder,
                            preload
                        })
                        .then((asset) => {
                            editor.selection.set([asset]);
                        })
                        .catch(err => {
                            editor.call('status:error', err);
                        });
                    }
                }
            }
        });
        menu.append(item);

        if (key === 'script') {
            editor.on('repositories:load', function (repositories) {
                if (repositories.get('current') !== 'directory')
                    item.disabled = true;
            });
        }
    };

    const keys = Object.keys(assets);
    if (legacyScripts) {
        const scriptsIdx = keys.indexOf('script');
        if (scriptsIdx !== -1) {
            keys.splice(scriptsIdx, 1);
        }
    }
    for (let i = 0; i < keys.length; i++) {
        if (!assets.hasOwnProperty(keys[i]))
            continue;

        addNewMenuItem(menuItemNew, keys[i], assets[keys[i]]);
        addNewMenuItem(menuCreate, keys[i], assets[keys[i]]);
    }


    // related
    const menuItemReferences = new pcui.MenuItem({
        text: 'References',
        icon: ICONS.REFERENCES
    });
    menu.append(menuItemReferences);

    // Create Atlas
    const menuItemTextureToAtlas = new pcui.MenuItem({
        text: 'Create Texture Atlas',
        icon: ICONS.TEXTURE_ATLAS,
        onSelect: () => {
            editor.call('assets:textureToAtlas', currentAsset);
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemTextureToAtlas);

    // Create Sprite From Atlas
    const menuItemCreateSprite = new pcui.MenuItem({
        text: 'Create Sprite Asset',
        icon: ICONS.SPRITE_ASSET,
        onSelect: () => {
            editor.call('assets:atlasToSprite', {
                asset: currentAsset
            });
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemCreateSprite);

    // Create Sliced Sprite From Atlas
    const menuItemCreateSlicedSprite = new pcui.MenuItem({
        text: 'Create Sliced Sprite Asset',
        icon: ICONS.SPRITE_ASSET,
        onSelect: () => {
            editor.call('assets:atlasToSprite', {
                asset: currentAsset,
                sliced: true
            });
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemCreateSlicedSprite);

    // copy
    const menuItemCopy = new pcui.MenuItem({
        text: 'Copy',
        icon: ICONS.COPY,
        onSelect: () => {
            const asset = currentAsset;
            let multiple = false;

            if (asset) {
                const type = editor.call('selector:type');
                let items;

                if (type === 'asset') {
                    items = editor.call('selector:items');
                    for (let i = 0; i < items.length; i++) {
                        // if the asset that was right-clicked is in the selection
                        // then include all the other selected items
                        // otherwise only copy the right-clicked item
                        if (items[i].get('id') === asset.get('id')) {
                            multiple = true;
                            break;
                        }
                    }
                }

                editor.call('assets:copy', multiple ? items : [asset]);
            }
        }
    });
    menu.append(menuItemCopy);

    // paste
    // copy
    const menuItemPaste = new pcui.MenuItem({
        text: 'Paste',
        icon: ICONS.PASTE,
        onSelect: () => {
            if (currentAsset && currentAsset.get('type') !== 'folder') return;

            const keepFolderStructure = editor.call('hotkey:shift');
            editor.call('assets:paste', currentAsset === null ? editor.call('assets:panel:currentFolder') : currentAsset, keepFolderStructure);
        }
    });
    menu.append(menuItemPaste);

    let evtShift = editor.on('hotkey:shift', (shift) => {
        menuItemPaste.text = (shift ? 'Paste (keep folders)' : 'Paste');
    });
    menuItemPaste.once('destroy', () => {
        evtShift.unbind();
        evtShift = null;
    });

    // replace
    const replaceAvailable = {
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
        'sprite': true,
        'json': true,
        'text': true,
        'animstategraph': true,
        'font': true
    };
    const menuItemReplace = new pcui.MenuItem({
        text: 'Replace',
        icon: ICONS.REPLACE,
        onSelect: () => {
            editor.call('picker:asset', {
                type: currentAsset.get('type'),
                currentAsset: currentAsset
            });

            let evtPick = editor.once('picker:asset', function (asset) {
                editor.call('assets:replace', currentAsset, asset);
                evtPick = null;
            });

            editor.once('picker:asset:close', function () {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemReplace);

    const menuItemReplaceTextureToSprite = new pcui.MenuItem({
        text: 'Convert Texture To Sprite',
        icon: ICONS.SPRITE_ASSET,
        onSelect: () => {
            editor.call('picker:asset', {
                type: 'sprite',
                currentAsset: currentAsset
            });

            let evtPick = editor.once('picker:asset', function (asset) {
                editor.call('assets:replaceTextureToSprite', currentAsset, asset);
                evtPick = null;
            });

            editor.once('picker:asset:close', function () {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemReplaceTextureToSprite);

    // todo: xdu.
    // todo: merge these 2 items.

    // extract. Used for source assets.
    const menuItemExtract = new pcui.MenuItem({
        text: 'Re-Import',
        icon: ICONS.REIMPORT,
        onSelect: () => {
            editor.call('assets:reimport', currentAsset.get('id'), currentAsset.get('type'));
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemExtract);

    // re-import. Used for target assets.
    const menuItemReImport = new pcui.MenuItem({
        text: 'Re-Import',
        icon: ICONS.REIMPORT,
        onSelect: () => {
            editor.call('assets:reimport', currentAsset.get('id'), currentAsset.get('type'));
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemReImport);

    // download
    const menuItemDownload = new pcui.MenuItem({
        text: 'Download',
        icon: ICONS.DOWNLOAD,
        onSelect: () => {
            window.open(currentAsset.get('file.url'));
        }
    });
    menu.append(menuItemDownload);

    // edit
    const menuItemEdit = new pcui.MenuItem({
        text: editor.call('permissions:write') ? 'Edit' : 'View',
        icon: ICONS.EDIT,
        onSelect: () => {
            editor.call('assets:edit', currentAsset);
        }
    });
    menu.append(menuItemEdit);

    // duplicate
    const menuItemDuplicate = new pcui.MenuItem({
        text: 'Duplicate',
        icon: ICONS.DUPLICATE,
        onSelect: () => {
            editor.call('assets:duplicate', currentAsset);
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemDuplicate);

    // delete
    const menuItemDelete = new pcui.MenuItem({
        text: 'Delete',
        icon: ICONS.DELETE,
        onSelect: () => {
            const asset = currentAsset;
            let multiple = false;

            if (asset) {
                const type = editor.call('selector:type');
                let items;

                if (type === 'asset') {
                    items = editor.call('selector:items');
                    for (let i = 0; i < items.length; i++) {
                        const assetType = items[i].get('type');
                        // if the asset that was right-clicked is in the selection
                        // then include all the other selected items in the delete
                        // otherwise only delete the right-clicked item
                        if (assetType === 'script' && legacyScripts) {
                            if (items[i].get('filename') === asset.get('filename')) {
                                multiple = true;
                                break;
                            }
                        } else if (items[i].get('id') === asset.get('id')) {
                            multiple = true;
                            break;
                        }
                    }
                }

                editor.call('assets:delete:picker', multiple ? items : [asset]);
            }
        }

    });
    if (editor.call('permissions:write')) menu.append(menuItemDelete);

    // move-to-store
    const menuItemMoveToStore = new pcui.MenuItem({
        text: 'Move To Store',
        icon: ICONS.EDIT,
        onSelect: () => {
            editor.call('assets:move-to-store', currentAsset);
        }
    });
    if (editor.call('permissions:write')) menu.append(menuItemMoveToStore);

    // open-in-viewer
    const menuItemOpenInViewer = new pcui.MenuItem({
        text: 'Open In Viewer',
        icon: ICONS.OPEN_IN_VIEWER,
        onSelect: () => {
            const hostname = window.location.hostname;
            const fileUrl = currentAsset.get('file.url');
            const loadParam = encodeURIComponent(`https://${hostname}${fileUrl}`);
            if (isGlbAsset(currentAsset)) {
                window.open(`/model-viewer?load=${loadParam}`);
            } else {
                window.open(`/texture-tool?load=${loadParam}`);
            }
        }
    });
    menu.append(menuItemOpenInViewer);

    const menuItemHistory = new pcui.MenuItem({
        text: 'Item History',
        icon: ICONS.ITEM_HISTORY,
        onIsVisible: () => currentAsset,
        onSelect: () => {
            editor.call('vcgraph:utils', 'launchItemHist', 'assets', currentAsset.get('id'));
        }
    });
    menu.append(menuItemHistory);

    // filter buttons
    menu.on('show', function () {
        if (currentAsset && currentAsset.get('id') === LEGACY_SCRIPTS_ID) {
            menuItemNewScript.hidden = false;
            if (menuItemPaste) {
                menuItemPaste.hidden = true;
                menuItemCopy.hidden = true;
            }
        } else {
            menuItemNewScript.hidden = !((currentAsset === null || (currentAsset && currentAsset.get('type') === 'script')) && isCurrentFolderLegacyScripts());

            if (menuItemPaste) {
                menuItemPaste.hidden = false;
                menuItemCopy.hidden = false;
            }
        }
        menuItemNew.hidden = !menuItemNewScript.hidden;

        if (legacyScripts) {
            menuItemNewScript.hidden = true;
        }

        if (menuItemPaste && isCurrentFolderLegacyScripts()) {
            menuItemPaste.hidden = true;
            menuItemCopy.hidden = true;
        }

        if (menuItemPaste) {
            if (!editor.call('permissions:write')) {
                menuItemPaste.disabled = true;
            } else if (currentAsset && currentAsset.get('type') !== 'folder') {
                menuItemPaste.disabled = true;
            } else {
                const clipboard = editor.call('clipboard:get');
                menuItemPaste.disabled = !clipboard || clipboard.type !== 'asset';
            }

            menuItemCopy.disabled = !currentAsset;
        }

        if (currentAsset) {

            // download
            menuItemDownload.hidden = !((!config.project.privateAssets || (config.project.privateAssets && editor.call('permissions:read'))) && currentAsset.get('type') !== 'folder' && (currentAsset.get('source') || downloadable[currentAsset.get('type')] || (!legacyScripts && currentAsset.get('type') === 'script')) && currentAsset.get('file.url'));

            // duplicate
            if (currentAsset.get('type') === 'material' || currentAsset.get('type') === 'sprite') {
                menuItemEdit.hidden = true;
                if (editor.call('selector:type') === 'asset') {
                    const items = editor.call('selector:items');
                    menuItemDuplicate.hidden = (items.length > 1 && items.indexOf(currentAsset) !== -1);
                } else {
                    menuItemDuplicate.hidden = false;
                }
            } else {
                menuItemDuplicate.hidden = true;
            }

            // edit
            if (!currentAsset.get('source') && ['html', 'css', 'json', 'text', 'script', 'shader'].indexOf(currentAsset.get('type')) !== -1) {
                if (editor.call('selector:type') === 'asset') {
                    const items = editor.call('selector:items');
                    menuItemEdit.hidden = (items.length > 1 && items.indexOf(currentAsset) !== -1);
                } else {
                    menuItemEdit.hidden = false;
                }
            } else {
                menuItemEdit.hidden = true;
            }

            // create atlas
            menuItemTextureToAtlas.hidden = (currentAsset.get('type') !== 'texture' || currentAsset.get('source') || currentAsset.get('task') || !editor.call('permissions:write'));

            // create sprite
            menuItemCreateSprite.hidden = (currentAsset.get('type') !== 'textureatlas' || currentAsset.get('source') || currentAsset.get('task') || !editor.call('permissions:write'));
            menuItemCreateSlicedSprite.hidden = menuItemCreateSprite.hidden;

            // delete
            menuItemDelete.hidden = (currentAsset && currentAsset.get('id') === LEGACY_SCRIPTS_ID);

            if (!currentAsset.get('source')) {
                menuItemExtract.hidden = true;

                // re-import
                const sourceId = currentAsset.get('source_asset_id');
                if (sourceId) {
                    const source = editor.call('assets:get', sourceId);
                    if (source) {
                        if (source.get('type') === 'scene' && (['texture', 'material'].indexOf(currentAsset.get('type')) !== -1 || !source.get('meta'))) {
                            menuItemReImport.hidden = true;
                        } else if (currentAsset.get('type') === 'animation' && !source.get('meta.animation.available')) {
                            menuItemReImport.hidden = true;
                        } else if (currentAsset.get('type') === 'material' && !currentAsset.has('meta.index')) {
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
                const ref = editor.call('assets:used:index')[currentAsset.get('id')];
                if (ref && ref.count && ref.ref) {
                    menuItemReferences.hidden = false;
                    menuItemReplace.hidden = !replaceAvailable[currentAsset.get('type')];
                    menuItemReplaceTextureToSprite.hidden = !editor.call('users:hasFlag', 'hasTextureToSprite') || (currentAsset.get('type') !== 'texture');

                    menuItemReferences.clear();

                    const menuItems = [];

                    const addReferenceItem = function (type, id) {
                        const menuItem = new pcui.MenuItem();
                        let item = null;

                        if (type === 'editorSettings') {
                            menuItem.text = 'Scene Settings';
                            menuItem.icon = ICONS.SCENE_SETTINGS;
                            item = projectUserSettings;
                            if (!item) return;
                        } else {
                            if (type === 'entity') {
                                item = editor.call('entities:get', id);
                                menuItem.icon = 'E186';
                            } else if (type === 'asset') {
                                item = editor.call('assets:get', id);
                                menuItem.icon = icons[item.get('type')] || '';
                            }
                            if (!item) return;
                            menuItem.text = item.get('name');
                        }

                        menuItems.push({
                            name: menuItem.text,
                            type: type,
                            element: menuItem
                        });

                        menuItem.on('select', function () {
                            editor.call('selector:set', type, [item]);

                            if (type === 'asset') {
                                let folder = null;
                                const path = item.get('path') || [];
                                if (path.length)
                                    folder = editor.call('assets:get', path[path.length - 1]);

                                editor.call('assets:panel:currentFolder', folder);
                            }

                            // unfold rendering tab
                            if (type === 'editorSettings') {
                                setTimeout(function () {
                                    editor.call('editorSettings:panel:unfold', 'rendering');
                                }, 0);
                            }
                        });
                    };

                    for (const key in ref.ref)
                        addReferenceItem(ref.ref[key].type, key);

                    const typeSort = {
                        'editorSettings': 1,
                        'asset': 2,
                        'entity': 3
                    };

                    menuItems.sort(function (a, b) {
                        if (a.type !== b.type) {
                            return typeSort[a.type] - typeSort[b.type];
                        }
                        if (a.name > b.name) {
                            return 1;
                        } else if (a.name < b.name) {
                            return -1;
                        }
                        return 0;


                    });

                    for (let i = 0; i < menuItems.length; i++)
                        menuItemReferences.append(menuItems[i].element);
                } else {
                    menuItemReferences.hidden = true;
                    menuItemReplace.hidden = true;
                    menuItemReplaceTextureToSprite.hidden = true;
                }
            } else {
                menuItemReferences.hidden = true;
                menuItemReplace.hidden = true;
                menuItemReplaceTextureToSprite.hidden = true;
                menuItemReImport.hidden = true;
                menuItemExtract.hidden = ['scene', 'texture', 'textureatlas'].indexOf(currentAsset.get('type')) === -1 || !currentAsset.get('meta');
            }

            // move-to-store
            menuItemMoveToStore.hidden = !editor.call("users:isSuperUser") || !currentAsset || currentAsset.get('id') === LEGACY_SCRIPTS_ID || (legacyScripts && currentAsset.get('type') === 'script');

            // open-in-viewer
            menuItemOpenInViewer.hidden = !currentAsset || !(isGlbAsset(currentAsset) || isTextureAsset(currentAsset));
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
            menuItemReplaceTextureToSprite.hidden = true;
            menuItemTextureToAtlas.hidden = true;
            menuItemCreateSprite.hidden = true;
            menuItemCreateSlicedSprite.hidden = true;
            menuItemMoveToStore.hidden = true;
            menuItemOpenInViewer.hidden = true;
        }
    });


    // for each asset added
    editor.on('assets:add', function (asset) {
        // get grid item
        const item = editor.call('assets:panel:get', asset.get('id'));
        if (!item) return;

        const contextMenuHandler = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            currentAsset = asset;
            menu.hidden = false;
            menu.position(evt.clientX + 1, evt.clientY);
        };

        // grid
        item.element.addEventListener('contextmenu', contextMenuHandler, false);

        // tree
        if (item.tree)
            item.tree.elementTitle.addEventListener('contextmenu', contextMenuHandler, false);
    });

    editor.method('assets:contextmenu:attach', function (element, asset) {
        const contextMenuHandler = function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            currentAsset = asset;
            menu.hidden = false;
            menu.position(evt.clientX + 1, evt.clientY);
        };

        element.dom.addEventListener('contextmenu', contextMenuHandler);

        element.on('destroy', dom => {
            dom.removeEventListener('contextmenu', contextMenuHandler);
        });
    });

    editor.method('assets:contextmenu:create', function () {
        return menuCreate;
    });

    editor.on('sourcefiles:add', function (asset) {
        // get grid item
        const item = editor.call('assets:panel:get', asset.get('filename'));
        if (!item) return;

        // attach contextmenu event
        item.element.addEventListener('contextmenu', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            currentAsset = asset;
            menu.hidden = false;
            menu.position(evt.clientX + 1, evt.clientY);
        });
    });

    function createCustomContextMenu(data, parent) {
        const item = new pcui.MenuItem({
            text: data.text,
            icon: data.icon,
            onIsVisible: () => {
                if (data.onIsVisible) {
                    return data.onIsVisible.call(item, currentAsset);
                }

                return true;
            },
            onSelect: () => {
                if (data.onSelect) {
                    data.onSelect.call(item, currentAsset);
                }
            }
        });

        if (data.items) {
            data.items.forEach(child => createCustomContextMenu(child, item));
        }

        parent.append(item);

        return item;
    }

    editor.method('assets:contextmenu:add', function (data) {
        return createCustomContextMenu(data, menu);
    });
});
