import { Assets } from '@playcanvas/editor-api';
import { Canvas } from '@playcanvas/pcui';

import { AssetInspectorPreviewBase } from './asset-preview-base';
import { TemplateThumbnailRenderer } from '../../../common/thumbnail-renderers/template-thumbnail-renderer';

const CLASS_CANVAS = 'pcui-asset-preview-canvas';
const CLASS_CANVAS_FLIP = 'pcui-asset-preview-canvas-flip';

const ROTATION_SPEED = 0.5;

export class TemplateAssetInspectorPreview extends AssetInspectorPreviewBase {
    _preview: Canvas;

    _renderFrame: number | null;

    _previewRenderer?: TemplateThumbnailRenderer;

    private _previewRotation: [number, number] = [-20, 25];

    private _sx = 0;

    private _sy = 0;

    private _x = 0;

    private _y = 0;

    private _nx = 0;

    private _ny = 0;

    constructor(args) {
        super(args);

        this._preview = new Canvas();
        this._preview.class.add(CLASS_CANVAS, CLASS_CANVAS_FLIP);
        this.append(this._preview);

        this._renderFrame = null;
    }

    link(assets: Assets) {
        this.unlink();
        super.link();

        this._previewRenderer = new TemplateThumbnailRenderer(
            assets[0],
            this._preview.dom as HTMLCanvasElement
        );

        this._previewRenderer.on('preview-available', this.handlePreviewAvailable.bind(this));
        this._queueRender();
    }

    handlePreviewAvailable(hasPreview: boolean) {
        this.setHasPreview(hasPreview);
    }

    unlink() {
        super.unlink();

        if (this._previewRenderer) {
            this._previewRenderer.destroy();
            this._previewRenderer = undefined;
        }

        if (this._renderFrame) {
            cancelAnimationFrame(this._renderFrame);
            this._renderFrame = null;
        }
    }

    private _toggleSize() {
        super._toggleSize();
        this._queueRender();
    }

    private _queueRender() {
        if (this._renderFrame || !this._previewRenderer) {
            return;
        }
        this._renderFrame = requestAnimationFrame(this._renderPreview.bind(this));
    }

    private _renderPreview() {
        if (this._renderFrame) {
            cancelAnimationFrame(this._renderFrame);
            this._renderFrame = null;
        }

        if (this.dom.offsetWidth !== 0 && this.dom.offsetHeight !== 0) {
            this._preview.dom.width = this.dom.offsetWidth;
            this._preview.dom.height = this.dom.offsetHeight;
        }

        this._previewRenderer.render(
            this._previewRotation[0] + (this._sy - this._y) * ROTATION_SPEED,
            this._previewRotation[1] + (this._sx - this._x) * ROTATION_SPEED
        );
    }

    private _onMouseDown(evt: MouseEvent) {
        super._onMouseDown(evt);
        if (this._mouseDown) {
            this._sx = this._x = evt.clientX;
            this._sy = this._y = evt.clientY;
        }
    }

    private _onMouseMove(evt: MouseEvent) {
        super._onMouseMove(evt);
        if (this._dragging) {
            this._nx = this._x - evt.clientX;
            this._ny = this._y - evt.clientY;
            this._x = evt.clientX;
            this._y = evt.clientY;

            this._queueRender();
        }
    }

    private _onMouseUp(evt: MouseEvent) {
        if (this._dragging) {
            if ((Math.abs(this._sx - this._x) + Math.abs(this._sy - this._y)) < 8) {
                this._preview.dom.height = this.height;
            }

            this._previewRotation[0] += (this._sy - this._y) * ROTATION_SPEED;
            this._previewRotation[1] += (this._sx - this._x) * ROTATION_SPEED;
            this._sx = this._sy = this._x = this._y = 0;

            this._queueRender();
        }

        super._onMouseUp(evt);
    }
}
