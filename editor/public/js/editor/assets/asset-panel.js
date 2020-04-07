Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'pcui-asset-panel';
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
            this._foldersView = new pcui.TreeView({
                resizable: 'right',
                resizeMin: 100,
                resizeMax: 300,
                width: 200,
                scrollable: true
            });

            this._foldersView.on('select', this._onFolderTreeSelect.bind(this));
            this._foldersView.on('deselect', this._onFolderTreeDeselect.bind(this));

            // root element
            this._foldersViewRoot = new pcui.TreeViewItem({
                text: '/'
            });
            this._foldersViewRoot.open = true;
            this._foldersView.append(this._foldersViewRoot);

            this.append(this._foldersView);

            this._foldersIndex = {};

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

        _createDetailsViewRow(asset) {
            const row = new pcui.TableRow();

            row.asset = asset;

            this._rowsIndex[asset.get('id')] = row;

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
            this._suspendSelectEvents = true;
            this._detailsView.deselect();
            assets.forEach(asset => {
                const row = this._rowsIndex[asset.get('id')];
                if (row) {
                    row.selected = true;
                }
            });

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

            this._foldersViewRoot.append(treeItem);
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
        }

        _onFolderTreeSelect(item) {
            if (item.asset) {
                if (item.asset === this.currentFolder) {
                    editor.call('selector:add', 'asset', item.asset);
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
            this._assetListEvents.forEach(e => e.unbind());
            this._assetListEvents.length = 0;

            this._detailsView.unlink();

            for (const id in this._foldersIndex) {
                this._foldersIndex[id].destroy();
            }
            this._foldersIndex = {};

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
