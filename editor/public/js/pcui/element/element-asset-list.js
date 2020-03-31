Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ASSET_LIST = 'pcui-asset-list';
    const CLASS_ASSET_LIST_SELECTION_MODE = CLASS_ASSET_LIST + '-selection-mode';
    const CLASS_ASSET_LIST_EMPTY = CLASS_ASSET_LIST + '-empty';
    const CLASS_BUTTON_SELECTION_MODE = CLASS_ASSET_LIST + '-btn-selection-mode';
    const CLASS_BUTTON_ADD = CLASS_ASSET_LIST + '-btn-add';
    const CLASS_BUTTON_DONE = CLASS_ASSET_LIST + '-btn-done';
    const CLASS_BUTTON_REMOVE = CLASS_ASSET_LIST + '-btn-remove';
    const CLASS_CONTAINER_BUTTONS = CLASS_ASSET_LIST + '-buttons';
    const CLASS_CONTAINER_ASSETS = CLASS_ASSET_LIST + '-assets';
    const CLASS_ASSET_ITEM = CLASS_ASSET_LIST + '-item';
    const CLASS_ASSET_NOT_EVERYWHERE = CLASS_ASSET_LIST + '-not-everywhere';

    /**
     * @name pcui.AssetList
     * @classdesc Element that can allows selecting multiple assets.
     * @property {Boolean} renderChanges If true the input will flash when changed.
     * @extends pcui.Element
     */
    class AssetList extends pcui.Element {
        /**
         * Creates a new pcui.AssetList.
         * @param {Object} args The arguments
         * @param {ObserverList} args.assets The assets list
         * @param {String} [args.assetType] An optional filter for a specific asset type.
         * @param {Function} [args.filterFn] An optional filter function when determining which assets to show with the asset picker.
         * @param {Boolean} [args.allowDragDrop] If true then this will enable drag and drop of assets on the input
         * The function takes an asset observer as an argument and returns true or false.
         */
        constructor(args) {
            if (!args) args = {};

            const container = new pcui.Container({
                flex: true
            });

            super(container.dom, args);

            this.class.add(CLASS_ASSET_LIST, CLASS_ASSET_LIST_EMPTY);

            this._container = container;
            this._container.parent = this;

            this._assets = args.assets;
            this._assetType = args.assetType;
            this._filterFn = args.filterFn;

            // button that enables selection mode
            this._btnSelectionMode = new pcui.Button({
                class: CLASS_BUTTON_SELECTION_MODE,
                text: 'Add Assets',
                icon: 'E120'
            });
            this._btnSelectionMode.on('click', this._onClickSelectionMode.bind(this));
            this._container.append(this._btnSelectionMode);

            // label for buttons container
            this._labelAddAssets = new pcui.Label({
                text: 'Add Assets',
                hidden: true
            });
            this._container.append(this._labelAddAssets);

            // container for buttons that are visible while in selection mode
            this._containerButtons = new pcui.Container({
                class: CLASS_CONTAINER_BUTTONS,
                flex: true,
                flexDirection: 'row',
                alignItems: 'center',
                hidden: true
            });
            this._container.append(this._containerButtons);

            // button to add selected assets to list
            this._btnAdd = new pcui.Button({
                text: 'ADD SELECTION',
                enabled: false,
                class: CLASS_BUTTON_ADD,
                icon: 'E120',
                flexGrow: 1
            });
            this._btnAdd.on('click', this._onClickAdd.bind(this));
            this._containerButtons.append(this._btnAdd);

            // button to exit selection mode
            this._btnDone = new pcui.Button({
                text: 'DONE',
                class: CLASS_BUTTON_DONE,
                icon: 'E133',
                flexGrow: 1
            });
            this._btnDone.on('click', this._onClickDone.bind(this));
            this._containerButtons.append(this._btnDone);

            // search input field
            this._searchInput = new pcui.TextInput({
                hidden: true,
                placeholder: 'Filter assets',
                keyChange: true
            });
            this._searchInput.on('change', this._onSearchChange.bind(this));
            this._container.append(this._searchInput);

            // asset list
            this._containerAssets = new pcui.Container({
                class: CLASS_CONTAINER_ASSETS,
                hidden: true
            });

            // show assets and search input when assets are added
            this._containerAssets.on('append', () => {
                this._containerAssets.hidden = false;
                this._searchInput.hidden = false;
            });

            // hide assets and search input if all assets are removed
            this._containerAssets.on('remove', () => {
                this._containerAssets.hidden = this._containerAssets.dom.childNodes.length === 0;
                this._searchInput.hidden = this._containerAssets.hidden;
            });
            this._container.append(this._containerAssets);

            this._containerAssets.on('show', () => {
                this.class.remove(CLASS_ASSET_LIST_EMPTY);
            });

            this._containerAssets.on('hide', () => {
                this.class.add(CLASS_ASSET_LIST_EMPTY);
            });

            if (args.allowDragDrop) {
                this._initializeDropTarget();
            }

            this._selectedAssets = [];
            this._indexAssets = {};

            this._values = [];
            this.value = args.value || null;

            this.renderChanges = args.renderChanges || false;

            this.on('change', () => {
                if (this.renderChanges) {
                    this.flash();
                }
            });
        }

        _initializeDropTarget() {
            editor.call('drop:target', {
                ref: this,
                filter: (type, dropData) => {
                    if (dropData.id && type.startsWith('asset') &&
                        (!this._assetType || type === `asset.${this._assetType}`) &&
                        parseInt(dropData.id, 10) !== this.value) {

                        const asset = this._assets.get(dropData.id);
                        if (!asset || asset.get('source')) {
                            return false;
                        }

                        // if asset already added to every observer then
                        // return false
                        if (this._indexAssets[dropData.id] && !this._indexAssets[dropData.id].element.class.contains(CLASS_ASSET_NOT_EVERYWHERE)) {
                            return false;
                        }

                        return true;
                    }

                    return false;
                },
                drop: (type, dropData) => {
                    this._addAssets([parseInt(dropData.id, 10)]);
                }
            });
        }

        _onClickSelectionMode() {
            this._startSelectionMode();
        }

        // Add selected assets to the list
        _onClickAdd() {
            if (!this._selectedAssets.length) return;

            this._addAssets(this._selectedAssets);
            this._selectedAssets.length = 0;
        }

        _addAssets(assets) {
            assets.forEach(assetId => {
                const entry = this._indexAssets[assetId] || this._createAssetItem(assetId);
                entry.count = this._values.length;
                entry.element.class.remove(CLASS_ASSET_NOT_EVERYWHERE);
                if (!entry.element.parent) {
                    this._containerAssets.append(entry.element);
                }

                // add to all values
                this._values.forEach(array => {
                    if (!array) return;
                    if (array.indexOf(assetId) === -1) {
                        array.push(assetId);
                    }
                });
            });

            this.emit('change', this.value);

            if (this._binding) {
                this._binding.addValues(assets.slice());
            }
        }

        // End selection mode
        _onClickDone() {
            this._endSelectionMode();
        }

        // Opens asset picker and gets element into selection mode
        _startSelectionMode() {
            this.class.add(CLASS_ASSET_LIST_SELECTION_MODE);

            this._btnSelectionMode.hidden = true;
            this._labelAddAssets.hidden = false;
            this._containerButtons.hidden = false;

            // clear filter
            this._searchInput.value = '';

            // pick assets and filter them
            this._pickAssets((assets) => {
                this._selectedAssets = assets.filter(asset => {
                    if (this._filterFn) {
                        return this._filterFn(asset);
                    }

                    // do not allow picking legacy scripts
                    if (asset.get('type') === 'script') {
                        const settings = editor.call('settings:project');
                        if (settings && settings.get('useLegacyScripts')) {
                            return false;
                        }
                    }

                    return true;
                }).map(a => parseInt(a.get('id'), 10));

                this._btnAdd.enabled = this._selectedAssets.length > 0;
            });
        }

        _endSelectionMode() {
            editor.call('picker:asset:close');

            this._btnSelectionMode.hidden = false;
            this._labelAddAssets.hidden = true;
            this._containerButtons.hidden = true;

            this.class.remove(CLASS_ASSET_LIST_SELECTION_MODE);
        }

        // Use search filter to filter which assets are visible or hidden
        _onSearchChange(filter) {
            if (! filter) {
                for (const id in this._indexAssets) {
                    this._indexAssets[id].element.hidden = false;
                }
                return;
            }

            const items = [];
            for (const id in this._indexAssets) {
                items.push([this._indexAssets[id].label.value, parseInt(id, 10)]);
            }

            // TODO: use a class here instead of a global seach:items
            const results = editor.call('search:items', items, filter);
            for (const id in this._indexAssets) {
                if (results.indexOf(parseInt(id, 10)) === -1) {
                    this._indexAssets[id].element.hidden = true;
                } else {
                    this._indexAssets[id].element.hidden = false;
                }
            }

        }

        // Opens asset picker and allows asset selection
        _pickAssets(callback) {
            editor.call('picker:asset', {
                type: this._assetType || '*',
                multi: true
            });

            let evt = editor.on('picker:assets', callback);

            editor.once('picker:asset:close', () => {
                evt.unbind();
                evt = null;
                this._endSelectionMode();
            });
        }

        // Selects the specified asset
        _selectAsset(asset) {
            editor.call('selector:set', 'asset', [asset]);

            let folder = null;
            if (asset.get('type') === 'script') {
                const settings = editor.call('settings:project');
                if (settings && settings.get('useLegacyScripts')) {
                    folder = 'scripts';
                }
            }

            if (!folder) {
                const path = asset.get('path');
                if (path.length) {
                    folder = this._assets.get(path[path.length - 1]);
                }
            }

            editor.call('assets:panel:currentFolder', folder);
        }

        // Creates a new element for the specified asset id
        _createAssetItem(assetId) {
            let asset = this._assets.get(assetId);

            const container = new pcui.Container({
                flex: true,
                flexDirection: 'row',
                alignItems: 'center',
                class: CLASS_ASSET_ITEM
            });

            container.dom.setAttribute('data-asset-id', assetId);

            const type = asset ? asset.get('type') : this._assetType;
            // add asset type class
            container.class.add(CLASS_ASSET_ITEM + '-' + type);

            // select asset on click
            container.on('click', () => {
                if (asset) {
                    this._selectAsset(asset);
                }
            });

            // asset name - bind it to the asset name
            const label = new pcui.Label({
                text: asset ? asset.get('name') : 'Missing',
                binding: new pcui.BindingObserversToElement()
            });
            if (asset) {
                label.link(asset, 'name');
            }
            container.append(label);

            // button to remove asset from list
            const btnRemove = new pcui.Button({
                icon: 'E289',
                size: 'small',
                class: CLASS_BUTTON_REMOVE
            });
            btnRemove.on('click', () => {
                this._removeAssetItem(assetId);
            });
            container.append(btnRemove);

            // cache the container with some metadata
            const entry = {
                element: container, // the container
                label: label, // the label element used to get the asset name
                count: 0 // the number of observers that have this asset
            };

            this._indexAssets[assetId] = entry;

            let evtAssetAdd = null;
            if (!asset) {
                evtAssetAdd = this._assets.on('add', item => {
                    if (item.get('id') !== assetId) return;

                    evtAssetAdd.unbind();
                    evtAssetAdd = null;

                    asset = item;

                    container.class.remove(CLASS_ASSET_ITEM + '-' + this._assetType);
                    container.class.add(CLASS_ASSET_ITEM + '-' + item.get('type'));

                    label.text = asset.get('name');
                    label.link(asset, 'name');

                    // select asset on click
                    container.on('click', () => {
                        this._selectAsset(asset);
                    });
                });
            }

            // clean the index when the element is destroyed
            container.on('destroy', () => {
                if (evtAssetAdd) {
                    evtAssetAdd.unbind();
                    evtAssetAdd = null;
                }

                delete this._indexAssets[assetId];
            });

            return entry;
        }

        _removeAssetItem(assetId) {
            const entry = this._indexAssets[assetId];
            if (!entry) return;
            entry.element.destroy();

            // remove from all values
            this._values.forEach(array => {
                if (!array) return;
                const idx = array.indexOf(assetId);
                if (idx !== -1) {
                    array.splice(idx, 1);
                }
            });

            this.emit('change', this.value);

            if (this._binding) {
                this._binding.removeValue(assetId);
            }
        }

        _updateValues(values) {
            this._values = values;

            // zero counts of all existing asset items
            for (const key in this._indexAssets) {
                this._indexAssets[key].count = 0;
            }

            let prevElement = null;
            const appendedIndex = {};

            // for every array in values add all
            // assets to the list
            values.forEach(array => {
                if (!array) return;
                array.forEach(assetId => {
                    const entry = this._indexAssets[assetId] || this._createAssetItem(assetId);
                    entry.count++;
                    if (!appendedIndex[assetId]) {
                        this._containerAssets.appendAfter(entry.element, prevElement);
                        prevElement = entry.element;
                        appendedIndex[assetId] = true;
                    }
                });
            });

            for (const key in this._indexAssets) {
                if (this._indexAssets[key].count === 0) {
                    // delete items that are no longer in the values
                    this._indexAssets[key].element.destroy();
                } else if (this._indexAssets[key].count < values.length) {
                    // this asset is not used by all observers so add special class to it
                    this._indexAssets[key].element.class.add(CLASS_ASSET_NOT_EVERYWHERE);
                } else {
                    // this asset is used by all observers so remove special class
                    this._indexAssets[key].element.class.remove(CLASS_ASSET_NOT_EVERYWHERE);
                }
            }

            const newValue = this.value;

            this.emit('change', newValue);

            return newValue;
        }

        get value() {
            // create value from the list of assets we are currently displaying,
            // this is a lossy concept as it doesn't capture whether an asset id is only
            // in some observers
            const result = [];
            let node = this._containerAssets.dom.childNodes[0];
            while (node) {
                const assetId = parseInt(node.getAttribute('data-asset-id'), 10);
                if (!isNaN(assetId)) {
                    result.push(assetId);
                }

                node = node.nextSibling;
            }

            return result;
        }

        set value(value) {
            if (!value) {
                value = null;
            }

            const current = this.value;
            if (current === value) return;
            if (Array.isArray(value) && value.equals(current)) return;

            // set values property - try to use the existing array length of values
            value = this._updateValues(new Array(this._values.length || 1).fill(value));

            if (this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            if (this._values.equals(values)) return;
            this._updateValues(values);
        }

        // Returns an array of {assetId, element} entries
        // for each animation asset and list item representing it
        get listItems() {
            const result = [];
            for (const assetId in this._indexAssets) {
                result.push({
                    assetId: assetId,
                    element: this._indexAssets[assetId].element
                });
            }

            return result;
        }
    }

    utils.implements(AssetList, pcui.IBindable);

    pcui.Element.register('assets', AssetList, { allowDragDrop: true, renderChanges: true });

    return {
        AssetList: AssetList
    };
})());
