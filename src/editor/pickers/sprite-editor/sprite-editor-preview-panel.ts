import type { EventHandle, Observer } from '@playcanvas/observer';
import { Container, type ContainerArgs } from '@playcanvas/pcui';

interface SpritePreviewContainerArgs extends ContainerArgs {
    atlasAsset: Observer;
    frames: string[];
}

class SpritePreviewContainer extends Container {
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

    private _parentPanel: Container | null = null;

    private _parentEvents: EventHandle[] = [];

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
        this._parentPanel?.class.toggle('large');
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
     * Attaches the preview to a parent panel. The preview is inserted before the panel's content
     * so it remains fixed while the content scrolls.
     *
     * @param parent - The parent panel to attach to.
     */
    attachToPanel(parent: Container): void {
        this._parentPanel = parent;
        parent.class.add('asset-preview');
        parent.dom.insertBefore(this.dom, parent.domContent);

        // render on resize
        this._parentEvents.push(parent.on('resize', this._queueRender));

        // clean up when parent clears
        this._parentEvents.push(parent.on('clear', () => {
            this.destroy();
        }));
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

        this._parentPanel?.class.remove('asset-preview', 'animate');
        this._parentPanel = null;

        this._parentEvents.forEach(event => event.unbind());
        this._parentEvents.length = 0;

        this._canvas.removeEventListener('click', this._onCanvasClick);

        // Remove DOM element explicitly since we bypassed PCUI's parent tracking
        this.dom.remove();

        super.destroy();
    }
}

editor.once('load', () => {
    editor.method('picker:sprites:attributes:frames:preview', (args: { atlasAsset: Observer; frames: string[] }) => {
        const parent: Container = editor.call('picker:sprites:rightPanel');

        const preview = new SpritePreviewContainer({
            atlasAsset: args.atlasAsset,
            frames: args.frames
        });

        preview.attachToPanel(parent);

        return preview;
    });
});
