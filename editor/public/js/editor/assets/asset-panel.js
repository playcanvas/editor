Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-panel';
    const CLASS_FOLDERS = CLASS_ROOT + '-folders';
    const CLASS_CURRENT_FOLDER = CLASS_ROOT + '-current-folder';

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
                allowReordering: false
            });
            this._containerFolders.append(this._foldersView);

            this._foldersView.on('select', this._onFolderTreeSelect.bind(this));
            this._foldersView.on('deselect', this._onFolderTreeDeselect.bind(this));

            // root element
            this._foldersViewRoot = new pcui.TreeViewItem({
                text: '/'
            });
            this._foldersViewRoot.open = true;
            this._foldersView.append(this._foldersViewRoot);

            this._foldersIndex = {};
            this._foldersWaitingParent = {};

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
                items: null,
                prevType: null,
                prevItems: null
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

        _createDetailsViewRow(asset) {
            const row = new pcui.TableRow();

            row.asset = asset;

            this._rowsIndex[asset.get('id')] = row;

            // folder dbl click
            if (DBL_CLICKABLES[asset.get('type')]) {
                row.dom.addEventListener('dblclick', (evt) => {
                    this._onAssetDblClick(evt, asset);
                });
            }

            row.on('destroy', () => {
                delete this._rowsIndex[asset.get('id')];
            });

            // name
            let cell = new pcui.TableCell({
                flex: true,
                flexDirection: 'row',
                alignItems: 'center'
            });
            row.append(cell);

            // thumb
            const thumb = new pcui.AssetThumbnail({
                assets: this._assets,
                value: asset.get('id'),
                flexShrink: 0
            });

            if (asset.get('type') === 'folder') {
                thumb.style.filter = "invert(46%) sepia(5%) saturate(1283%) hue-rotate(139deg) brightness(90%) contrast(90%)";
            }

            cell.append(thumb);

            const labelName = new pcui.Label({
                binding: new pcui.BindingObserversToElement(),
                flexShrink: 0
            });
            labelName.link(asset, 'name');
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

        _onAssetAdd(asset) {
            if (asset.get('type') === 'folder') {
                this._addFolder(asset);
            }

            this._detailsView.link(this._assets.array());
        }

        _onAssetRemove(asset) {
            if (asset.get('type') === 'folder') {
                this._removeFolder(asset);
            }

            this._detailsView.link(this._assets.array());
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
                if (!this._foldersWaitingParent[parentId]) {
                    this._foldersWaitingParent[parentId] = new Set();
                }

                this._foldersWaitingParent[parentId].add(id);
                return;
            }

            if (this._foldersIndex[id]) return;

            const treeItem = new pcui.TreeViewItem({
                text: asset.get('name')
            });

            treeItem.asset = asset;

            this._foldersIndex[id] = treeItem;

            if (!this._assetEvents[id]) {
                this._assetEvents[id] = [];
            }

            this._assetEvents[id].push(asset.on('name:set', (value) => {
                treeItem.text = value;
            }));

            // find the right spot to insert the tree item based on alphabetical order
            const text = treeItem.text.toLowerCase();
            for (let i = 0; i < this.dom.childNodes.length; i++) {
                const sibling = this.dom.childNodes[i].ui;
                if (sibling instanceof pcui.TreeViewItem && sibling.text.toLowerCase() > text) {
                    parent.appendBefore(treeItem, sibling);
                }
            }

            if (!treeItem.parent) {
                parent.append(treeItem);
            }

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

        _removeFolder(asset) {
            const id = asset.get('id');
            if (this._assetEvents[id]) {
                this._assetEvents[id].forEach(evt => evt.unbind());
                delete this._assetEvents[id];
            }

            if (this._foldersIndex[id]) {
                this._foldersIndex[id].destroy();
                delete this._foldersIndex[id];
            }

            if (this._foldersWaitingParent[id]) {
                delete this._foldersWaitingParent[id];
            }
        }

        _onFolderTreeSelect(item) {
            if (this._suspendSelectEvents) return;

            if (item.asset) {
                if (item.asset === this.currentFolder) {
                    editor.call('selector:set', 'asset', [item.asset]);
                } else {
                    item.selected = false;
                    this.currentFolder = item.asset;
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

            this.assets = null;

            super.destroy();
        }

        get assets() {
            return this._assets;
        }

        set assets(value) {
            this._selector.type = null;
            this._selector.items = null;
            this._selector.prevType = null;
            this._selector.prevItems = null;

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
                if (asset.get('type') === 'folder') {
                    this._addFolder(asset);
                }
            });

            this._detailsView.link(assets);

            this._assetListEvents.push(this._assets.on('add', this._onAssetAdd.bind(this)));
            this._assetListEvents.push(this._assets.on('remove', this._onAssetRemove.bind(this)));
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
    }

    return {
        AssetPanel: AssetPanel
    };
})());
