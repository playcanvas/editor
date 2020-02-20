Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-font-preview';
    const CLASS_CONTAINER = CLASS_ROOT + '-container';
    const CLASS_CONTAINER_LARGE = CLASS_CONTAINER + '-large';
    const CLASS_CANVAS = CLASS_ROOT + '-canvas';

    class FontAssetInspectorPreview extends pcui.Container {
        constructor(args) {
            super(args);

            this.class.add(CLASS_CONTAINER);

            this._preview = new pcui.Canvas({
                canvasWidth: 320,
                canvasHeight: 144,
                class: CLASS_CANVAS,
                useDevicePixelRatio: true
            });

            this.append(this._preview);

            this._renderQueued = false;

            this._domEvtMouseDown = this._onMouseDown.bind(this);
            this._domEvtMouseUp = this._onMouseUp.bind(this);
        }

        // queue up the rendering to prevent too often renders
        _queueRender() {
            if (this._renderQueued) return;
            this._renderQueued = true;
            this._requestedAnimationFrameID = requestAnimationFrame(this._renderPreview.bind(this));
        }


        _renderPreview() {
            if (this._renderQueued)
                this._renderQueued = false;
            if (this.dom.offsetWidth !== 0 && this.dom.offsetHeight !== 0) {
                this._preview.dom.width = this.dom.offsetWidth;
                this._preview.dom.height = this.dom.offsetHeight;
            }
            this._previewRenderer.render();
        }

        _onMouseDown(evt) {
            if (evt.button !== 0)
                return;

            evt.preventDefault();
            evt.stopPropagation();

            this._sx = this._x = evt.clientX;
            this._sy = this._y = evt.clientY;
            this._dragging = true;
        }

        _onMouseUp(evt) {
            if (!this._dragging)
                return;

            if (this.class.contains(CLASS_CONTAINER_LARGE)) {
                this.class.remove(CLASS_CONTAINER_LARGE);
            } else {
                this.class.add(CLASS_CONTAINER_LARGE);
            }

            this._dragging = false;

            this._queueRender();
        }

        updatePreview() {
            this._queueRender();
        }

        link(assets) {
            this.unlink();
            this._previewRenderer = new pcui.FontThumbnailRenderer(assets[0], this._preview.dom);
            this._preview.dom.addEventListener('mousedown', this._domEvtMouseDown, false);
            window.addEventListener('mouseup', this._domEvtMouseUp, false);
            this._renderPreview();
        }

        unlink() {
            super.unlink();
            if (this._previewRenderer) {
                this._previewRenderer.destroy();
            }
            if (this._requestedAnimationFrameID) {
                cancelAnimationFrame(this._requestedAnimationFrameID);
            }
            this._preview.dom.removeEventListener('mousedown', this._domEvtMouseDown, false);
            window.removeEventListener('mouseup', this._domEvtMouseUp, false);
        }
    }

    return {
        FontAssetInspectorPreview: FontAssetInspectorPreview
    };
})());
