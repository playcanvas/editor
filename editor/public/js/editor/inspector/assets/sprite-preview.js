Object.assign(pcui, (function () {
    'use strict';

    const CLASS_ROOT = 'asset-sprite-preview';
    const CLASS_CONTAINER = CLASS_ROOT + '-container';
    const CLASS_CONTAINER_LARGE = CLASS_CONTAINER + '-large';
    const CLASS_CANVAS = CLASS_ROOT + '-canvas';
    const CLASS_BUTTON = CLASS_ROOT + '-button';
    const CLASS_BUTTON_PLAYING = CLASS_ROOT + '-button-playing';

    class SpriteAssetInspectorPreview extends pcui.Container {
        constructor(args) {
            super(args);

            this.class.add(CLASS_CONTAINER);

            this._preview = new pcui.Canvas({
                class: CLASS_CANVAS,
                useDevicePixelRatio: true
            });
            this.append(this._preview);

            this._playButton = new pcui.Button({ icon: 'E286', class: CLASS_BUTTON });
            this.append(this._playButton);

            this._renderQueued = false;
            this._fps = 10;
            this._playStartTime = null;
            this._spriteFrames = null;

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
            } else {
                this._preview.dom.width = 320;
                this._preview.dom.height = 144;
            }
            if (this._playStartTime !== null) {
                const lapsedTime = Date.now() - this._playStartTime;
                const frameTimeMs = 1000 / this._fps;
                const currentFrame = Math.floor((lapsedTime / frameTimeMs) % this._spriteFrames) + 1;
                this._previewRenderer.render(currentFrame, true);
                this._queueRender();
            } else {
                this._previewRenderer.render();
            }
        }

        _onMouseDown(evt) {
            if (evt.button !== 0)
                return;

            evt.preventDefault();
            evt.stopPropagation();

            this._dragging = true;
        }

        _onMouseMove(evt) {
            if (! this._dragging)
                return;

            this._queueRender();
        }

        _onMouseUp(evt) {
            if (!this._dragging)
                return;

            if (this.class.contains(CLASS_CONTAINER_LARGE)) {
                this.class.remove(CLASS_CONTAINER_LARGE);
            } else {
                this.class.add(CLASS_CONTAINER_LARGE);
            }
            this._preview.dom.height = this.height;

            this._dragging = false;

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
            this.unlink();
            this._previewRenderer = new pcui.SpriteThumbnailRenderer(assets[0], this._preview.dom, editor.call('assets:raw'));
            this._spriteFrames = assets[0].get('data.frameKeys').length;
            this._preview.dom.addEventListener('mousedown', this._domEvtMouseDown, false);
            window.addEventListener('mousemove', this._domEvtMouseMove, false);
            window.addEventListener('mouseup', this._domEvtMouseUp, false);
            this._playButton.on('click', this._onClickPlay.bind(this));
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
        SpriteAssetInspectorPreview: SpriteAssetInspectorPreview
    };
})());
