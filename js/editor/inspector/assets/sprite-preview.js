import { Canvas, Button } from '@playcanvas/pcui';
import { SpriteThumbnailRenderer } from '../../../pcui/asset-thumbnail-renderers/sprite-thumbnail-renderer.js';
import { AssetInspectorPreviewBase } from './asset-preview-base.js';

const CLASS_ROOT = 'asset-sprite-preview';
const CLASS_BUTTON = CLASS_ROOT + '-button';
const CLASS_BUTTON_PLAYING = CLASS_ROOT + '-button-playing';
const CLASS_CANVAS = 'pcui-asset-preview-canvas';

class SpriteAssetInspectorPreview extends AssetInspectorPreviewBase {
    constructor(args) {
        super(args);

        this.class.add(CLASS_ROOT);

        this._preview = new Canvas({
            class: CLASS_CANVAS,
            useDevicePixelRatio: true
        });
        this.append(this._preview);

        this._playButton = new Button({ icon: 'E286', class: CLASS_BUTTON });
        this.append(this._playButton);

        this._renderFrame = false;
        this._fps = 10;
        this._playStartTime = null;
        this._spriteFrames = null;

        this._playButton.on('click', this._onClickPlay.bind(this));
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
        } else {
            this._preview.dom.width = 320;
            this._preview.dom.height = 144;
        }
        if (this._playStartTime !== null) {
            const lapsedTime = Date.now() - this._playStartTime;
            const frameTimeMs = 1000 / this._fps;
            const currentFrame = Math.floor((lapsedTime / frameTimeMs) % this._spriteFrames);
            this._previewRenderer.render(currentFrame, true);
            this._queueRender();
        } else {
            this._previewRenderer.render();
        }
    }

    _toggleSize() {
        super._toggleSize();
        this._queueRender();
    }

    updatePreview() {
        this._queueRender();
    }

    _onClickPlay() {
        if (this._playStartTime === null) {
            this._playStartTime = Date.now();
            this._queueRender();
            this._playButton.class.add(CLASS_BUTTON_PLAYING);
        } else {
            this._playStartTime = null;
            this._playButton.class.remove(CLASS_BUTTON_PLAYING);
        }
    }

    link(assets) {
        super.link(assets);
        this._previewRenderer = new SpriteThumbnailRenderer(assets[0], this._preview.dom, editor.call('assets:raw'));
        this._spriteFrames = assets[0].get('data.frameKeys').length;
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

        this._playStartTime = null;
        this._playButton.class.remove(CLASS_BUTTON_PLAYING);
    }
}

export { SpriteAssetInspectorPreview };
