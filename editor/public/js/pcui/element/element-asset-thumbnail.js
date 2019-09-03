Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ASSET_THUMB = 'pcui-asset-thumb';
    const CLASS_ASSET_THUMB_EMPTY = 'pcui-asset-thumb-empty';
    const CLASS_ASSET_THUMB_MISSING = 'pcui-asset-thumb-missing';
    const CLASS_FLIP_Y = 'flip-y';

    /**
     * @name pcui.AssetThumbnail
     * @classdesc Shows an asset thumbnail. Depending on the asset type that can be an image or a canvas rendering.
     * @extends pcui.Element
     */
    class AssetThumbnail extends pcui.Element {
        /**
         * Creates a new pcui.AssetThumbnail.
         * @param {Object} args The arguments
         * @param {ObserverList} args.assets The assets list
         */
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('div'), args);

            this.class.add(CLASS_ASSET_THUMB, CLASS_ASSET_THUMB_EMPTY);

            this._assets = args.assets;

            this._domImage = null;
            this._domCanvas = null;

            this._canvasRenderer = null;
            this._renderCanvasTimeout = null;

            this._evtThumbnailSet = null;
            this._evtThumbnailUnset = null;

            this.value = args.value || null;
        }

        _showImageThumbnail(asset) {
            this._destroyCanvas();
            this._createImage();

            let src;
            if (!asset) {
                src = `${config.url.home}/editor/scene/img/asset-placeholder-texture.png`;
            } else {
                if (asset.has('thumbnails.m')) {
                    src = asset.get('thumbnails.m');
                    if (!src.startsWith('data:image/png;base64')) {
                        src = config.url.home + src.appendQuery('t=' + asset.get('file.hash'));
                    }
                } else {
                    src = `${config.url.home}/editor/scene/img/asset-placeholder-${asset.get('type')}.png`;
                }
            }

            this._domImage.src = src;
        }

        // Wait until the element is displayed and has a valid width and height
        // before attempting to create a new canvas and render a thumbnail, otherwise
        // an exception will be raised because we will be trying to create a canvas
        // with 0 width / height.
        _renderCanvasThumbnailWhenReady(asset) {
            if (this._renderCanvasTimeout) {
                clearTimeout(this._renderCanvasTimeout);
                this._renderCanvasTimeout = null;
            }

            if (this.hidden || this._destroyed) return;

            if (!this.width || !this.height) {
                this._renderCanvasTimeout = setTimeout(() => {
                    this._renderCanvasThumbnailWhenReady(asset);
                });
                return;
            }

            this._renderCanvasThumbnail(asset);
        }

        _renderCanvasThumbnail(asset) {
            this._destroyImage();
            this._createCanvas();

            var type = asset.get('type');
            var renderer;
            switch (type) {
                case 'cubemap':
                    renderer = new pcui.CubemapThumbnailRenderer(asset, this._domCanvas, this._assets);
                    break;
                case 'font':
                    renderer = new pcui.FontThumbnailRenderer(asset, this._domCanvas);
                    break;
                case 'material':
                    renderer = new pcui.MaterialThumbnailRenderer(asset, this._domCanvas);
                    break;
                case 'model':
                    renderer = new pcui.ModelThumbnailRenderer(asset, this._domCanvas);
                    break;
                case 'sprite':
                    renderer = new pcui.SpriteThumbnailRenderer(asset, this._domCanvas, this._assets);
                    break;
            }

            this._canvasRenderer = renderer;

            this._canvasRenderer.render();

            if (type !== 'sprite' && type !== 'cubemap') {
                this._domCanvas.classList.add(CLASS_FLIP_Y);
            } else {
                this._domCanvas.classList.remove(CLASS_FLIP_Y);
            }
        }

        _createImage() {
            if (this._domImage) return;
            this._domImage = new Image();
            this.dom.appendChild(this._domImage);
        }

        _destroyImage() {
            if (!this._domImage) return;
            this.dom.removeChild(this._domImage);
            this._domImage = null;
        }

        _createCanvas() {
            if (this._domCanvas) return;

            this._domCanvas = document.createElement('canvas');
            this._domCanvas.width = this.width;
            this._domCanvas.height = this.height;
            this.dom.appendChild(this._domCanvas);
        }

        _destroyCanvas() {
            if (this._renderCanvasTimeout) {
                clearTimeout(this._renderCanvasThumbnail);
                this._renderCanvasThumbnail = null;
            }

            if (!this._domCanvas) return;
            this.dom.removeChild(this._domCanvas);
            this._domCanvas = null;
        }

        _updateValue(value) {
            if (this._value === value) return false;

            this._value = value;

            this._onChange(value);

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

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
            const asset = this._assets.get(value);
            if (!asset) {
                this.class.add(CLASS_ASSET_THUMB_MISSING);
                this._showImageThumbnail(null);
                return;
            }

            var type = asset.get('type');

            if (type === 'cubemap' || type === 'font' || type === 'material' || type === 'model' || type === 'sprite') {
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

        destroy() {
            if (this._destroyed) return;

            this._destroyImage();
            this._destroyCanvas();

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

    utils.implements(AssetThumbnail, pcui.IBindable);

    return {
        AssetThumbnail: AssetThumbnail
    };
})());
