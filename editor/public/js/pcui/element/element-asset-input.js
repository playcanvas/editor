Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ASSET_INPUT = 'pcui-asset-input';
    const CLASS_ASSET_INPUT_THUMB = 'pcui-asset-input-thumb';
    const CLASS_ASSET_INPUT_LABEL = 'pcui-asset-input-label';
    const CLASS_ASSET_INPUT_CONTROLS = 'pcui-asset-input-controls';
    const CLASS_ASSET_INPUT_ASSET = 'pcui-asset-input-asset';
    const CLASS_ASSET_INPUT_EDIT = 'pcui-asset-input-edit';
    const CLASS_ASSET_INPUT_REMOVE = 'pcui-asset-input-remove';

    /**
     * @name pcui.AssetInput
     * @classdesc Represents an asset input field. It shows a thumbnail of the asset and
     * allows picking of an asset using an asset picker.
     * @extends pcui.Element
     * @property {String} assetType The type of assets that this input can display. Used when picking assets with the asset picker.
     * @property {pcui.Label} label Gets the label element on the top right of the input.
     * @property {Boolean} renderChanges If true the input will flash when changed.
     * @property {Function} dragEnterFn A function that is called when we drag an item over the element.
     * @property {Function} dragLeaveFn A function that is called when we stop dragging an item over the element.
     * @mixes pcui.IBindable
     */
    class AssetInput extends pcui.Element {
        /**
         * Returns a new AssetInput.
         * @param {Object} args The arguments. Extends the pcui.Element arguments.
         * @param {ObserverList} args.assets The assets observer list.
         * @param {String} [args.text] The text on the top right of the field.
         * @param {String} [args.assetType] The type of assets that this input can display. Used when picking assets with the asset picker.
         * @param {Boolean} [args.allowDragDrop] If true then this will enable drag and drop of assets on the input
         * @param {Function} [args.pickAssetFn] A function to pick an asset and pass its id to the callback parameter. If none is provided
         * the default Editor asset picker will be used.
         * @param {Function} [args.selectAssetFn] A function that selects the asset id passed as a parameter. If none is provided the default
         * Editor selector will be used.
         */
        constructor(args) {
            if (!args) args = {};

            super(document.createElement('div'), args);

            this.class.add(CLASS_ASSET_INPUT);

            // asset thumbnail on the left
            this._thumbnail = new pcui.AssetThumbnail({
                binding: new pcui.BindingObserversToElement(),
                assets: args.assets
            });
            this._thumbnail.class.add(CLASS_ASSET_INPUT_THUMB);
            this.dom.appendChild(this._thumbnail.dom);
            this._thumbnail.parent = this;
            this._thumbnail.on('click', this._onClickThumb.bind(this));

            // input label
            this._label = new pcui.Label({
                text: args.text
            });
            this._label.class.add(CLASS_ASSET_INPUT_LABEL);
            this.dom.appendChild(this._label.dom);
            this._label.parent = this;

            // container for controls
            this._containerControls = new pcui.Container({
                class: CLASS_ASSET_INPUT_CONTROLS
            });
            this.dom.appendChild(this._containerControls.dom);
            this._containerControls.parent = this;

            // asset name
            this._labelAsset = new pcui.Label({
                binding: new pcui.BindingObserversToElement()
            });
            this._labelAsset.class.add(CLASS_ASSET_INPUT_ASSET);
            this._containerControls.append(this._labelAsset);

            // only shown when we are displaying multiple different values
            this._labelVarious = new pcui.Label({
                text: 'various',
                hidden: true
            });
            this._labelVarious.class.add(CLASS_ASSET_INPUT_ASSET);
            this._containerControls.append(this._labelVarious);

            // select asset button
            this._btnEdit = new pcui.Button({
                icon: 'E336'
            });
            this._btnEdit.class.add(CLASS_ASSET_INPUT_EDIT);
            this._containerControls.append(this._btnEdit);
            this._btnEdit.on('click', this._onClickEdit.bind(this));

            // remove asset button
            this._btnRemove = new pcui.Button({
                icon: 'E132'
            });
            this._btnRemove.class.add(CLASS_ASSET_INPUT_REMOVE);
            this._containerControls.append(this._btnRemove);
            this._btnRemove.on('click', this._onClickRemove.bind(this));

            this._assets = args.assets;
            this._assetType = args.assetType;
            this._pickAssetFn = args.pickAssetFn || this._defaultPickAssetFn.bind(this);
            this._selectAssetFn = args.selectAssetFn || this._defaultSelectAssetFn.bind(this);

            this.dragEnterFn = args.dragEnterFn;
            this.dragLeaveFn = args.dragLeaveFn;

            if (args.allowDragDrop) {
                this._initializeDropTarget();
            }

            this.value = args.value || null;

            this.renderChanges = args.renderChanges || false;

            this.on('change', () => {
                if (this.renderChanges) {
                    this._containerControls.flash();
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
                        return !!asset && !asset.get('source');
                    }
                },
                drop: (type, dropData) => {
                    this.value = parseInt(dropData.id, 10);
                },
                over: (type, dropData) => {
                    if (this._dragEnterFn) {
                        this._dragEnterFn(type, dropData);
                    }
                },
                leave: () => {
                    if (this._dragLeaveFn) {
                        this._dragLeaveFn();
                    }
                }
            });
        }

        // Fired when edit button is clicked
        _onClickEdit() {
            this._pickAssetFn((pickedAssetId) => {
                this.value = pickedAssetId;
            });
        }

        // Fired when the thumnail is clicked
        _onClickThumb() {
            this._selectAssetFn(this.value);
        }

        // Fired when remove button is clicked
        _onClickRemove() {
            this.value = null;
        }

        // Default pick asset function. Uses global asset picker
        _defaultPickAssetFn(callback) {
            // TODO: use less global functions here
            editor.call('picker:asset', {
                type: this._assetType || '*',
                currentAsset: this._assets.get(this.value)
            });

            let evt = editor.once('picker:asset', (asset) => {
                evt = null;
                callback(asset.get('id'));
            });

            editor.once('picker:asset:close', () => {
                if (evt) {
                    evt.unbind();
                    evt = null;
                }
            });
        }

        // Default select function. Uses global selector
        _defaultSelectAssetFn(assetId) {
            const asset = this._assets.get(assetId);
            if (! asset) return;

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

        _updateValue(value, force) {
            if (this._value === value && !force) return false;

            this._value = value;

            if (value) {
                let asset;
                if (this._assets) {
                    // try to get the asset
                    asset = this._assets.get(value);
                    if (asset) {
                        // link the asset name to the label
                        this._labelAsset.link(asset, 'name');
                    } else {
                        // if we did not find the asset then show Missing
                        this._labelAsset.unlink();
                        this._labelAsset.text = 'Missing';
                    }
                } else {
                    // no assets registry passed so just show the asset id
                    this._labelAsset.text = value;
                }
            } else {
                // null asset id
                this._labelAsset.text = 'Empty';
            }

            // if we are not bound to anything yet then
            // set the thumbnail value as well
            if (!this.binding || !this.binding.linked) {
                this._thumbnail.value = value;
            }

            this._labelAsset.hidden = false;
            this._labelVarious.hidden = true;

            this.emit('change', value);

            return true;
        }

        link(observers, paths) {
            super.link(observers, paths);
            this._thumbnail.link(observers, paths);
        }

        unlink() {
            super.unlink();
            this._thumbnail.unlink();
        }

        get text() {
            return this._label.value;
        }

        set text(value) {
            this._label.value = value;
        }

        get label() {
            return this._label;
        }

        get value() {
            return this._value;
        }

        get assetType() {
            return this._assetType;
        }

        set assetType(value) {
            this._assetType = value;
        }

        get dragEnterFn() {
            return this._dragEnterFn;
        }

        set dragEnterFn(value) {
            this._dragEnterFn = value;
        }

        get dragLeaveFn() {
            return this._dragLeaveFn;
        }

        set dragLeaveFn(value) {
            this._dragLeaveFn = value;
        }

        set value(value) {
            const forceUpdate = !this._labelVarious.hidden && value === null;
            const changed = this._updateValue(value, forceUpdate);

            if (changed && this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            let different = false;
            const value = values[0];
            for (let i = 1; i < values.length; i++) {
                if (values[i] !== value) {
                    different = true;
                    break;
                }
            }

            if (different) {
                this._updateValue(null);
                this._labelAsset.hidden = true;
                this._labelVarious.hidden = false;
            } else {
                this._updateValue(values[0] || null);
            }
        }

        get renderChanges() {
            return this._renderChanges;
        }

        set renderChanges(value) {
            this._renderChanges = value;
            this._thumbnail.renderChanges = value;
        }
    }

    utils.implements(AssetInput, pcui.IBindable);

    pcui.Element.register('asset', AssetInput, { allowDragDrop: true, renderChanges: true });

    return {
        AssetInput: AssetInput
    };
})());
