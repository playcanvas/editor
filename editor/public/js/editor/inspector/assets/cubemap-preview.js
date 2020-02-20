Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-cubemap-preview';
    const CLASS_CONTAINER = CLASS_ROOT + '-container';
    const CLASS_CONTAINER_LARGE = CLASS_CONTAINER + '-large';
    const CLASS_CANVAS = CLASS_ROOT + '-canvas';

    class CubemapAssetInspectorPreview extends pcui.Container {
        constructor(args) {
            super(args);

            this.class.add(CLASS_CONTAINER);

            this._preview = new pcui.Canvas({
                canvasWidth: 320,
                canvasHeight: 144,
                class: CLASS_CANVAS
            });

            this.append(this._preview);

            this._renderQueued = false;
            this._previewRotation = [0, 0];
            this._sx = 0;
            this._sy = 0;
            this._x = 0;
            this._y = 0;
            this._nx = 0;
            this._ny = 0;

            this._domEvtMouseDown = this._onMouseDown.bind(this);
            this._domEvtMouseMove = this._onMouseMove.bind(this);
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
            this._previewRenderer.render(
                Math.max(-90, Math.min(90, this._previewRotation[0] + (this._sy - this._y) * 0.3)),
                this._previewRotation[1] + (this._sx - this._x) * 0.3
            );
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

        _onMouseMove(evt) {
            if (! this._dragging)
                return;

            this._nx = this._x - evt.clientX;
            this._ny = this._y - evt.clientY;
            this._x = evt.clientX;
            this._y = evt.clientY;

            this._queueRender();
        }

        _onMouseUp(evt) {
            if (!this._dragging)
                return;

            if ((Math.abs(this._sx - this._x) + Math.abs(this._sy - this._y)) < 8) {
                if (this.class.contains(CLASS_CONTAINER_LARGE)) {
                    this.class.remove(CLASS_CONTAINER_LARGE);
                } else {
                    this.class.add(CLASS_CONTAINER_LARGE);
                }
                this._preview.dom.height = this.height;
            }

            this._previewRotation[0] = Math.max(-90, Math.min(90, this._previewRotation[0] + ((this._sy - this._y) * 0.3)));
            this._previewRotation[1] += (this._sx - this._x) * 0.3;
            this._sx = this._sy = this._x = this._y = 0;

            this._dragging = false;

            this._queueRender();
        }

        updatePreview() {
            this._queueRender();
        }

        link(assets) {
            this.unlink();
            this._previewRenderer = new pcui.Cubemap3dThumbnailRenderer(assets[0], this._preview.dom);
            this._preview.dom.addEventListener('mousedown', this._domEvtMouseDown, false);
            window.addEventListener('mousemove', this._domEvtMouseMove, false);
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
            window.removeEventListener('mousemove', this._domEvtMouseMove, false);
            window.removeEventListener('mouseup', this._domEvtMouseUp, false);
        }
    }

    return {
        CubemapAssetInspectorPreview: CubemapAssetInspectorPreview
    };
})());
