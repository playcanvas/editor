import type { EventHandle } from '@playcanvas/observer';
import { Button, Container, Label, Panel } from '@playcanvas/pcui';

const BUTTON_TEXT = 'UPLOAD TEXTURE PACKER JSON';

interface TexturePackerFrame {
    frame: { x: number; y: number; w: number; h: number };
    pivot?: { x: number; y: number };
    borders?: { x: number; y: number; w: number; h: number };
    filename?: string;
}

interface TexturePackerData {
    meta: { size: { w: number; h: number } };
    frames: Record<string, TexturePackerFrame>;
}

editor.once('load', () => {
    editor.method('picker:sprites:attributes:importFrames', (args) => {
        const events: EventHandle[] = [];
        const atlasAsset = args.atlasAsset;

        const rootPanel = editor.call('picker:sprites:rightPanel');
        const rootPanelContent: Container = editor.call('picker:sprites:rightPanelContent');

        const panel = new Panel({
            headerText: 'IMPORT FRAME DATA'
        });
        rootPanelContent.append(panel);

        panel.enabled = editor.call('permissions:write');

        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            panel.enabled = canWrite;
        }));

        const panelError = new Panel({
            headerText: 'Invalid TexturePacker JSON file',
            class: 'import-error',
            flex: true,
            hidden: true
        });
        panel.append(panelError);

        const labelError = new Label({
            text: 'Please upload a valid JSON file that has been created with TexturePacker.'
        });
        panelError.append(labelError);

        const btnCloseError = new Button({
            icon: 'E132',
            class: ['icon-button', 'close']
        });
        panelError.header.append(btnCloseError);

        btnCloseError.on('click', () => {
            panelError.hidden = true;
        });

        const buttonContainer = new Container({
            flex: true,
            class: 'action-buttons'
        });
        panel.append(buttonContainer);

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.accept = '.json';
        hiddenInput.style.display = 'none';
        panel.innerElement.append(hiddenInput);

        const btnImport = new Button({
            text: BUTTON_TEXT,
            icon: 'E222',
            class: 'wide'
        });
        buttonContainer.append(btnImport);

        const resetButton = (): void => {
            btnImport.text = BUTTON_TEXT;
            btnImport.disabled = false;
        };

        const showError = (message: string): void => {
            labelError.text = message;
            panelError.hidden = false;
        };

        btnImport.on('click', () => {
            panelError.hidden = true;

            const currentFrames = atlasAsset.getRaw('data.frames')._data;
            const hasFrames = Object.keys(currentFrames).length > 0;

            if (hasFrames) {
                editor.call('picker:confirm', 'Uploading frame data will replace all current frames - Are you sure you want to upload?', () => {
                    hiddenInput.click();
                });
            } else {
                hiddenInput.click();
            }
        });

        hiddenInput.addEventListener('change', () => {
            if (!hiddenInput.files[0]) {
                return;
            }

            btnImport.disabled = true;
            btnImport.text = 'PROCESSING...';

            const reader = new FileReader();

            reader.onload = function () {
                hiddenInput.value = '';

                const text = reader.result as string;

                let data: TexturePackerData;
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    log.error(err);
                    showError('File is not valid JSON. Please ensure the file is a properly formatted TexturePacker export.');
                    resetButton();
                    return;
                }

                try {
                    importFramesFromTexturePacker(data);
                } catch (err) {
                    log.error(err);
                    showError(err instanceof Error ? err.message : 'Unknown error - please check the contents of the file and try again');
                } finally {
                    resetButton();
                }
            };

            reader.onerror = function () {
                log.error('FileReader error');
                showError('Failed to read the file');
                resetButton();
            };

            reader.readAsText(hiddenInput.files[0]);
        });

        const createFrame = (name: string, frameData: TexturePackerFrame, height: number, scaleWidth: number, scaleHeight: number) => {
            // the free version of texturepacker doesn't include the pivot data, so provide defaults if necessary
            const pivot = frameData.pivot ?? { x: 0.5, y: 0.5 };

            return {
                name,
                border: frameData.borders ? [
                    Math.max(0, frameData.borders.x),
                    Math.max(0, frameData.frame.h - frameData.borders.y - frameData.borders.h),
                    Math.max(0, frameData.frame.w - frameData.borders.x - frameData.borders.w),
                    Math.max(0, frameData.borders.y)
                ] : [0, 0, 0, 0],
                rect: [
                    frameData.frame.x * scaleWidth,
                    (height - frameData.frame.y - frameData.frame.h) * scaleHeight,
                    frameData.frame.w * scaleWidth,
                    frameData.frame.h * scaleHeight
                ],
                pivot: [pivot.x, pivot.y]
            };
        };

        const importFramesFromTexturePacker = (data: TexturePackerData): void => {
            // Validate TexturePacker JSON structure
            if (!data?.meta?.size?.w || !data?.meta?.size?.h || !data?.frames) {
                throw new Error('Invalid TexturePacker JSON format: missing required meta.size or frames data');
            }

            // Check for empty frames
            const frameKeys = Object.keys(data.frames);
            if (frameKeys.length === 0) {
                throw new Error('No frames found in TexturePacker file');
            }

            // Validate individual frame data
            for (const key of frameKeys) {
                const frameData = data.frames[key];
                if (!frameData?.frame ||
                    typeof frameData.frame.x !== 'number' ||
                    typeof frameData.frame.y !== 'number' ||
                    typeof frameData.frame.w !== 'number' ||
                    typeof frameData.frame.h !== 'number') {
                    throw new Error(`Invalid frame data for "${key}": missing required frame coordinates (x, y, w, h)`);
                }
            }

            const width = data.meta.size.w;
            const height = data.meta.size.h;
            const actualWidth = atlasAsset.get('meta.width');
            const actualHeight = atlasAsset.get('meta.height');

            const scaleWidth = actualWidth / width;
            const scaleHeight = actualHeight / height;

            const oldFrames = atlasAsset.getRaw('data.frames')._data;

            const nameIndex: Record<string, string> = {};
            let counter = 0;

            for (const key in oldFrames) {
                // get name of old frame
                const name = oldFrames[key]._data.name;

                // if name exists in new frames then remember
                // its old key
                if (data.frames[name]) {
                    nameIndex[name] = key;
                    // set counter to be larger than the the max existing index
                    const intKey = parseInt(key, 10);
                    if (counter <= intKey) {
                        counter = intKey + 1;
                    }
                }
            }

            const newFrames: Record<string, ReturnType<typeof createFrame>> = {};
            // for all the new frames
            for (const key in data.frames) {
                // create new frame
                const frameData = data.frames[key];
                const frame = createFrame(frameData.filename || key, frameData, height, scaleWidth, scaleHeight);

                // if frame already exists then use the same index
                if (Object.prototype.hasOwnProperty.call(nameIndex, key)) {
                    newFrames[nameIndex[key]] = frame;
                } else {
                    // otherwise put the new frame after all the other existing indexes
                    newFrames[counter++] = frame;
                }
            }

            atlasAsset.set('data.frames', newFrames);
        };

        events.push(rootPanel.on('clear', () => {
            panel.destroy();
        }));

        panel.once('destroy', () => {
            events.forEach(event => event.unbind());
            events.length = 0;
        });
    });
});
