import type { EventHandle } from '@playcanvas/observer';
import type { Panel } from '@playcanvas/pcui';

editor.once('load', () => {
    editor.method('picker:sprites:attributes:frames:preview', (args) => {
        const parent: Panel = editor.call('picker:sprites:rightPanel');

        const atlasAsset = args.atlasAsset;
        let frames = args.frames;
        let frameObservers = frames.map((f) => {
            return atlasAsset.getRaw(`data.frames.${f}`);
        });

        const events: EventHandle[] = [];

        let previewContainer = document.createElement('div');
        previewContainer.classList.add('asset-preview-container');

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        canvas.classList.add('asset-preview');
        previewContainer.append(canvas);

        canvas.addEventListener('click', () => {
            parent.class.toggle('large');
            queueRender();
        }, false);

        parent.class.add('asset-preview');
        parent.dom.insertBefore(previewContainer, parent.domContent);

        let time = 0;
        let playing = true;
        const fps = 10;
        let frame = 0;
        let lastTime = Date.now();

        let renderQueued;

        // queue up the rendering to prevent too often renders
        const queueRender = (): void => {
            if (renderQueued) {
                return;
            }
            renderQueued = true;
            requestAnimationFrame(renderPreview);
        };

        const renderPreview = (): void => {
            if (!previewContainer) {
                return;
            }

            if (renderQueued) {
                renderQueued = false;
            }

            if (playing) {
                const now = Date.now();
                time += (now - lastTime) / 1000;

                frame = Math.floor(time * fps);
                const numFrames = frames.length;
                if (frame >= numFrames) {
                    frame = 0;
                    time -= numFrames / fps;
                }

                lastTime = now;
            }

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            // render
            const frameData = frameObservers[frame] && frameObservers[frame]._data;
            editor.call('picker:sprites:renderFramePreview', frameData, canvas, frameObservers, true);

            if (playing) {
                queueRender();
            }
        };

        renderPreview();

        // render on resize
        events.push(parent.on('resize', queueRender));

        events.push(parent.on('clear', () => {
            parent.class.remove('asset-preview', 'animate');

            previewContainer.remove();
            previewContainer = null;

            playing = false;

            events.forEach(event => event.unbind());
            events.length = 0;
        }));

        return {
            setFrames: (newFrames: string[]): void => {
                frames = newFrames;
                frameObservers = frames.map((f) => {
                    return atlasAsset.getRaw(`data.frames.${f}`);
                });
            }
        };
    });
});
