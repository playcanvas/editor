import type { EventHandle, Observer } from '@playcanvas/observer';
import { Container, type ContainerArgs } from '@playcanvas/pcui';

interface SpritePreviewContainerArgs extends ContainerArgs {
    atlasAsset: Observer;
    frames: string[];
}

/**
 * A container that displays an animated preview of sprite frames.
 * Click on the preview to toggle between normal and large size.
 */
export class SpritePreviewContainer extends Container {
    private _atlasAsset: Observer;

    private _frames: string[];

    private _frameObservers: any[];

    private _canvas: HTMLCanvasElement;

    private _time: number = 0;

    private _playing: boolean = true;

    private _fps: number = 10;

    private _frame: number = 0;

    private _lastTime: number = Date.now();

    private _renderQueued: boolean = false;

    private _resizeTarget: Container | null = null;

    private _resizeEvents: EventHandle[] = [];

    constructor(args: SpritePreviewContainerArgs) {
        super({
            ...args,
            class: ['asset-preview-container']
        });

        this._atlasAsset = args.atlasAsset;
        this._frames = args.frames;
        this._frameObservers = this._frames.map(f => this._atlasAsset.getRaw(`data.frames.${f}`));

        this._canvas = document.createElement('canvas');
        this._canvas.width = 256;
        this._canvas.height = 256;
        this._canvas.classList.add('asset-preview');
        this.dom.appendChild(this._canvas);

        this._canvas.addEventListener('click', this._onCanvasClick);

        this._queueRender();
    }

    private _onCanvasClick = (): void => {
        this._resizeTarget?.class.toggle('large');
        this._queueRender();
    };

    private _queueRender = (): void => {
        if (this._renderQueued) {
            return;
        }
        this._renderQueued = true;
        requestAnimationFrame(this._renderPreview);
    };

    private _renderPreview = (): void => {
        if (this.destroyed) {
            return;
        }

        this._renderQueued = false;

        if (this._playing) {
            const now = Date.now();
            this._time += (now - this._lastTime) / 1000;

            this._frame = Math.floor(this._time * this._fps);
            const numFrames = this._frames.length;
            if (this._frame >= numFrames) {
                this._frame = 0;
                this._time -= numFrames / this._fps;
            }

            this._lastTime = now;
        }

        this._canvas.width = this._canvas.clientWidth;
        this._canvas.height = this._canvas.clientHeight;

        // render
        const frameData = this._frameObservers[this._frame]?._data;
        editor.call('picker:sprites:renderFramePreview', frameData, this._canvas, this._frameObservers, true);

        if (this._playing) {
            this._queueRender();
        }
    };

    /**
     * Sets a target container that will have 'large' class toggled when preview is clicked,
     * and will trigger re-renders on resize.
     *
     * @param target - The container to use for resize events and large toggle.
     */
    set resizeTarget(target: Container | null) {
        // Unbind previous events
        this._resizeEvents.forEach(e => e.unbind());
        this._resizeEvents.length = 0;

        this._resizeTarget = target;

        if (target) {
            target.class.add('asset-preview');
            this._resizeEvents.push(target.on('resize', this._queueRender));
        }
    }

    get resizeTarget(): Container | null {
        return this._resizeTarget;
    }

    /**
     * Updates the frames to display in the preview.
     *
     * @param frames - The new array of frame keys.
     */
    setFrames(frames: string[]): void {
        this._frames = frames;
        this._frameObservers = this._frames.map(f => this._atlasAsset.getRaw(`data.frames.${f}`));
    }

    override destroy(): void {
        if (this.destroyed) {
            return;
        }

        this._playing = false;

        this._resizeTarget?.class.remove('asset-preview', 'animate', 'large');
        this._resizeTarget = null;

        this._resizeEvents.forEach(event => event.unbind());
        this._resizeEvents.length = 0;

        this._canvas.removeEventListener('click', this._onCanvasClick);

        super.destroy();
    }
}
