import type { Observer } from '@playcanvas/observer';
import { Canvas } from '@playcanvas/pcui';

import { ModelThumbnailRenderer } from '@/common/thumbnail-renderers/model-thumbnail-renderer';

import { AssetInspectorPreviewBase } from './asset-preview-base';

const CLASS_CANVAS = 'pcui-asset-preview-canvas';
const CLASS_CANVAS_FLIP = 'pcui-asset-preview-canvas-flip';

class ModelAssetInspectorPreview extends AssetInspectorPreviewBase {
    _preview: Canvas;

    _renderFrame: number | null = null;

    _previewRenderer: ModelThumbnailRenderer;

    private _previewRotation: [number, number] = [-15, 45];

    private _sx = 0;

    private _sy = 0;

    private _x = 0;

    private _y = 0;

    constructor(args: Record<string, unknown>) {
        super(args);

        this._preview = new Canvas({
            class: [CLASS_CANVAS, CLASS_CANVAS_FLIP],
            useDevicePixelRatio: true
        });
        this._preview.resize(320, 144);
        this.append(this._preview);
        this._previewElement = this._preview.dom as HTMLElement;
    }

    // queue up the rendering to prevent too often renders
    _queueRender() {
        if (this._renderFrame) {
            return;
        }

        this._renderFrame = requestAnimationFrame(this._renderPreview.bind(this));
    }

    _renderPreview() {
        if (this._renderFrame) {
            cancelAnimationFrame(this._renderFrame);
            this._renderFrame = null;
        }

        if (this.dom.offsetWidth !== 0 && this.dom.offsetHeight !== 0) {
            this._preview.resize(this.dom.offsetWidth, this.dom.offsetHeight);
        }
        this._previewRenderer.render(
            Math.max(-90, Math.min(90, this._previewRotation[0] + (this._sy - this._y) * 0.3)),
            this._previewRotation[1] + (this._sx - this._x) * 0.3
        );
    }

    _onPointerDown(evt: PointerEvent) {
        super._onPointerDown(evt);

        if (this._pointerId === evt.pointerId) {
            this._sx = this._x = evt.clientX;
            this._sy = this._y = evt.clientY;
        }
    }

    _onPointerMove(evt: PointerEvent) {
        super._onPointerMove(evt);

        if (this._pointerId === evt.pointerId && this._dragging) {
            this._x = evt.clientX;
            this._y = evt.clientY;

            this._queueRender();
        }
    }

    _onPointerUp(evt: PointerEvent) {
        if (this._pointerId === evt.pointerId && this._dragging) {
            if ((Math.abs(this._sx - this._x) + Math.abs(this._sy - this._y)) < 8) {
                this._preview.height = this.height;
            }

            this._previewRotation[0] = Math.max(-90, Math.min(90, this._previewRotation[0] + ((this._sy - this._y) * 0.3)));
            this._previewRotation[1] += (this._sx - this._x) * 0.3;
            this._sx = this._sy = this._x = this._y = 0;

            this._queueRender();
        }

        super._onPointerUp(evt);
    }

    _toggleSize() {
        super._toggleSize();
        this._queueRender();
    }

    updatePreview() {
        this._queueRender();
    }

    link(assets: Observer[]) {
        this.unlink();
        super.link();

        this._previewRenderer = new ModelThumbnailRenderer(assets[0], this._preview.dom as HTMLCanvasElement);
        this._queueRender();
    }

    unlink() {
        super.unlink();

        if (this._previewRenderer) {
            this._previewRenderer.destroy();
        }
        if (this._renderFrame) {
            cancelAnimationFrame(this._renderFrame);
            this._renderFrame = null;
        }
    }
}

export { ModelAssetInspectorPreview };
