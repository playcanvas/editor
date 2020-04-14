Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-panel';
    const CLASS_FOLDERS = CLASS_ROOT + '-folders';
    const CLASS_CURRENT_FOLDER = CLASS_ROOT + '-current-folder';
    const CLASS_ASSET_HIGHLIGHTED = CLASS_ROOT + '-highlighted-asset';
    const CLASS_DETAILS_NAME = CLASS_ROOT + '-details-name';

    const TYPES = {
        animation: 'Animation',
        audio: 'Audio',
        bundle: 'Asset Bundle',
        binary: 'Binary',
        cubemap: 'Cubemap',
        css: 'Css',
        font: 'Font',
        folderSource: 'Folder',
        json: 'Json',
        html: 'Html',
        material: 'Material',
        model: 'Model',
        sceneSource: 'Model (source)',
        script: 'Script',
        shader: 'Shader',
        sprite: 'Sprite',
        template: 'Template',
        text: 'Text',
        texture: 'Texture',
        textureSource: 'Texture (source)',
        textureatlas: 'Texture Atlas',
        textureatlasSource: 'Texture Atlas (source)'
    };

    const DBL_CLICKABLES = {
        folder: true,
        css: true,
        json: true,
        html: true,
        script: true,
        shader: true,
        sprite: true,
        text: true,
        textureatlas: true
    };

    const HOVERABLES = {
        folder: true,
        bundle: true
    };

    class AssetPanel extends pcui.Panel {
        constructor(args) {
            args = Object.assign({
                headerText: 'ASSETS'
            }, args);

            args.flex = true;
            args.flexDirection = 'row';

            super(args);

            this.class.add(CLASS_ROOT);

            // folders tree view
            this._containerFolders = new pcui.Container({
                class: CLASS_FOLDERS,
                resizable: 'right',
                resizeMin: 100,
                resizeMax: 300,
                width: 200,
                scrollable: true
            });
            this.append(this._containerFolders);

            this._foldersView = new pcui.TreeView({
                allowReordering: false,
                onReparent: this._onFolderTreeReparent.bind(this)
            });
            this._containerFolders.append(this._foldersView);

            this._foldersView.on('select', this._onFolderTreeSelect.bind(this));
            this._foldersView.on('deselect', this._onFolderTreeDeselect.bind(this));
            this._foldersView.on('dragstart', this._onFolderTreeDragStart.bind(this));

            // root element
            this._foldersViewRoot = new pcui.TreeViewItem({
                text: '/'
            });
            this._foldersViewRoot.on('hover', this._onRootFolderHover.bind(this));
            this._foldersViewRoot.on('hoverend', this._onRootFolderHoverEnd.bind(this));
            this._foldersViewRoot.open = true;
            this._foldersView.append(this._foldersViewRoot);

            this._foldersIndex = {};
            this._foldersWaitingParent = {};

            // the asset we are currently hovering over
            // undefined means nothing
            // null means root folder
            // otherwise this will be an asset
            this._hoveredAsset = undefined;
            this._eventsDropManager = [];
            if (args.dropManager) {
                this.dropManager = args.dropManager;
            }

            // table view
            this._detailsView = new pcui.Table({
                scrollable: true,
                columns: [{
                    title: 'Name',
                    sortKey: 'name'
                }, {
                    title: 'Type',
                    sortKey: 'type'
                }, {
                    title: 'Size',
                    sortKey: 'file.size'
                }],
                createRowFn: this._createDetailsViewRow.bind(this),
                filterFn: this._filterAssetRow.bind(this)
            });
            this.append(this._detailsView);

            this._rowsIndex = {};

            this._suspendSelectEvents = false;
            this._detailsView.on('select', this._onSelectRow.bind(this));
            this._detailsView.on('deselect', this._onDeselectRow.bind(this));

            this._eventsEditor = [];
            this._eventsEditor.push(editor.on('selector:change', this._onSelectorChange.bind(this)));

            this._assetListEvents = [];

            this._assetEvents = {};

            this.currentFolder = null;

            this._selector = {
                type: null,
                items: [],
                prevType: null,
                prevItems: []
            };

            if (args.assets) {
                this.assets = args.assets;
            }

            // freeze initial width
            // this.on('parent', parent => {
            //     if (parent && this.width) {
            //         console.log(this.width);
                    // this._detailsView.table.width = this.width;
                // }
            // });
        }

        _onAssetDblClick(evt, asset) {
            evt.stopPropagation();
            evt.preventDefault();

            const type = asset.get('type');
            if (type === 'folder') {
                this.currentFolder = asset;

                // restore previous selection after
                // double clicking into a folder
                if (this._selector.prevItems) {
                    editor.call('selector:set', this._selector.prevType, this._selector.prevItems);
                }
            } else if (type === 'sprite' || type === 'textureatlas') {
                editor.call('picker:sprites', asset);
            } else if (type === 'css' ||
                       type === 'html' ||
                       type === 'json' ||
                       type === 'script' ||
                       type === 'shader' ||
                       type === 'text') {

                if (type === 'script' && config.project.settings.useLegacyScripts) {
                    window.open('/editor/code/' + config.project.id + '/' + asset.get('filename'));
                } else if (!config.project.settings.useLegacyScripts) {
                    editor.call('picker:codeeditor', asset);
                } else {
                    window.open('/editor/asset/' + asset.get('id'), asset.get('id')).focus();
                }
            }

        }

        _onDeactivateDropManager() {
            this._setHoveredAsset(undefined);
        }

        _onAssetDropFilter(type) {
            return type.startsWith('asset');
        }

        _onAssetDrop(type, data) {
            if (this._hoveredAsset === undefined || ! type || ! type.startsWith('asset'))
                return;

            const items = editor.call('selector:items');
            var assets = [];

            const addAsset = (id) => {
                const asset = this._assets.get(id);

                // deselect moved asset
                if (items.indexOf(asset) !== -1)
                    editor.call('selector:remove', asset);

                assets.push(asset);
            };

            if (data.ids) {
                data.ids.forEach(addAsset);
            } else {
                addAsset(data.id);
            }

            const hoveredType = this._hoveredAsset ? this._hoveredAsset.get('type') : 'folder';
            if (hoveredType === 'folder') {
                editor.call('assets:fs:move', assets, this._hoveredAsset);
            } else if (hoveredType === 'bundle') {
                editor.call('assets:bundles:addAssets', assets, this._hoveredAsset);
            }
        }

        _onAssetDragStart(evt, asset) {
            if (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            if (! editor.call('permissions:write') || !this._dropManager) return;

            let type = 'asset.' + asset.get('type');
            let data = {
                id: asset.get('id')
            };

            const selectorType = editor.call('selector:type');
            const selectorItems = editor.call('selector:items');

            if (selectorType === 'asset' && selectorItems.length > 1) {
                const path = selectorItems[0].get('path');

                if (selectorItems.indexOf(asset) !== -1) {
                    const ids = [];
                    for (let i = 0; i < selectorItems.length; i++) {
                        // don't allow multi-path dragging
                        const curPath = selectorItems[i].get('path');
                        if (path.length !== curPath.length || path[path.length - 1] !== curPath[path.length - 1]) {
                            return;
                        }

                        ids.push(parseInt(selectorItems[i].get('id'), 10));
                    }

                    type = 'assets';
                    data = {
                        ids: ids
                    };
                }
            }

            this._dropManager.dropType = type;
            this._dropManager.dropData = data;
            this._dropManager.active = true;
        }

        _onRootFolderHover() {
            if (this._hoveredAsset === null) return;
            if (!this._dropManager || !this._dropManager.active || !this._dropManager.dropData) return;

            const dropData = this._dropManager.dropData;

            // check if dragged assets are already in root folder
            const draggedAsset = this._assets.get(dropData.id || dropData.ids[0]);
            if (draggedAsset) {
                if (draggedAsset.get('path').length === 0) {
                    return;
                }
            }

            this._setHoveredAsset(null);
        }

        _onRootFolderHoverEnd() {
            if (this._hoveredAsset === null) {
                this._setHoveredAsset(undefined);
            }
        }

        _onAssetHover(asset) {
            if (this._hoveredAsset === asset) return;
            if (!this._dropManager || !this._dropManager.active || !this._dropManager.dropData) return;

            const hoveredType = asset.get('type');
            if (!HOVERABLES[hoveredType]) return;

            const hoveredAssetId = parseInt(asset.get('id'), 10);
            const dropData = this._dropManager.dropData;

            if (dropData.ids) {
                // do not allow dragging on itself
                if (dropData.ids.indexOf(hoveredAssetId) !== -1) {
                    return;
                }
            } else if (dropData.id) {
                // do not allow dragging on itself
                if (parseInt(dropData.id, 10) === hoveredAssetId) {
                    return;
                }
            } else {
                return;
            }

            // check if dragged assets are already in this folder
            const draggedAsset = this._assets.get(dropData.id || dropData.ids[0]);
            if (draggedAsset) {
                const path = draggedAsset.get('path');
                if (path.length && path[path.length - 1] === hoveredAssetId) {
                    return;
                }
            }

            // do not allow dragging a folder into one of its child folders
            const hoveredPath = asset.get('path');
            if (dropData.ids) {
                for (let i = 0; i < dropData.ids.length; i++) {
                    if (hoveredPath.indexOf(dropData.ids[i]) !== -1) {
                        return;
                    }
                }
            } else {
                if (hoveredPath.indexOf(parseInt(dropData.id, 10)) !== -1) {
                    return;
                }
            }

            this._setHoveredAsset(asset);
        }

        _setHoveredAsset(asset) {
            if (this._hoveredAsset === asset) return;

            if (this._hoveredAsset !== undefined) {
                if (this._hoveredAsset) {
                    const row = this._rowsIndex[this._hoveredAsset.get('id')];
                    if (row) {
                        row.class.remove(CLASS_ASSET_HIGHLIGHTED);
                    }
                }

                const folder = this._hoveredAsset ? this._foldersIndex[this._hoveredAsset.get('id')] : this._foldersViewRoot;
                if (folder) {
                    folder.class.remove(CLASS_ASSET_HIGHLIGHTED);
                    this._foldersView.showDragHandle(null);
                }
            }

            this._hoveredAsset = asset;

            if (this._hoveredAsset !== undefined) {
                if (this._hoveredAsset) {
                    const row = this._rowsIndex[this._hoveredAsset.get('id')];
                    if (row) {
                        row.class.add(CLASS_ASSET_HIGHLIGHTED);
                    }
                }

                const folder = this._hoveredAsset ? this._foldersIndex[this._hoveredAsset.get('id')] : this._foldersViewRoot;
                if (folder) {
                    folder.class.add(CLASS_ASSET_HIGHLIGHTED);
                    this._foldersView.showDragHandle(folder);
                }
            }
        }

        _onAssetHoverEnd(asset) {
            if (this._hoveredAsset === asset) {
                this._setHoveredAsset(undefined);
            }
        }

        _createDetailsViewRow(asset) {
            const row = new pcui.TableRow();

            row.asset = asset;

            this._rowsIndex[asset.get('id')] = row;

            let domDblClick;

            // folder dbl click
            if (DBL_CLICKABLES[asset.get('type')]) {
                domDblClick = (evt) => this._onAssetDblClick(evt, asset);
                row.dom.addEventListener('dblclick', domDblClick);
            }

            row.on('hover', () => {
                this._onAssetHover(asset);
            });
            row.on('hoverend', () => {
                this._onAssetHoverEnd(asset);
            });

            row.dom.draggable = true;

            // this allows dragging that gets disabled by layout.js
            const onMouseDown = (evt) => evt.stopPropagation();
            row.dom.addEventListener('mousedown', onMouseDown);

            const onDragStart = (evt) => this._onAssetDragStart(evt, asset);
            row.dom.addEventListener('dragstart', onDragStart);

            // context menu (TODO: change this when the context menu becomes a PCUI element)
            editor.call('assets:contextmenu:attach', row, asset);

            row.on('destroy', dom => {
                delete this._rowsIndex[asset.get('id')];
                dom.removeEventListener('mousedown', onMouseDown);
                dom.removeEventListener('dragstart', onDragStart);
                if (domDblClick) {
                    dom.removeEventListener('dblclick', domDblClick);
                }
            });

            // name
            let cell = new pcui.TableCell({
                class: CLASS_DETAILS_NAME,
                alignItems: 'center'
            });
            row.append(cell);

            // thumb
            const thumb = new pcui.AssetThumbnail({
                assets: this._assets,
                value: asset.get('id')
            });

            cell.append(thumb);

            const labelName = new pcui.Label({
                binding: new pcui.BindingObserversToElement()
            });
            labelName.link(asset, 'name');
            labelName.on('change', () => {
                if (this._detailsView.sortKey === 'name') {
                    this._detailsView.sortObserver(asset);
                }
            });
            cell.append(labelName);



            // // id
            // cell = new pcui.TableCell();
            // row.append(cell);

            // const labelId = new pcui.Label({
            //     text: asset.get('id')
            // });
            // cell.append(labelId);

            // type
            cell = new pcui.TableCell();
            row.append(cell);

            let typeKey = asset.get('type');
            if (asset.get('source')) {
                typeKey += 'Source';
            }

            let type = TYPES[typeKey];
            if (!type) {
                type = asset.get('type')[0].toUpperCase() + asset.get('type').substring(1);
            }

            const labelType = new pcui.Label({
                text: type
            });
            cell.append(labelType);

            // size
            cell = new pcui.TableCell();
            row.append(cell);

            const labelSize = new pcui.Label({
                binding: new pcui.BindingObserversToElement({
                    customUpdate: (element, observers, paths) => {
                        if (!observers[0].has(paths[0])) {
                            element.value = '';
                        } else {
                            element.value = bytesToHuman(observers[0].get(paths[0]));
                        }
                    }
                })
            });
            labelSize.link(asset, 'file.size');
            labelSize.on('change', () => {
                if (this._detailsView.sortKey === 'file.size') {
                    this._detailsView.sortObserver(asset);
                }
            });
            cell.append(labelSize);

            return row;
        }

        _onSelectRow(row) {
            if (this._suspendSelectEvents) return;
            editor.call('selector:add', 'asset', row.asset);
        }

        _onDeselectRow(row) {
            if (this._suspendSelectEvents) return;
            editor.call('selector:remove', row.asset);
        }

        _onSelectorChange(type, assets) {
            this._selector.prevType = this._selector.type;
            this._selector.prevItems = this._selector.items;

            this._selector.type = type;
            this._selector.items = assets;

            this._suspendSelectEvents = true;
            this._detailsView.deselect();

            for (const id in this._foldersIndex) {
                this._foldersIndex[id].selected = false;
            }

            if (type === 'asset') {
                assets.forEach(asset => {
                    const row = this._rowsIndex[asset.get('id')];
                    if (row) {
                        row.selected = true;
                    }

                    if (asset.get('type') === 'folder') {
                        const folder = this._foldersIndex[asset.get('id')];
                        if (folder) {
                            folder.selected = true;
                        }
                    }
                });
            }

            this._suspendSelectEvents = false;
        }

        _addAsset(asset) {
            const id = asset.get('id');

            if (asset.get('type') === 'folder') {
                this._addFolder(asset);
            }

            if (!this._assetEvents[id]) {
                this._assetEvents[id] = [];
            }
            this._assetEvents[id].push(asset.on('path:set', (path, oldPath) => {
                this._onAssetMove(asset, path, oldPath);
            }));
        }

        _removeAsset(asset) {
            const id = asset.get('id');
            if (this._assetEvents[id]) {
                this._assetEvents[id].forEach(evt => evt.unbind());
                delete this._assetEvents[id];
            }

            if (asset.get('type') === 'folder') {
                this._removeFolder(asset);
            }
        }

        _onAssetMove(asset, path, oldPath) {
            // show or hide based on filters
            const row = this._rowsIndex[asset.get('id')];
            if (row) {
                row.hidden = !this._filterAssetRow(row);
            }

            if (asset.get('type') === 'folder') {

                // early out if the asset has the same parent
                if (path[path.length - 1] === oldPath[oldPath.length - 1]) return;

                const folder = this._foldersIndex[asset.get('id')];
                // remove folder and add it under the right parent
                if (folder) {
                    if (folder.parent) {
                        folder.parent.remove(folder);
                    }

                    let newParent;
                    if (path.length) {
                        newParent = this._foldersIndex[path[path.length - 1]];

                        if (!newParent) {
                            // unlikely to ever happen...
                            this._removeFolder(asset);
                            this._queueAssetToWaitForParent(asset.get('id'), path[path.length - 1]);
                        }
                    } else {
                        newParent = this._foldersViewRoot;
                    }

                    if (newParent) {
                        this._insertTreeItemAlphabetically(newParent, folder);
                    }
                }
            }
        }

        _addFolder(asset) {
            const id = asset.get('id');

            // find parent
            let parent;
            const path = asset.get('path');
            let parentId;
            if (path && path.length) {
                parentId = path[path.length - 1];
                parent = this._foldersIndex[path[path.length - 1]];
            } else {
                parentId = '';
                parent = this._foldersViewRoot;
            }

            // if we can't find the parent skip this folder
            // it will be added later when its parent is added
            if (!parent) {
                this._queueAssetToWaitForParent(id, parentId);
                return;
            }

            if (this._foldersIndex[id]) return;

            const treeItem = new pcui.TreeViewItem({
                text: asset.get('name')
            });

            treeItem.on('hover', () => {
                this._onAssetHover(asset);
            });
            treeItem.on('hoverend', () => {
                this._onAssetHoverEnd(asset);
            });

            editor.call('assets:contextmenu:attach', treeItem, asset);

            treeItem.asset = asset;

            this._foldersIndex[id] = treeItem;

            if (!this._assetEvents[id]) {
                this._assetEvents[id] = [];
            }

            let evtName = asset.on('name:set', (value) => {
                treeItem.text = value;
            });

            treeItem.on('destroy', () => {
                if (evtName) {
                    evtName.unbind();
                    evtName = null;
                }
            });

            this._insertTreeItemAlphabetically(parent, treeItem);

            // add child folders
            if (this._foldersWaitingParent[id]) {
                this._foldersWaitingParent[id].forEach(childId => {
                    const childAsset = this._assets.get(childId);
                    if (childAsset) {
                        this._addFolder(childAsset);
                    }
                });

                delete this._foldersWaitingParent[id];
            }
        }

        _queueAssetToWaitForParent(assetId, parentId) {
            if (!this._foldersWaitingParent[parentId]) {
                this._foldersWaitingParent[parentId] = new Set();
            }

            this._foldersWaitingParent[parentId].add(assetId);
        }

        _insertTreeItemAlphabetically(parentTreeItem, treeItem) {
            // find the right spot to insert the tree item based on alphabetical order
            const text = treeItem.text.toLowerCase();
            let sibling = parentTreeItem.firstChild;
            while (sibling) {
                if (sibling !== treeItem && sibling.text.toLowerCase() > text) {
                    if (!treeItem.parent) {
                        parentTreeItem.appendBefore(treeItem, sibling);
                    } else {
                        // this is just a sanity check but if
                        // the tree item is already parented then
                        // just call insertBefore on the DOM directly
                        // so that no additional append events are raised,
                        // since we only really want to reorder the tree item under
                        // the same parent. If we call regular appendBefore then
                        // that will cause duplicate unnecessary events to be
                        // fired on the tree item and the tree view.
                        parentTreeItem.domContent.insertBefore(treeItem.dom, sibling.dom);
                    }
                    break;
                }

                sibling = sibling.nextSibling;
            }

            if (!treeItem.parent) {
                parentTreeItem.append(treeItem);
            }
        }

        _removeFolder(asset) {
            const id = asset.get('id');

            if (this._foldersIndex[id]) {
                this._foldersIndex[id].destroy();
                delete this._foldersIndex[id];
            }

            if (this._foldersWaitingParent[id]) {
                delete this._foldersWaitingParent[id];
            }
        }

        _onFolderTreeReparent(reparentedItems) {
            const assets = reparentedItems.map(reparented => {
                return reparented.item.asset;
            });

            editor.call('assets:fs:move', assets, reparentedItems[0].newParent.asset || null);
        }

        _onFolderTreeSelect(item) {
            if (this._suspendSelectEvents) return;

            if (item.asset) {
                if (this._foldersView.pressedCtrl || this._foldersView.pressedShift) {
                    editor.call('selector:add', 'asset', item.asset);
                } else {
                    if (item.asset === this.currentFolder) {
                        editor.call('selector:set', 'asset', [item.asset]);
                    } else {
                        item.selected = false;
                        this.currentFolder = item.asset;
                    }
                }
            } else {
                item.selected = false;
                this.currentFolder = null;
            }
        }

        _onFolderTreeDeselect(item) {
            if (this._suspendSelectEvents) return;

            if (item.asset) {
                editor.call('selector:remove', item.asset);
            }
        }

        _onFolderTreeDragStart(items) {
            this._onAssetDragStart(null, items[0].asset);
        }

        _filterAssetRow(row) {
            if (!row.asset) return false;

            const path = row.asset.get('path');
            if (this._currentFolder === null) {
                return path.length === 0;
            }

            if (path && path.length) {
                if (parseInt(this._currentFolder.get('id'), 10) === path[path.length - 1]) {
                    return true;
                }
            }

            return false;
        }

        destroy() {
            if (this._destroyed) return;

            this._eventsEditor.forEach(e => e.unbind());
            this._eventsEditor.length = 0;

            this.dropManager = null;

            this.assets = null;

            super.destroy();
        }

        get assets() {
            return this._assets;
        }

        set assets(value) {
            this._setHoveredAsset(undefined);

            this._selector.type = null;
            this._selector.items = [];
            this._selector.prevType = null;
            this._selector.prevItems = [];

            this._assetListEvents.forEach(e => e.unbind());
            this._assetListEvents.length = 0;

            this._detailsView.unlink();

            for (const id in this._foldersIndex) {
                this._foldersIndex[id].destroy();
            }
            this._foldersIndex = {};

            this._foldersWaitingParent = {};

            this._assets = value;
            if (!this._assets) return;

            const assets = this._assets.array();
            assets.forEach(asset => {
                this._addAsset(asset);
            });

            this._detailsView.link(assets);

            this._assetListEvents.push(this._assets.on('add', asset => {
                this._addAsset(asset);
                this._detailsView.addObserver(asset);
            }));
            this._assetListEvents.push(this._assets.on('remove', asset => {
                this._removeAsset(asset);
                this._detailsView.removeObserver(asset);
            }));
        }

        get currentFolder() {
            return this._currentFolder;
        }

        set currentFolder(value) {
            if (this._currentFolder === value) return;

            let id;
            if (this._currentFolder) {
                id = this._currentFolder.get('id');
                if (this._foldersIndex[id]) {
                    this._foldersIndex[id].class.remove(CLASS_CURRENT_FOLDER);
                }
            } else {
                this._foldersViewRoot.class.remove(CLASS_CURRENT_FOLDER);
            }

            this._currentFolder = value;

            if (this._currentFolder) {
                id = this._currentFolder.get('id');
                if (this._foldersIndex[id]) {
                    this._foldersIndex[id].class.add(CLASS_CURRENT_FOLDER);
                }
            } else {
                this._foldersViewRoot.class.add(CLASS_CURRENT_FOLDER);
            }

            this._detailsView.filter();

            this.emit('currentFolder', value);
        }

        get dropManager() {
            return this._dropManager;
        }

        set dropManager(value) {
            if (this._dropManager === value) return;

            if (this._foldersDropTarget) {
                this._foldersDropTarget.destroy();
                this._foldersDropTarget = null;
            }

            if (this._tableDropTarget) {
                this._tableDropTarget.destroy();
                this._tableDropTarget = null;
            }

            this._eventsDropManager.forEach(e => e.unbind());
            this._eventsDropManager.length = 0;

            this._dropManager = value;

            if (this._dropManager) {
                this._eventsDropManager.push(this._dropManager.on('deactivate', this._onDeactivateDropManager.bind(this)));

                this._foldersDropTarget = new pcui.DropTarget(this._containerFolders, {
                    class: 'foldersDropTarget',
                    hole: true,
                    passThrough: true,
                    onFilter: this._onAssetDropFilter.bind(this),
                    onDrop: this._onAssetDrop.bind(this)
                });
                this._foldersDropTarget.style.outline = 'none';
                this._dropManager.append(this._foldersDropTarget);

                this._tableDropTarget = new pcui.DropTarget(this._detailsView, {
                    class: 'tableDropTarget',
                    hole: true,
                    passThrough: true,
                    onFilter: this._onAssetDropFilter.bind(this),
                    onDrop: this._onAssetDrop.bind(this)
                });
                this._tableDropTarget.style.outline = 'none';
                this._dropManager.append(this._tableDropTarget);
            }
        }

        get detailsView() {
            return this._detailsView;
        }

        get foldersView() {
            return this._containerFolders;
        }
    }

    return {
        AssetPanel: AssetPanel
    };
})());
