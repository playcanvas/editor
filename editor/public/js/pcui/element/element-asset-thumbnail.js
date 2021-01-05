Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ASSET_THUMB = 'pcui-asset-thumb';
    const CLASS_ASSET_THUMB_EMPTY = 'pcui-asset-thumb-empty';
    const CLASS_ASSET_THUMB_MISSING = 'pcui-asset-thumb-missing';
    const CLASS_ASSET_PREFIX = 'asset-icon-prefix';
    const CLASS_FLIP_Y = 'flip-y';

    const CANVAS_TYPES = {
        'cubemap': true,
        'font': true,
        'material': true,
        'model': true,
        'sprite': true,
        'render': true
    };

    /**
     * @name pcui.AssetThumbnail
     * @classdesc Shows an asset thumbnail. Depending on the asset type that can be an image or a canvas rendering.
     * @property {Boolean} renderChanges If true the input will flash when changed.
     * @extends pcui.Element
     */
    class AssetThumbnail extends pcui.Element {
        /**
         * Creates a new pcui.AssetThumbnail.
         * @param {Object} args The arguments
         * @param {ObserverList} args.assets The assets list
         * @param {Observer} [args.sceneSettings] The scene settings
         * @param {Number} [args.canvasWidth] Fixed width for the canvas. Increases performance but uses same canvas resolution every time.
         * @param {Number} [args.canvasHeight] Fixed height for the canvas. Increases performance but uses same canvas resolution every time.
         */
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('span'), args);

            this.class.add(CLASS_ASSET_THUMB, CLASS_ASSET_THUMB_EMPTY);

            this._assets = args.assets;
            this._sceneSettings = args.sceneSettings;

            this._domImage = null;
            this._domCanvas = null;

            this._canvasRenderer = null;
            this._canvasDirty = false;
            this._renderCanvasTimeout = null;

            this._evtThumbnailSet = null;
            this._evtThumbnailUnset = null;

            this._previousAssetType = null;

            if (args.canvasWidth) {
                this._canvasWidth = args.canvasWidth;
            }
            if (args.canvasHeight) {
                this._canvasHeight = args.canvasHeight;
            }

            this._evtAdd = null;

            this.value = args.value || null;

            this.renderChanges = args.renderChanges || false;


            this.on('change', () => {
                if (this.renderChanges) {
                    this.flash();
                }
            });

            this.on('showToRoot', () => {
                if (!this._canvasDirty || !this.value) return;

                const asset = this._getAsset(this.value);
                if (this._shouldRenderCanvasThumbnailForAsset(asset)) {
                    this._renderCanvasThumbnailWhenReady(asset);
                }
            });
        }

        _enableFontIcons(asset) {
            this._previousAssetType = 'type-' + asset.get('type');
            this.class.add(CLASS_ASSET_PREFIX);
            this.class.add(this._previousAssetType);
            if (asset.get('source')) {
                this.class.add(this._previousAssetType + '-source');
            }
        }

        _disableFontIcons() {
            if (this._previousAssetType) {
                this.class.remove(CLASS_ASSET_PREFIX);
                this.class.remove(this._previousAssetType);
                this.class.remove(this._previousAssetType + '-source');
                this._previousAssetType = null;
            }
        }

        _showImageThumbnail(asset) {
            this._destroyCanvas();
            this._createImage();

            this._disableFontIcons();

            let src;
            if (asset && asset.has('thumbnails.m')) {
                src = asset.get('thumbnails.m');
                if (!src.startsWith('data:image/png;base64')) {
                    src = config.url.home + src.appendQuery('t=' + asset.get('file.hash'));
                }
            } else if (!asset) {
                src = `${config.url.home}/editor/scene/img/asset-placeholder-texture.png`;
            }

            if (src) {
                this._domImage.src = src;
                return;
            }

            this._enableFontIcons(asset);
        }

        // Wait until the element is displayed and has a valid width and height
        // before attempting to create a new canvas and render a thumbnail, otherwise
        // an exception will be raised because we will be trying to create a canvas
        // with 0 width / height.
        _renderCanvasThumbnailWhenReady(asset) {
            this._canvasDirty = true;

            if (this._renderCanvasTimeout) {
                clearTimeout(this._renderCanvasTimeout);
                this._renderCanvasTimeout = null;
            }

            this._destroyImage();
            this._createCanvas();

            if (this.hiddenToRoot || this._destroyed) return;

            if (!this._canvasWidth && !this.width || !this._canvasHeight && !this.height) {
                this._renderCanvasTimeout = setTimeout(() => {
                    this._renderCanvasThumbnailWhenReady(asset);
                });
                return;
            }

            this._renderCanvasThumbnail(asset);
        }

        _renderCanvasThumbnail(asset) {
            if (this._renderCanvasTimeout) {
                clearTimeout(this._renderCanvasTimeout);
                this._renderCanvasTimeout = null;
            }

            this._destroyImage();
            this._createCanvas();

            var type = asset.get('type');

            if (this._canvasRenderer) {
                this._canvasRenderer.destroy();
                this._canvasRenderer = null;
            }

            switch (type) {
                case 'cubemap':
                    this._canvasRenderer = new pcui.CubemapThumbnailRenderer(asset, this._domCanvas, this._assets);
                    break;
                case 'font':
                    this._canvasRenderer = new pcui.FontThumbnailRenderer(asset, this._domCanvas);
                    break;
                case 'material':
                    this._canvasRenderer = new pcui.MaterialThumbnailRenderer(asset, this._domCanvas, this._sceneSettings);
                    break;
                case 'model':
                    this._canvasRenderer = new pcui.ModelThumbnailRenderer(asset, this._domCanvas);
                    break;
                case 'sprite':
                    this._canvasRenderer = new pcui.SpriteThumbnailRenderer(asset, this._domCanvas, this._assets);
                    break;
                case 'render':
                    this._canvasRenderer = new pcui.RenderThumbnailRenderer(asset, this._domCanvas, this._assets);
                    break;
            }


            this._canvasRenderer.queueRender();

            if (type !== 'sprite' && type !== 'cubemap') {
                this._domCanvas.classList.add(CLASS_FLIP_Y);
            } else {
                this._domCanvas.classList.remove(CLASS_FLIP_Y);
            }

            this._canvasDirty = false;
        }

        _createImage() {
            if (this._domImage) return;
            this._domImage = new Image();
            this.dom.appendChild(this._domImage);
        }

        _destroyImage() {
            if (!this._domImage) return;

            this._disableFontIcons();

            this.dom.removeChild(this._domImage);

            this._domImage = null;
        }

        _createCanvas() {
            let appendCanvas = false;

            const width = this._canvasWidth || this.width || 64;
            const height = this._canvasHeight || this.height || 64;

            if (!this._domCanvas) {
                this._domCanvas = document.createElement('canvas');
                appendCanvas = true;
            }

            if (this._domCanvas.width !== width) {
                this._domCanvas.width = width;
            }
            if (this._domCanvas.height !== height) {
                this._domCanvas.height = height;
            }

            if (appendCanvas) {
                this.dom.appendChild(this._domCanvas);
            }
        }

        _destroyCanvas() {
            if (this._renderCanvasTimeout) {
                clearTimeout(this._renderCanvasTimeout);
                this._renderCanvasTimeout = null;
            }

            if (!this._domCanvas) return;
            this.dom.removeChild(this._domCanvas);
            this._domCanvas = null;
        }

        _updateValue(value) {
            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            if (this._value === value) return false;

            this._value = value;

            this._onChange(value);

            if (value instanceof Observer) {
                value = value.get('id');
            }

            this.emit('change', value);

            return true;
        }

        _onChange(value) {
            if (this._evtThumbnailSet) {
                this._evtThumbnailSet.unbind();
                this._evtThumbnailSet = null;
            }

            if (this._evtThumbnailUnset) {
                this._evtThumbnailUnset.unbind();
                this._evtThumbnailUnset = null;
            }

            if (this._canvasRenderer) {
                this._canvasRenderer.destroy();
                this._canvasRenderer = null;
                this._canvasDirty = false;
            }

            if (this._evtAdd) {
                this._evtAdd.unbind();
                this._evtAdd = null;
            }

            this.class.remove(CLASS_ASSET_THUMB_MISSING);

            if (value) {
                this.class.remove(CLASS_ASSET_THUMB_EMPTY);
            } else {
                this.class.add(CLASS_ASSET_THUMB_EMPTY);
            }

            // don't show anything on null value
            if (!value) {
                this._destroyImage();
                this._destroyCanvas();
                return;
            }

            // show placeholder image on missing asset
            const asset = this._getAsset(value);
            if (!asset) {
                this.class.add(CLASS_ASSET_THUMB_MISSING);
                this._showImageThumbnail(null);

                const id = (value instanceof Observer ? value.get('id') : value);
                this._evtAdd = this._assets.once(`add[${id}]`, (asset) => {
                    this._onChange(asset);
                });

                return;
            }

            if (this._shouldRenderCanvasThumbnailForAsset(asset)) {
                this._renderCanvasThumbnailWhenReady(asset);
            } else {
                this._showImageThumbnail(asset);

                this._evtThumbnailSet = asset.on('thumbnails.m:set', () => {
                    this._showImageThumbnail(asset);
                });
                this._evtThumbnailUnset = asset.on('thumbnails.m:unset', () => {
                    this._showImageThumbnail(asset);
                });
            }
        }

        _getAsset(value) {
            return value instanceof Observer ? value : this._assets.get(value);
        }

        _shouldRenderCanvasThumbnailForAsset(asset) {
            return asset && !asset.get('source') && CANVAS_TYPES[asset.get('type')];
        }

        onResize() {
            const asset = this._getAsset(this.value);
            if (this._shouldRenderCanvasThumbnailForAsset(asset)) {
                this._renderCanvasThumbnailWhenReady(asset);
            }
        }

        destroy() {
            if (this._destroyed) return;

            this._destroyImage();
            this._destroyCanvas();

            if (this._evtAdd) {
                this._evtAdd.unbind();
                this._evtAdd = null;
            }

            if (this._evtThumbnailSet) {
                this._evtThumbnailSet.unbind();
                this._evtThumbnailSet = null;
            }

            if (this._evtThumbnailUnset) {
                this._evtThumbnailUnset.unbind();
                this._evtThumbnailUnset = null;
            }

            super.destroy();
        }

        get value() {
            return this._value;
        }

        set value(value) {
            const changed = this._updateValue(value);

            if (changed && this._binding) {
                if (value instanceof Observer) {
                    value = value.get('id');
                }
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
                this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            } else {
                this._updateValue(values[0]);
            }
        }
    }

    utils.implements(AssetThumbnail, pcui.IBindable, { renderChanges: true });

    return {
        AssetThumbnail: AssetThumbnail
    };
})());
