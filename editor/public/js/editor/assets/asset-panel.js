Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-panel';
    const CLASS_FOLDERS = CLASS_ROOT + '-folders';
    const CLASS_CURRENT_FOLDER = CLASS_ROOT + '-current-folder';
    const CLASS_ASSET_HIGHLIGHTED = CLASS_ROOT + '-highlighted-asset';
    const CLASS_DETAILS_NAME = CLASS_ROOT + '-details-name';
    const CLASS_ASSET_GRID_ITEM = 'pcui-asset-grid-view-item';
    const CLASS_ASSET_SOURCE = CLASS_ASSET_GRID_ITEM + '-source';

    const CLASS_CONTROLS = CLASS_ROOT + '-controls';

    const CLASS_GRID_SMALL = CLASS_ROOT + '-grid-view-small';

    const CLASS_HIDE_ON_COLLAPSE = CLASS_ROOT + '-hide-on-collapse';
    const CLASS_BTN_SMALL = CLASS_ROOT + '-btn-small';
    const CLASS_BTN_STORE = CLASS_ROOT + '-btn-store';
    const CLASS_BTN_CONTAINER = CLASS_ROOT + '-btn-container';
    const CLASS_BTN_ACTIVE = CLASS_ROOT + '-btn-active';

    const TYPES = {
        all: 'All',
        animation: 'Animation',
        audio: 'Audio',
        bundle: 'Asset Bundle',
        binary: 'Binary',
        cubemap: 'Cubemap',
        css: 'Css',
        font: 'Font',
        fontSource: 'Font (source)',
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

    const REGEX_TAGS = /^\[(.*)\]$/;
    const REGEX_SUB_TAGS = /\[(.*?)\]/g;

    class AssetPanel extends pcui.Panel {
        constructor(args) {
            args = Object.assign({
                headerText: 'ASSETS'
            }, args);

            args.flex = true;
            args.flexDirection = 'row';

            super(args);

            this.class.add(CLASS_ROOT);

            // append container for all controls
            this._containerControls = new pcui.Container({
                class: [CLASS_CONTROLS, CLASS_HIDE_ON_COLLAPSE],
                flex: true
            });
            this.header.append(this._containerControls);
            // stop click events so that the asset panel is only collapsed when you
            // click on the title
            this._containerControls.on('click', evt => evt.stopPropagation());

            // header controls
            this._btnNew = new pcui.Button({
                icon: 'E120',
                enabled: false,
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnNew.on('click', this._onClickNew.bind(this));
            this._containerControls.append(this._btnNew);

            this._btnDelete = new pcui.Button({
                icon: 'E124',
                enabled: false,
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnDelete.on('click', this._onClickDelete.bind(this));
            this._containerControls.append(this._btnDelete);

            this._btnBack = new pcui.Button({
                icon: 'E114',
                enabled: false,
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnBack.on('click', this._onClickBack.bind(this));
            this._containerControls.append(this._btnBack);

            const containerBtn = new pcui.Container({
                flex: true,
                flexDirection: 'row',
                class: [CLASS_BTN_CONTAINER, CLASS_HIDE_ON_COLLAPSE]
            });
            this._containerControls.append(containerBtn);

            this._btnLargeGrid = new pcui.Button({
                icon: 'E143',
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnLargeGrid.on('click', this._onClickLargeGrid.bind(this));
            containerBtn.append(this._btnLargeGrid);

            this._btnSmallGrid = new pcui.Button({
                icon: 'E145',
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnSmallGrid.on('click', this._onClickSmallGrid.bind(this));
            containerBtn.append(this._btnSmallGrid);

            this._btnDetailsView = new pcui.Button({
                icon: 'E146',
                class: [CLASS_BTN_SMALL, CLASS_HIDE_ON_COLLAPSE]
            });
            this._btnDetailsView.on('click', this._onClickDetailsView.bind(this));
            containerBtn.append(this._btnDetailsView);

            // asset type filter
            const dropdownTypeOptions = Object.keys(TYPES)
            .filter(type => type !== 'bundle' || editor.call('users:hasFlag', 'hasBundles'))
            .map(type => {
                return {
                    v: type,
                    t: TYPES[type]
                };
            });
            this._dropdownType = new pcui.SelectInput({
                options: dropdownTypeOptions,
                value: 'all',
                class: CLASS_HIDE_ON_COLLAPSE
            });
            this._containerControls.append(this._dropdownType);
            this._dropdownType.on('change', this._onDropDownTypeChange.bind(this));

            this._searchInput = new pcui.TextInput({
                class: CLASS_HIDE_ON_COLLAPSE,
                keyChange: true,
                placeholder: 'Search'
            });
            this._containerControls.append(this._searchInput);
            this._searchInput.on('change', this._onSearchInputChange.bind(this));
            this._searchTags = null;

            const btnStore = new pcui.Button({
                text: 'STORE',
                icon: 'E238',
                class: [CLASS_BTN_STORE, CLASS_HIDE_ON_COLLAPSE]
            });
            btnStore.on('click', this._onClickStore.bind(this));
            this._containerControls.append(btnStore);

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

            this._foldersDropTarget = null;
            this._tableDropTarget = null;
            this._gridViewDropTarget = null;

            if (args.dropManager) {
                this.dropManager = args.dropManager;
            }

            // table view
            this._detailsView = new pcui.Table({
                scrollable: true,
                hidden: true,
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
                filterFn: this._filterAssetElement.bind(this)
            });
            this.append(this._detailsView);

            // grid view
            this._gridView = new pcui.GridView({
                scrollable: true,
                filterFn: this._filterAssetElement.bind(this)
            });
            this.append(this._gridView);


            this._refreshViewButtonsTimeout = null;

            this.viewMode = args.viewMode || AssetPanel.VIEW_LARGE_GRID;

            this._rowsIndex = {};

            this._gridIndex = {};

            this._suspendSelectEvents = false;
            this._detailsView.on('select', this._onSelectAssetElement.bind(this));
            this._detailsView.on('deselect', this._onDeselectAssetElement.bind(this));

            this._gridView.on('select', this._onSelectAssetElement.bind(this));
            this._gridView.on('deselect', this._onDeselectAssetElement.bind(this));

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

            this.writePermissions = !!args.writePermissions;

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

        _onClickStore() {
            window.open('https://store.playcanvas.com/', '_blank');
        }

        _onClickNew() {
            // TODO
            return;
            var rect = btnNew.element.getBoundingClientRect();
            menu.position(rect.right, rect.top);
            menu.open = true;
        }

        _onClickDelete() {
            if (! editor.call('permissions:write'))
                return;

            const type = editor.call('selector:type');
            if (type === 'asset') {
                editor.call('assets:delete:picker', editor.call('selector:items'));
            }
        }

        _onClickBack() {
            if (!this.currentFolder) return;

            // if (folder === 'scripts') {
            //     editor.call('assets:panel:currentFolder', null);
            // } else {
            const path = this.currentFolder.get('path');
            let folder = null;
            if (path.length) {
                folder = this._assets.get(path[path.length - 1]);
            }

            this.currentFolder = folder;
            // }
        }

        _onClickLargeGrid() {
            this.viewMode = AssetPanel.VIEW_LARGE_GRID;
        }

        _onClickSmallGrid() {
            this.viewMode = AssetPanel.VIEW_SMALL_GRID;
        }

        _onClickDetailsView() {
            this.viewMode = AssetPanel.VIEW_DETAILS;
        }

        _onDropDownTypeChange(value) {
            this._detailsView.filter();
            this._gridView.filter();
        }

        // Convert string in form "tag1, tag2" to an array
        // of strings like so: "tag1", "tag2"
        _processTagsString(str) {
            return str.trim().split(',').map(s => s.trim());
        }

        _onSearchInputChange(value) {
            this._searchTags = null;
            value = value.trim();

            let tags = value.match(REGEX_TAGS);
            if (tags) {
                tags = tags[1].trim();
                if (tags.length) {
                    let subTags;
                    while ((subTags = REGEX_SUB_TAGS.exec(tags)) !== null) {
                        if (!this._searchTags) this._searchTags = [];
                        this._searchTags.push(this._processTagsString(subTags[1]));
                    }

                    if (!this._searchTags) {
                        this._searchTags = this._processTagsString(tags);
                    }
                }
            }

            this._detailsView.filter();
            this._gridView.filter();
        }

        _refreshViewButtons() {
            if (this._refreshViewButtonsTimeout) return;

            this._refreshViewButtonsTimeout = requestAnimationFrame(() => {
                this._refreshViewButtonsTimeout = null;

                this._btnLargeGrid.class.remove(CLASS_BTN_ACTIVE);
                this._btnSmallGrid.class.remove(CLASS_BTN_ACTIVE);
                this._btnDetailsView.class.remove(CLASS_BTN_ACTIVE);

                if (this._viewMode === AssetPanel.VIEW_DETAILS) {
                    this._btnDetailsView.class.add(CLASS_BTN_ACTIVE);
                } else if (this._viewMode === AssetPanel.VIEW_SMALL_GRID) {
                    this._btnSmallGrid.class.add(CLASS_BTN_ACTIVE);
                } else {
                    this._btnLargeGrid.class.add(CLASS_BTN_ACTIVE);
                }
            });
        }

        _onAssetDblClick(evt, asset) {
            evt.stopPropagation();
            evt.preventDefault();

            const type = asset.get('type');
            if (type === 'folder') {
                // go into the folder but after 1 frame
                // otherwise the asset inside the folder that
                // is under the cursor will be selected when you
                // release the cursor

                requestAnimationFrame(() => {
                    this.currentFolder = asset;

                    // restore previous selection after
                    // double clicking into a folder
                    if (this._selector.prevItems) {
                        editor.call('selector:set', this._selector.prevType, this._selector.prevItems);
                    }
                });
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

        _createDropTarget(target) {
            const dropTarget = new pcui.DropTarget(target, {
                hole: true,
                passThrough: true,
                onFilter: this._onAssetDropFilter.bind(this),
                onDrop: this._onAssetDrop.bind(this)
            });
            dropTarget.style.outline = 'none';

            this._dropManager.append(dropTarget);

            return dropTarget;
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

                    const gridItem = this._gridIndex[this._hoveredAsset.get('id')];
                    if (gridItem) {
                        gridItem.class.remove(CLASS_ASSET_HIGHLIGHTED);
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

                    const gridItem = this._gridIndex[this._hoveredAsset.get('id')];
                    if (gridItem) {
                        gridItem.class.add(CLASS_ASSET_HIGHLIGHTED);
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

        _onSelectAssetElement(element) {
            if (this._suspendSelectEvents) return;
            editor.call('selector:add', 'asset', element.asset);
        }

        _onDeselectAssetElement(element) {
            if (this._suspendSelectEvents) return;
            editor.call('selector:remove', element.asset);
        }

        _onSelectorChange(type, assets) {
            this._selector.prevType = this._selector.type;
            this._selector.prevItems = this._selector.items;

            this._selector.type = type;
            this._selector.items = assets;

            this._suspendSelectEvents = true;
            this._detailsView.deselect();
            this._gridView.deselect();

            for (const id in this._foldersIndex) {
                this._foldersIndex[id].selected = false;
            }

            if (type === 'asset') {
                this._btnDelete.enabled = this.writePermissions && assets.length;

                assets.forEach(asset => {
                    const row = this._rowsIndex[asset.get('id')];
                    if (row) {
                        row.selected = true;
                    }

                    const gridItem = this._gridIndex[asset.get('id')];
                    if (gridItem) {
                        gridItem.selected = true;
                    }

                    if (asset.get('type') === 'folder') {
                        const folder = this._foldersIndex[asset.get('id')];
                        if (folder) {
                            folder.selected = true;
                        }
                    }
                });
            } else {
                this._btnDelete.enabled = false;
            }

            this._suspendSelectEvents = false;
        }

        _addAsset(asset, index, addToDetailsView) {
            const id = asset.get('id');

            // init events
            if (!this._assetEvents[id]) {
                this._assetEvents[id] = [];
            }

            // if it's a folder add it to the folder view
            if (asset.get('type') === 'folder') {
                this._addFolder(asset);
            }

            // change asset path
            this._assetEvents[id].push(asset.on('path:set', (path, oldPath) => {
                this._onAssetPathChange(asset, path, oldPath);
            }));

            // add to grid view
            this._addGridItem(asset, index);

            // add to details view
            if (addToDetailsView) {
                this._detailsView.addObserver(asset);
            }
        }

        _addGridItem(asset, index) {
            const item = new pcui.AssetGridViewItem({
                assets: this._assets
            });

            item.link(asset);
            item.asset = asset;

            this._gridIndex[asset.get('id')] = item;

            let domDblClick;

            // folder dbl click
            if (DBL_CLICKABLES[asset.get('type')]) {
                domDblClick = (evt) => this._onAssetDblClick(evt, asset);
                item.dom.addEventListener('dblclick', domDblClick);
            }

            // context menu
            editor.call('assets:contextmenu:attach', item, asset);

            // drag
            item.dom.draggable = true;

            // hover
            item.on('hover', () => {
                this._onAssetHover(asset);
            });
            item.on('hoverend', () => {
                this._onAssetHoverEnd(asset);
            });

            // this allows dragging that gets disabled by layout.js
            const onMouseDown = (evt) => {
                evt.stopPropagation();
            };

            item.dom.addEventListener('mousedown', onMouseDown);

            const onDragStart = (evt) => this._onAssetDragStart(evt, asset);
            item.dom.addEventListener('dragstart', onDragStart);

            item.on('destroy', dom => {
                if (domDblClick) {
                    dom.removeEventListener('dblclick', domDblClick);
                }

                dom.removeEventListener('mousedown', onMouseDown);
                dom.removeEventListener('dragStart', onDragStart);

                delete this._gridIndex[asset.get('id')];
            });

            let appendBefore = null;
            if (index >= 0 && this._assets.data[index + 1]) {
                appendBefore = this._gridIndex[this._assets.data[index + 1].get('id')];
            }
            this._gridView.appendBefore(item, appendBefore);

            return item;
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

            this._detailsView.removeObserver(asset);

            const gridItem = this._gridIndex[id];
            if (gridItem) {
                gridItem.destroy();
            }
        }

        _moveAsset(asset, index) {
            const suspendEvents = this._suspendSelectEvents;
            this._suspendSelectEvents = true;

            const folder = this._foldersIndex[asset.get('id')];
            // move folder alphabetically
            if (folder) {
                const selected = folder.selected;
                const parent = folder.parent;
                parent.remove(folder);
                this._insertTreeItemAlphabetically(parent, folder);
                folder.selected = selected;
            }

            // reorder grid item
            const gridItem = this._gridIndex[asset.get('id')];
            if (gridItem) {
                const selected = gridItem.selected;
                this._gridView.remove(gridItem);
                if (this._assets.data[index + 1]) {
                    this._gridView.appendBefore(gridItem, this._gridIndex[this._assets.data[index + 1].get('id')]);
                } else {
                    this._gridView.append(gridItem);
                }
                gridItem.selected = selected;
            }

            this._suspendSelectEvents = suspendEvents;
        }

        _onAssetPathChange(asset, path, oldPath) {
            // show or hide based on filters
            const row = this._rowsIndex[asset.get('id')];
            if (row) {
                row.hidden = !this._filterAssetElement(row);
            }

            const gridItem = this._gridIndex[asset.get('id')];
            if (gridItem) {
                gridItem.hidden = !this._filterAssetElement(gridItem);
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
            const text = treeItem.asset.get('name').toLowerCase();
            let sibling = parentTreeItem.firstChild;
            while (sibling) {
                if (sibling !== treeItem && sibling.asset.get('name').toLowerCase() > text) {
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

        _tagsAND(tagGroup, assetTags) {
            for (let i = 0; i < tagGroup.length; i++) {
                if (assetTags.indexOf(tagGroup[i]) === -1) {
                    return false;
                }
            }

            return true;
        }

        _tagsOR(tagGroup, assetTags) {
            for (let i = 0; i < tagGroup.length; i++) {
                if (Array.isArray(tagGroup[i])) {
                    if (this._tagsAND(tagGroup[i], assetTags)) {
                        return true;
                    }
                } else if (assetTags.indexOf(tagGroup[i]) !== -1) {
                    return true;
                }
            }

            return false;
        }

        _filterAssetElement(element) {
            if (!element.asset) return false;

            if (this._dropdownType.value !== 'all') {
                if (this._dropdownType.value !== (element.asset.get('source') ? element.asset.get('type') + 'Source' : element.asset.get('type'))) {
                    return false;
                }
            }

            const name = element.asset.get('name');

            const searchQuery = this._searchInput.value;

            if (searchQuery) {
                if (this._searchTags) {
                    // check for tags
                    const tags = element.asset.getRaw('tags');
                    if (tags.length === 0) {
                        return false;
                    }

                    return this._tagsOR(this._searchTags, tags);

                } else if (searchQuery[0] === '*' && searchQuery.length > 1) {
                    // check for regular expression first if the query starts with '*'
                    try {
                        if (new RegExp(searchQuery.slice(1), 'i').test(name)) {
                            return true;
                        }
                    } catch (ex) {} // swallow exception and continue
                }

                // check if name includes search query
                if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {

                    // if id matches then return true immediately
                    const id = parseInt(searchQuery, 10);
                    if (id && element.asset.get('id') === id)  {
                        return true;
                    }

                    return false;
                }
            }

            const path = element.asset.get('path');
            if (this._currentFolder === null && path.length) {
                return false;
            }

            if (this._currentFolder && !path.length) {
                return false;
            }

            if (this._currentFolder) {
                if (parseInt(this._currentFolder.get('id'), 10) !== path[path.length - 1]) {
                    return false;
                }
            }

            return true;
        }

        toggleDetailsView() {
            this._detailsView.hidden = !this._detailsView.hidden;
            this._gridView.hidden = !this._detailsView.hidden;
        }

        destroy() {
            if (this._destroyed) return;

            if (this._refreshViewButtonsTimeout) {
                cancelAnimationFrame(this._refreshViewButtonsTimeout);
                this._refreshViewButtonsTimeout = null;
            }

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
            this._gridView.clear();

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

            this._assetListEvents.push(this._assets.on('add', (asset, _, index) => {
                this._addAsset(asset, index, true);
            }));
            this._assetListEvents.push(this._assets.on('remove', asset => {
                this._removeAsset(asset);
            }));
            this._assetListEvents.push(this._assets.on('move', (asset, index) => {
                this._moveAsset(asset, index);
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
                this._btnBack.enabled = true;
                id = this._currentFolder.get('id');
                if (this._foldersIndex[id]) {
                    this._foldersIndex[id].class.add(CLASS_CURRENT_FOLDER);
                }
            } else {
                this._btnBack.enabled = false;
                this._foldersViewRoot.class.add(CLASS_CURRENT_FOLDER);
            }

            this._detailsView.filter();
            this._gridView.filter();

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

            if (this._gridViewDropTarget) {
                this._gridViewDropTarget.destroy();
                this._gridViewDropTarget = null;
            }

            this._eventsDropManager.forEach(e => e.unbind());
            this._eventsDropManager.length = 0;

            this._dropManager = value;

            if (this._dropManager) {
                this._eventsDropManager.push(this._dropManager.on('deactivate', this._onDeactivateDropManager.bind(this)));

                this._foldersDropTarget = this._createDropTarget(this._containerFolders);
                this._tableDropTarget = this._createDropTarget(this._detailsView);
                this._gridViewDropTarget = this._createDropTarget(this._gridView);
            }
        }

        get detailsView() {
            return this._detailsView;
        }

        get foldersView() {
            return this._containerFolders;
        }

        get gridView() {
            return this._gridView;
        }

        get viewMode() {
            return this._viewMode;
        }

        set viewMode(value) {
            if (this._viewMode === value) return;

            this._viewMode = value;

            this._detailsView.hidden = (value !== AssetPanel.VIEW_DETAILS);
            this._gridView.hidden = !this._detailsView.hidden;
            if (!this._gridView.hidden) {
                if (value === AssetPanel.VIEW_SMALL_GRID) {
                    this._gridView.class.add(CLASS_GRID_SMALL);
                } else {
                    this._gridView.class.remove(CLASS_GRID_SMALL);
                }
            }

            this._refreshViewButtons();

            this.emit('viewMode', value);
        }

        get writePermissions() {
            return this._writePermissions;
        }

        set writePermissions(value) {
            if (this._writePermissions === value) return;

            this._writePermissions = value;

            if (!value) {
                this._btnNew.enabled = false;
                this._btnDelete.enabled = false;
            } else {
                this._btnNew.enabled = true;
                this._btnDelete.enabled = this._selector.items.length && this._selector.type === 'asset';
            }
        }
    }

    AssetPanel.VIEW_LARGE_GRID = 'lgrid';
    AssetPanel.VIEW_SMALL_GRID = 'sgrid';
    AssetPanel.VIEW_DETAILS = 'details';

    class AssetGridViewItem extends pcui.GridViewItem {
        constructor(args) {
            super(args);

            this.class.add(CLASS_ASSET_GRID_ITEM);

            this._thumbnail = new pcui.AssetThumbnail({
                assets: args.assets
            });

            this.prepend(this._thumbnail);
        }

        link(asset) {
            super.link(asset, 'name');
            this._thumbnail.value = asset.get('id');
            if (asset.get('source')) {
                this.class.add(CLASS_ASSET_SOURCE);
            }
        }

        unlink() {
            super.unlink();
            this._thumbnail.value = null;
            this.class.remove(CLASS_ASSET_SOURCE);
        }
    }

    return {
        AssetGridViewItem: AssetGridViewItem,
        AssetPanel: AssetPanel
    };
})());
