import { Canvas } from '@playcanvas/pcui';

Object.assign(pcui, (function () {
    const CLASS_CANVAS = 'pcui-asset-preview-canvas';
    const CLASS_CANVAS_FLIP = 'pcui-asset-preview-canvas-flip';

    class FontAssetInspectorPreview extends pcui.AssetInspectorPreviewBase {
        constructor(args) {
            super(args);

            this._preview = new Canvas({
                canvasWidth: 320,
                canvasHeight: 144,
                class: [CLASS_CANVAS, CLASS_CANVAS_FLIP],
                useDevicePixelRatio: true
            });

            this.append(this._preview);

            this._renderFrame = null;
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
            this._previewRenderer.render();
        }

        _toggleSize() {
            super._toggleSize();
            this._queueRender();
        }

        updatePreview() {
            this._queueRender();
        }

        link(assets) {
            super.link(assets);
            this._previewRenderer = new pcui.FontThumbnailRenderer(assets[0], this._preview.dom);
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

    return {
        FontAssetInspectorPreview: FontAssetInspectorPreview
    };
})());
