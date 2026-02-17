import type { Observer } from '@playcanvas/observer';
import { Menu, MenuItem } from '@playcanvas/pcui';

import { Asset, Entity, type AssetObserver } from '@/editor-api';

import { formatShortcut } from '../../common/utils';

editor.once('load', () => {
    let currentAsset = null;
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    const projectUserSettings = editor.call('settings:projectUser');
    const root = editor.call('layout.root');
    const ctrl = editor.call('hotkey:ctrl:string');

    const LEGACY_SCRIPTS_ID = 'legacyScripts';

    const isModelAsset = (asset: Asset) => {
        const filename = asset.get('file.filename');
        return (filename && String(filename).match(/\.glb$/) !== null) || (asset.get('type') === 'gsplat');
    };

    const isTextureAsset = (asset: Asset) => {
        const type = asset.get('type');
        return type && ['texture', 'textureatlas'].indexOf(type) !== -1;
    };

    // menu
    const menu = new Menu();
    root.append(menu);

    // menu related only to creating assets
    const menuCreate = new Menu();
    if (editor.call('permissions:write')) {
        root.append(menuCreate);
    }

    // edit
    const menuItemNewScript = new MenuItem({
        text: 'New Script',
        icon: 'E208',
        onSelect: () => {
            if (legacyScripts) {
                return;
            }

            editor.call('picker:script-create', (filename) => {
                editor.call('assets:create:script', {
                    filename: filename
                }, (asset: Asset) => {
                    editor.api.globals.selection.set([asset]);
                });
            });
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemNewScript);
    }

    // new asset
    const menuItemNew = new MenuItem({
        text: 'New Asset',
        icon: 'E120'
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemNew);
    }

    // Asset types that are NOT downloadable (via context menu)
    const notDownloadable = new Set([
        'folder',
        'sprite',
        'render',
        'template'
    ]);

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
        SPRITE_ASSET: 'E413',
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
        ITEM_HISTORY: 'E399',
        CUBEMAP: 'E217'
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

    const conversionFormats = {
        'webp': 'WebP',
        'avif': 'AVIF',
        'png': 'PNG',
        'jpeg': 'JPEG'
    };

    if (editor.call('users:hasFlag', 'hasBundles')) {
        assets.bundle = 'Asset Bundle';
        assetCreateCallback.bundle = 'createBundle';
    }

    function isCurrentFolderLegacyScripts() {
        return editor.call('assets:panel:currentFolder') === 'scripts';
    }

    const addNewMenuConvertItem = function (menu: Menu, format: string, title: string) {
        const item = new MenuItem({
            text: title,
            value: conversionFormats[format],
            icon: icons[format] || null,
            onSelect: () => {

                // Get the list of 'Assets' that have been selected in the assets panel
                let assets = editor.api.globals.selection.items.filter(item => item instanceof Asset);

                // If none are selected, check whether `currentAsset` exists and use this instead
                if (assets.length === 0) {
                    assets = [currentAsset];
                }

                assets.forEach((asset: Asset) => {

                    const type = asset.get('type');
                    const meta = asset.get('meta');

                    // Return if not a texture or if attempting to convert to the same format
                    if (type !== 'texture' || !meta.format || meta.format === format) {
                        return;
                    }

                    const id = asset.get('id');

                    // Show a progress indicator as this is an async task
                    asset.set('task', 'running');

                    editor.call('assets:texture:convert', id, format, () => {
                        // Hide progress indicator
                        asset.set('task');
                    });
                });
            }
        });

        item.format = format;
        menu.append(item);
    };

    const addNewMenuItem = function (menu: MenuItem, key: string, title: string) {
        // new folder
        const item = new MenuItem({
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

                const selectAsset = () => {
                    let selectionChanged = false;
                    editor.api.globals.selection.once('change', () => {
                        selectionChanged = true;
                    });
                    return (asset: Asset) => {
                        const isFocusedOnEntity = editor.api.globals.selection.items.some(item => item instanceof Entity);

                        // Reason for skipping the selection can be read here: https://github.com/playcanvas/editor/issues/1063
                        const wouldDisruptWorkflow = isFocusedOnEntity || selectionChanged;

                        if (!wouldDisruptWorkflow) {
                            editor.api.globals.selection.set([asset]);
                        }
                    };
                };

                if (key === 'upload') {
                    editor.call('assets:upload:picker', args);
                } else if (key === 'script') {
                    if (legacyScripts) {
                        editor.call('sourcefiles:new');
                    } else {
                        editor.call('picker:script-create', (filename) => {
                            editor.call('assets:create:script', {
                                filename: filename,
                                parent: folder
                            }, selectAsset());
                        });
                    }
                } else {
                    if (assetCreateCallback[key]) {
                        editor.api.globals.assets[assetCreateCallback[key]]({
                            folder: folder,
                            preload
                        })
                        .then(selectAsset())
                        .catch((err) => {
                            editor.call('status:error', err);
                        });
                    }
                }
            }
        });
        menu.append(item);

        if (key === 'script') {
            editor.on('repositories:load', (repositories) => {
                if (repositories.get('current') !== 'directory') {
                    item.disabled = true;
                }
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
        if (!assets.hasOwnProperty(keys[i])) {
            continue;
        }

        addNewMenuItem(menuItemNew, keys[i], assets[keys[i]]);
        addNewMenuItem(menuCreate, keys[i], assets[keys[i]]);
    }

    // related
    const menuItemReferences = new MenuItem({
        text: 'References',
        icon: ICONS.REFERENCES
    });
    menu.append(menuItemReferences);

    // Create Atlas
    const menuItemTextureToAtlas = new MenuItem({
        text: 'Create Texture Atlas',
        icon: ICONS.TEXTURE_ATLAS,
        onSelect: () => {
            editor.call('assets:textureToAtlas', currentAsset);
        }
    });

    // Create Cubemap
    const menuItemTextureToCubemap = new MenuItem({
        text: 'Create Cubemap',
        icon: ICONS.CUBEMAP,
        onSelect: () => {
            editor.call('assets:textureToCubemap', currentAsset);
        }
    });

    if (editor.call('permissions:write')) {
        menu.append(menuItemTextureToAtlas);
        menu.append(menuItemTextureToCubemap);
    }

    // Create Sprite From Atlas
    const menuItemCreateSprite = new MenuItem({
        text: 'Create Sprite Asset',
        icon: ICONS.SPRITE_ASSET,
        onSelect: () => {
            editor.call('assets:atlasToSprite', {
                asset: currentAsset
            });
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemCreateSprite);
    }

    // Create Sliced Sprite From Atlas
    const menuItemCreateSlicedSprite = new MenuItem({
        text: 'Create Sliced Sprite Asset',
        icon: ICONS.SPRITE_ASSET,
        onSelect: () => {
            editor.call('assets:atlasToSprite', {
                asset: currentAsset,
                sliced: true
            });
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemCreateSlicedSprite);
    }

    // copy
    const menuItemCopy = new MenuItem({
        text: 'Copy',
        icon: ICONS.COPY,
        shortcut: formatShortcut(`${ctrl}+C`),
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
    const menuItemPaste = new MenuItem({
        text: 'Paste',
        icon: ICONS.PASTE,
        shortcut: formatShortcut(`${ctrl}+V`),
        onSelect: () => {
            if (currentAsset && currentAsset.get('type') !== 'folder') {
                return;
            }

            const keepFolderStructure = editor.call('hotkey:shift');
            editor.call('assets:paste', currentAsset === null ? editor.call('assets:panel:currentFolder') : currentAsset, keepFolderStructure);
        }
    });
    menu.append(menuItemPaste);

    // quick-convert
    const menuItemQuickConvert = new MenuItem({
        text: 'Convert',
        icon: ICONS.OPEN_IN_VIEWER,
        onIsVisible: function () {

            // If this is a multiple selection don't limit the transcode options
            if (editor.api.globals.selection.items.length > 1) {
                return;
            }

            // Favor the selection api asset list
            const asset = editor.api.globals.selection.items[0] ?? currentAsset;

            const meta = asset && asset.get('meta');
            if (!meta) {
                return;
            }

            this.domContent.ui.forEachChild((child) => {
                child.enabled = meta.format !== child.format;
            });
        }
    });
    menu.append(menuItemQuickConvert);

    let evtShift = editor.on('hotkey:shift', (shift) => {
        menuItemPaste.text = (shift ? 'Paste (keep folders)' : 'Paste');
    });
    menuItemPaste.once('destroy', () => {
        evtShift.unbind();
        evtShift = null;
    });

    // replace
    const replaceAvailable = new Set([
        'animation',
        'animstategraph',
        'audio',
        'css',
        'cubemap',
        'font',
        'html',
        'json',
        'material',
        'model',
        'render',
        'shader',
        'sprite',
        'text',
        'texture',
        'textureatlas'
    ]);

    const menuItemReplace = new MenuItem({
        text: 'Replace',
        icon: ICONS.REPLACE,
        onSelect: () => {
            editor.call('picker:asset', {
                type: currentAsset.get('type'),
                currentAsset: currentAsset
            });

            let evtPick = editor.once('picker:asset', (asset) => {
                editor.call('assets:replace', currentAsset, asset);
                evtPick = null;
            });

            editor.once('picker:asset:close', () => {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemReplace);
    }

    const menuItemReplaceTextureToSprite = new MenuItem({
        text: 'Convert Texture To Sprite',
        icon: ICONS.SPRITE_ASSET,
        onSelect: () => {
            editor.call('picker:asset', {
                type: 'sprite',
                currentAsset: currentAsset
            });

            let evtPick = editor.once('picker:asset', (asset) => {
                editor.call('assets:replaceTextureToSprite', currentAsset, asset);
                evtPick = null;
            });

            editor.once('picker:asset:close', () => {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemReplaceTextureToSprite);
    }

    // Re-import. Used for both source and target assets.
    const menuItemReImport = new MenuItem({
        text: 'Re-Import',
        icon: ICONS.REIMPORT,
        onSelect: () => {
            editor.call('assets:reimport', currentAsset.get('id'), currentAsset.get('type'));
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemReImport);
    }

    // download
    const menuItemDownload = new MenuItem({
        text: 'Download',
        icon: ICONS.DOWNLOAD,
        onSelect: () => {
            editor.call('assets:download', currentAsset);
        }
    });
    menu.append(menuItemDownload);

    // edit
    const menuItemEdit = new MenuItem({
        text: editor.call('permissions:write') ? 'Edit' : 'View',
        icon: ICONS.EDIT,
        onSelect: () => {
            editor.call('assets:edit', currentAsset);
        }
    });
    menu.append(menuItemEdit);

    // duplicate
    const menuItemDuplicate = new MenuItem({
        text: 'Duplicate',
        icon: ICONS.DUPLICATE,
        onSelect: () => {
            editor.call('assets:duplicate', currentAsset);
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemDuplicate);
    }

    // delete
    const menuItemDelete = new MenuItem({
        text: 'Delete',
        icon: ICONS.DELETE,
        shortcut: formatShortcut('Delete'),
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
    if (editor.call('permissions:write')) {
        menu.append(menuItemDelete);
    }

    // move-to-store
    const menuItemMoveToStore = new MenuItem({
        text: 'Move To Store',
        icon: ICONS.EDIT,
        onSelect: () => {
            editor.call('assets:move-to-store', currentAsset);
        }
    });
    if (editor.call('permissions:write')) {
        menu.append(menuItemMoveToStore);
    }

    // open-in-viewer
    const menuItemOpenInViewer = new MenuItem({
        text: 'Open In Viewer',
        icon: ICONS.OPEN_IN_VIEWER,
        onSelect: () => {
            let assets = editor.api.globals.selection.items.filter(item => item instanceof Asset);
            // If none are selected, use currentAsset instead
            if (assets.length === 0 && currentAsset) {
                assets = [currentAsset];
            }
            if (assets.length > 0) {
                editor.call('assets:open', assets);
            }
        }
    });
    menu.append(menuItemOpenInViewer);

    Object.entries(conversionFormats).forEach(([type, format]) => {
        addNewMenuConvertItem(menuItemQuickConvert, type, format);
    });

    const menuItemHistory = new MenuItem({
        text: 'Item History',
        icon: ICONS.ITEM_HISTORY,
        onIsVisible: () => currentAsset,
        onSelect: () => {
            editor.call('vcgraph:utils', 'launchItemHist', 'assets', currentAsset.get('id'));
        }
    });
    menu.append(menuItemHistory);

    // filter buttons
    menu.on('show', () => {
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
                menuItemPaste.disabled = !clipboard || clipboard.type !== 'asset' || !clipboard.branchId || !clipboard.projectId;
            }

            menuItemCopy.disabled = !currentAsset;
        }

        if (currentAsset) {

            // download
            const hasDownloadPermission = !config.project.privateAssets || (config.project.privateAssets && editor.call('permissions:read'));
            const isDownloadable = currentAsset.get('source') || (!notDownloadable.has(currentAsset.get('type')) && !(legacyScripts && currentAsset.get('type') === 'script'));

            menuItemDownload.hidden = !(hasDownloadPermission && isDownloadable);

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
            menuItemTextureToCubemap.hidden = menuItemTextureToAtlas.hidden;

            // create sprite
            menuItemCreateSprite.hidden = (currentAsset.get('type') !== 'textureatlas' || currentAsset.get('source') || currentAsset.get('task') || !editor.call('permissions:write'));
            menuItemCreateSlicedSprite.hidden = menuItemCreateSprite.hidden;

            // delete
            menuItemDelete.hidden = (currentAsset && currentAsset.get('id') === LEGACY_SCRIPTS_ID);

            // convert
            menuItemQuickConvert.hidden = currentAsset && currentAsset.get('type') !== 'texture';

            if (!currentAsset.get('source')) {
                // re-import (target assets)
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
                    menuItemReplace.hidden = !replaceAvailable.has(currentAsset.get('type'));
                    menuItemReplaceTextureToSprite.hidden = !editor.call('users:hasFlag', 'hasTextureToSprite') || (currentAsset.get('type') !== 'texture');

                    menuItemReferences.clear();

                    const menuItems = [];

                    const addReferenceItem = function (type: string, id: string) {
                        const menuItem = new MenuItem();
                        let item: Observer | null = null;

                        if (type === 'editorSettings') {
                            menuItem.text = 'Scene Settings';
                            menuItem.icon = ICONS.SCENE_SETTINGS;
                            item = projectUserSettings;
                            if (!item) {
                                return;
                            }
                        } else {
                            if (type === 'entity') {
                                item = editor.call('entities:get', id);
                                menuItem.icon = 'E186';
                            } else if (type === 'asset') {
                                item = editor.call('assets:get', id);
                                menuItem.icon = icons[item.get('type')] || '';
                            }
                            if (!item) {
                                return;
                            }
                            menuItem.text = item.get('name');
                        }

                        menuItems.push({
                            name: menuItem.text,
                            type: type,
                            element: menuItem
                        });

                        menuItem.on('select', () => {
                            editor.call('selector:set', type, [item]);

                            if (type === 'asset') {
                                let folder = null;
                                const path = item.get('path') || [];
                                if (path.length) {
                                    folder = editor.call('assets:get', path[path.length - 1]);
                                }

                                editor.call('assets:panel:currentFolder', folder);
                            }

                            // unfold rendering tab
                            if (type === 'editorSettings') {
                                setTimeout(() => {
                                    editor.call('editorSettings:panel:unfold', 'rendering');
                                }, 0);
                            }
                        });
                    };

                    for (const key in ref.ref) {
                        addReferenceItem(ref.ref[key].type, key);
                    }

                    const typeSort = {
                        'editorSettings': 1,
                        'asset': 2,
                        'entity': 3
                    };

                    menuItems.sort((a, b) => {
                        if (a.type !== b.type) {
                            return typeSort[a.type] - typeSort[b.type];
                        }
                        if (a.name > b.name) {
                            return 1;
                        }
                        if (a.name < b.name) {
                            return -1;
                        }
                        return 0;


                    });

                    for (let i = 0; i < menuItems.length; i++) {
                        menuItemReferences.append(menuItems[i].element);
                    }
                } else {
                    menuItemReferences.hidden = true;
                    menuItemReplace.hidden = true;
                    menuItemReplaceTextureToSprite.hidden = true;
                }
            } else {
                // re-import (source assets)
                menuItemReferences.hidden = true;
                menuItemReplace.hidden = true;
                menuItemReplaceTextureToSprite.hidden = true;
                menuItemReImport.hidden = ['scene', 'texture', 'textureatlas'].indexOf(currentAsset.get('type')) === -1 || !currentAsset.get('meta');
            }

            // move-to-store
            menuItemMoveToStore.hidden = !editor.call('users:isSuperUser') || !currentAsset || currentAsset.get('id') === LEGACY_SCRIPTS_ID || (legacyScripts && currentAsset.get('type') === 'script');

            // open-in-viewer - only show when all viewable assets are the same type (all models OR all textures)
            const selectedAssets = editor.api.globals.selection.items.filter(item => item instanceof Asset);
            const assetsToCheck = selectedAssets.length > 0 ? selectedAssets : (currentAsset ? [currentAsset] : []);
            const modelAssets = assetsToCheck.filter(asset => isModelAsset(asset));
            const textureAssets = assetsToCheck.filter(asset => isTextureAsset(asset));
            const hasOnlyModels = modelAssets.length > 0 && textureAssets.length === 0;
            const hasOnlyTextures = textureAssets.length > 0 && modelAssets.length === 0;
            menuItemOpenInViewer.hidden = !(hasOnlyModels || hasOnlyTextures);
        } else {
            // no asset
            menuItemReImport.hidden = true;
            menuItemDownload.hidden = true;
            menuItemDuplicate.hidden = true;
            menuItemEdit.hidden = true;
            menuItemDelete.hidden = true;
            menuItemReferences.hidden = true;
            menuItemReplace.hidden = true;
            menuItemReplaceTextureToSprite.hidden = true;
            menuItemTextureToAtlas.hidden = true;
            menuItemTextureToCubemap.hidden = true;
            menuItemCreateSprite.hidden = true;
            menuItemCreateSlicedSprite.hidden = true;
            menuItemMoveToStore.hidden = true;
            menuItemOpenInViewer.hidden = true;
        }
    });


    // for each asset added
    editor.on('assets:add', (asset: AssetObserver) => {
        // get grid item
        const item = editor.call('assets:panel:get', asset.get('id'));
        if (!item) {
            return;
        }

        const contextMenuHandler = function (evt: MouseEvent) {
            evt.stopPropagation();
            evt.preventDefault();

            currentAsset = asset;
            menu.hidden = false;
            menu.position(evt.clientX + 1, evt.clientY);
        };

        // grid
        item.element.addEventListener('contextmenu', contextMenuHandler, false);

        // tree
        if (item.tree) {
            item.tree.elementTitle.addEventListener('contextmenu', contextMenuHandler, false);
        }
    });

    editor.method('assets:contextmenu:attach', (element: { dom: HTMLElement; on: (event: string, callback: (dom: HTMLElement) => void) => void }, asset: Asset) => {
        const contextMenuHandler = function (evt: MouseEvent) {
            evt.stopPropagation();
            evt.preventDefault();

            currentAsset = asset;
            menu.hidden = false;
            menu.position(evt.clientX + 1, evt.clientY);
        };

        element.dom.addEventListener('contextmenu', contextMenuHandler);

        element.on('destroy', (dom) => {
            dom.removeEventListener('contextmenu', contextMenuHandler);
        });
    });

    // Show the context menu for a given asset at the specified position
    editor.method('assets:contextmenu:show', (asset: Asset, x: number, y: number) => {
        currentAsset = asset;
        menu.hidden = false;
        menu.position(x + 1, y);
    });

    editor.method('assets:contextmenu:create', () => {
        return menuCreate;
    });

    editor.on('sourcefiles:add', (asset: Observer) => {
        // get grid item
        const item = editor.call('assets:panel:get', asset.get('filename'));
        if (!item) {
            return;
        }

        // attach contextmenu event
        item.element.addEventListener('contextmenu', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();

            currentAsset = asset;
            menu.hidden = false;
            menu.position(evt.clientX + 1, evt.clientY);
        });
    });

    function createCustomContextMenu(data, parent) {
        const item = new MenuItem({
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
            data.items.forEach((child: { text: string; icon?: string; onIsVisible?: (asset: AssetObserver | null) => boolean; onSelect?: (asset: AssetObserver | null) => void; items?: unknown[] }) => createCustomContextMenu(child, item));
        }

        parent.append(item);

        return item;
    }

    editor.method('assets:contextmenu:add', (data: {
        text: string;
        icon?: string;
        items?: Array<{ text: string; icon?: string; onIsVisible?: (asset: AssetObserver | null) => boolean; onSelect?: (asset: AssetObserver | null) => void; items?: unknown[] }>;
        onIsVisible?: (asset: AssetObserver | null) => boolean;
        onSelect?: (asset: AssetObserver | null) => void;
    }) => {
        return createCustomContextMenu(data, menu);
    });
});
