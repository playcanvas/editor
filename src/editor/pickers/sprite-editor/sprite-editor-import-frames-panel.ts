import type { EventHandle } from '@playcanvas/observer';
import { Button, Container, Label, Panel } from '@playcanvas/pcui';

editor.once('load', () => {
    editor.method('picker:sprites:attributes:importFrames', (args) => {
        const events: EventHandle[] = [];
        const atlasAsset = args.atlasAsset;

        const rootPanel = editor.call('picker:sprites:rightPanel');

        const panel = new Panel({
            headerText: 'IMPORT FRAME DATA',
            class: 'component'
        });
        rootPanel.append(panel);

        panel.enabled = editor.call('permissions:write');

        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            panel.enabled = canWrite;
        }));

        const panelError = new Panel({
            headerText: 'Invalid JSON file',
            class: 'import-error',
            flex: true,
            hidden: true
        });
        panel.append(panelError);

        const labelError = new Label({
            text: 'Please upload a valid JSON file that has been created with the Texture Packer application.'
        });
        panelError.append(labelError);

        const btnCloseError = new Button({
            icon: 'E132',
            class: 'close'
        });
        panelError.header.append(btnCloseError);

        btnCloseError.on('click', () => {
            panelError.hidden = true;
        });

        const containerButtons = new Container({
            flex: true
        });
        panel.append(containerButtons);

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.accept = '.json';
        hiddenInput.style.display = 'none';
        panel.innerElement.append(hiddenInput);

        const btnImport = new Button({
            text: 'UPLOAD TEXTURE PACKER JSON',
            icon: 'E222',
            class: 'wide'
        });
        containerButtons.append(btnImport);

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
            reader.onload = function (e) {
                hiddenInput.value = null;
                const text = reader.result;
                let data = null;
                try {
                    data = JSON.parse(text);
                    importFramesFromTexturePacker(data);
                } catch (err) {
                    log.error(err);
                    panelError.hidden = false;
                    return;
                } finally {
                    btnImport.text = 'UPLOAD TEXTURE PACKER JSON';
                    btnImport.disabled = false;
                }
            };
            reader.readAsText(hiddenInput.files[0]);
        });

        const createFrame = function (name, frameData, height, scaleWidth, scaleHeight) {
            // the free version of texturepacker doesn't include the pivot data, so provide defaults if necessary
            if (!frameData.pivot) {
                frameData.pivot = {
                    x: 0.5,
                    y: 0.5
                };
            }

            return {
                name,
                border: frameData.borders ? [
                    Math.max(0, frameData.borders.x),
                    Math.max(0, frameData.frame.h - frameData.borders.y - frameData.borders.h),
                    Math.max(0, frameData.frame.w - frameData.borders.x - frameData.borders.w),
                    Math.max(0, frameData.borders.y)
                ] :
                    [0, 0, 0, 0],
                rect: [
                    frameData.frame.x * scaleWidth,
                    (height - frameData.frame.y - frameData.frame.h) * scaleHeight,
                    frameData.frame.w * scaleWidth,
                    frameData.frame.h * scaleHeight
                ],
                pivot: [
                    frameData.pivot.x,
                    frameData.pivot.y
                ]
            };
        };

        const importFramesFromTexturePacker = function (data) {
            const width = data.meta.size.w;
            const height = data.meta.size.h;
            const actualWidth = atlasAsset.get('meta.width');
            const actualHeight = atlasAsset.get('meta.height');

            const scaleWidth = actualWidth / width;
            const scaleHeight = actualHeight / height;

            const oldFrames = atlasAsset.getRaw('data.frames')._data;

            const nameIndex = {};
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

            const newFrames = {};
            // for all the new frames
            for (const key in data.frames) {
                // create new frame
                const frameData = data.frames[key];
                const frame = createFrame(frameData.filename || key, frameData, height, scaleWidth, scaleHeight);

                // if frame already exists then use the same index
                if (key in nameIndex) {
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
