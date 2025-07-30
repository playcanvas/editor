import { Canvas } from '@playcanvas/pcui';

import { AssetInspectorPreviewBase } from './asset-preview-base.ts';
import { MaterialThumbnailRenderer } from '../../../common/thumbnail-renderers/material-thumbnail-renderer.ts';

const CLASS_CANVAS = 'pcui-asset-preview-canvas';
const CLASS_CANVAS_FLIP = 'pcui-asset-preview-canvas-flip';

class MaterialAssetInspectorPreview extends AssetInspectorPreviewBase {
    constructor(args) {
        super(args);

        this._preview = new Canvas();
        this._preview.dom.width = 320;
        this._preview.dom.height = 144;
        this._preview.class.add(CLASS_CANVAS, CLASS_CANVAS_FLIP);
        this.append(this._preview);

        this._previewModel = 'sphere';
        this._previewRenderer = null;

        this._renderFrame = null;
        this._previewRotation = [-15, 45];
        this._sx = 0;
        this._sy = 0;
        this._x = 0;
        this._y = 0;
        this._nx = 0;
        this._ny = 0;
    }

    // queue up the rendering to prevent too often renders
    _queueRender() {
        if (this._renderFrame) return;
        this._renderFrame = requestAnimationFrame(this._renderPreview.bind(this));
    }

    _renderPreview() {
        if (this._renderFrame) {
            cancelAnimationFrame(this._renderFrame);
            this._renderFrame = null;
        }

        if (this.dom.offsetWidth !== 0 && this.dom.offsetHeight !== 0) {
            this._preview.dom.width = this.dom.offsetWidth;
            this._preview.dom.height = this.dom.offsetHeight;
        }

        this._previewRenderer.render(
            Math.max(-90, Math.min(90, this._previewRotation[0] + (this._sy - this._y) * 0.3)),
            this._previewRotation[1] + (this._sx - this._x) * 0.3,
            this._previewModel
        );
    }

    _onMouseDown(evt) {
        super._onMouseDown(evt);

        if (this._mouseDown) {
            this._sx = this._x = evt.clientX;
            this._sy = this._y = evt.clientY;
        }
    }

    _onMouseMove(evt) {
        super._onMouseMove(evt);

        if (this._dragging) {
            this._nx = this._x - evt.clientX;
            this._ny = this._y - evt.clientY;
            this._x = evt.clientX;
            this._y = evt.clientY;

            this._queueRender();
        }
    }

    _onMouseUp(evt) {
        if (this._dragging) {
            if ((Math.abs(this._sx - this._x) + Math.abs(this._sy - this._y)) < 8) {
                this._preview.dom.height = this.height;
            }

            this._previewRotation[0] = Math.max(-90, Math.min(90, this._previewRotation[0] + ((this._sy - this._y) * 0.3)));
            this._previewRotation[1] += (this._sx - this._x) * 0.3;
            this._sx = this._sy = this._x = this._y = 0;

            this._queueRender();
        }

        super._onMouseUp(evt);
    }

    _toggleSize() {
        super._toggleSize();
        this._queueRender();
    }

    updatePreview() {
        this._queueRender();
    }

    link(assets) {
        this.unlink();
        super.link();

        this._previewRenderer = new MaterialThumbnailRenderer(assets[0], this._preview.dom);
        this._queueRender();
    }

    unlink() {
        super.unlink();

        if (this._previewRenderer) {
            this._previewRenderer.destroy();
            this._previewRenderer = null;
        }
        if (this._renderFrame) {
            cancelAnimationFrame(this._renderFrame);
            this._renderFrame = null;
        }
    }
}

export { MaterialAssetInspectorPreview };
