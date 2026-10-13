import type { Observer } from '@playcanvas/observer';
import { Canvas } from '@playcanvas/pcui';

import { FontThumbnailRenderer } from '@/common/thumbnail-renderers/font-thumbnail-renderer';

import { AssetInspectorPreviewBase } from './asset-preview-base';

const CLASS_CANVAS = 'pcui-asset-preview-canvas';
const CLASS_CANVAS_FLIP = 'pcui-asset-preview-canvas-flip';

class FontAssetInspectorPreview extends AssetInspectorPreviewBase {
    _preview: Canvas;

    _renderFrame: number | null = null;

    _previewRenderer: FontThumbnailRenderer;

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
        this._previewRenderer.render();
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
        this._previewRenderer = new FontThumbnailRenderer(assets[0], this._preview.dom as HTMLCanvasElement);
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

export { FontAssetInspectorPreview };
