import type { EventHandle } from '@playcanvas/observer';
import { Panel } from '@playcanvas/pcui';

editor.once('load', () => {
    editor.method('picker:sprites:attributes:slice', (args) => {
        const events: EventHandle[] = [];

        const atlasAsset = args.atlasAsset;
        const atlasImage = args.atlasImage;
        const imageData = args.atlasImageData;

        const rootPanel = editor.call('picker:sprites:rightPanel');

        const panel = new Panel({
            headerText: 'GENERATE FRAMES',
            class: 'component'
        });
        rootPanel.append(panel);

        panel.enabled = editor.call('permissions:write');

        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            panel.enabled = canWrite;
        }));

        const METHOD_DELETE_EXISTING = 1;
        const METHOD_ONLY_APPEND = 2;

        const TYPE_GRID_BY_FRAME_COUNT  = 1;
        const TYPE_GRID_BY_FRAME_SIZE  = 2;
        const TYPE_GRID_AUTO = 3; // not implemented

        const PIVOT_TOP_LEFT  = 0;
        const PIVOT_TOP       = 1;
        const PIVOT_TOP_RIGHT = 2;
        const PIVOT_LEFT      = 3;
        const PIVOT_CENTER    = 4;
        const PIVOT_RIGHT     = 5;
        const PIVOT_BOTTOM_LEFT   = 6;
        const PIVOT_BOTTOM        = 7;
        const PIVOT_BOTTOM_RIGHT  = 8;


        const fieldMethod = editor.call('attributes:addField', {
            parent: panel,
            name: 'Method',
            type: 'number',
            value: METHOD_DELETE_EXISTING,
            enum: [
                { v: METHOD_DELETE_EXISTING, t: 'Delete Existing' },
                { v: METHOD_ONLY_APPEND, t: 'Only Append' }
            ]
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:method', fieldMethod.parent.innerElement.firstChild.ui, null, panel);

        const fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'number',
            value: TYPE_GRID_BY_FRAME_COUNT,
            enum: [
                { v: TYPE_GRID_BY_FRAME_COUNT, t: 'Grid By Frame Count' },
                { v: TYPE_GRID_BY_FRAME_SIZE, t: 'Grid By Frame Size' }
                // {v: 3, t: 'Auto'}
            ]
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:type', fieldType.parent.innerElement.firstChild.ui, null, panel);

        const fieldColsRows = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frame Count',
            type: 'vec2',
            value: [1, 1],
            precision: 0,
            min: 1,
            placeholder: ['Cols', 'Rows']
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:count', fieldColsRows[0].parent.innerElement.firstChild.ui, null, panel);

        const fieldPixels = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frame Size',
            type: 'vec2',
            value: [atlasImage.width, atlasImage.height],
            precision: 0,
            min: 1,
            placeholder: ['X', 'Y']
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:size', fieldPixels[0].parent.innerElement.firstChild.ui, null, panel);

        const fieldOffset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Offset',
            type: 'vec2',
            value: [0, 0],
            precision: 0,
            min: 0,
            placeholder: ['X', 'Y']
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:offset', fieldOffset[0].parent.innerElement.firstChild.ui, null, panel);

        const fieldSpacing = editor.call('attributes:addField', {
            parent: panel,
            name: 'Spacing',
            type: 'vec2',
            value: [0, 0],
            precision: 0,
            min: 0,
            placeholder: ['X', 'Y']
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:spacing', fieldSpacing[0].parent.innerElement.firstChild.ui, null, panel);

        // pivot presets
        const presetValues = [
            [0, 1],
            [0.5, 1],
            [1, 1],
            [0, 0.5],
            [0.5, 0.5],
            [1, 0.5],
            [0, 0],
            [0.5, 0],
            [1, 0]
        ];

        const fieldPivot = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot',
            type: 'number',
            enum: [
                { v: PIVOT_TOP_LEFT, t: 'Top Left' },
                { v: PIVOT_TOP, t: 'Top' },
                { v: PIVOT_TOP_RIGHT, t: 'Top Right' },
                { v: PIVOT_LEFT, t: 'Left' },
                { v: PIVOT_CENTER, t: 'Center' },
                { v: PIVOT_RIGHT, t: 'Right' },
                { v: PIVOT_BOTTOM_LEFT, t: 'Bottom Left' },
                { v: PIVOT_BOTTOM, t: 'Bottom' },
                { v: PIVOT_BOTTOM_RIGHT, t: 'Bottom Right' }
            ],
            value: PIVOT_CENTER
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:pivot', fieldPivot.parent.innerElement.firstChild.ui, null, panel);

        const toggleFields = (): void => {
            fieldColsRows[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_COUNT;
            fieldPixels[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_SIZE;
            fieldOffset[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_COUNT && fieldType.value !== TYPE_GRID_BY_FRAME_SIZE;
            fieldSpacing[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_COUNT && fieldType.value !== TYPE_GRID_BY_FRAME_SIZE;
        };

        toggleFields();

        fieldType.on('change', toggleFields);

        const btnGenerate = editor.call('attributes:addField', {
            parent: panel,
            text: 'GENERATE FRAMES',
            type: 'button',
            name: ' '
        });

        btnGenerate.class.add('icon', 'generate');

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:generate', btnGenerate, null, panel);

        btnGenerate.on('click', () => {
            btnGenerate.disabled = true;
            const type = fieldType.value;
            const method = fieldMethod.value;

            const oldFrames = atlasAsset.get('data.frames');
            const newFrames = method === METHOD_DELETE_EXISTING ? {} : atlasAsset.get('data.frames');

            const redo = (): void => {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) {
                    return;
                }
                const history = asset.history.enabled;
                asset.history.enabled = false;

                if (type === TYPE_GRID_BY_FRAME_COUNT) {
                    sliceGridByCount(fieldColsRows[0].value, fieldColsRows[1].value, newFrames);

                    // set frames and manually emit 'set' event
                    // to avoid huge performance hit if there's a lot of frames
                    setFrames(asset, newFrames);
                } else if (type === TYPE_GRID_BY_FRAME_SIZE) {
                    sliceGridBySize(fieldPixels[0].value, fieldPixels[1].value, newFrames);
                    setFrames(asset, newFrames);
                } else if (type === TYPE_GRID_AUTO) {
                    // TODO
                }

                asset.history.enabled = history;
            };

            const undo = (): void => {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) {
                    return;
                }
                const history = asset.history.enabled;
                asset.history.enabled = false;
                setFrames(asset, oldFrames);
                asset.history.enabled = history;
            };

            editor.api.globals.history.add({
                name: 'slice',
                combine: false,
                redo,
                undo
            });

            // do this in a timeout to give a chance to the button to
            // appear disabled
            setTimeout(() => {
                redo();
                btnGenerate.disabled = false;
            }, 50);
        });

        const btnClear = editor.call('attributes:addField', {
            parent: panel,
            text: 'Delete All Frames',
            type: 'button',
            name: ' '
        });

        btnClear.class.add('icon', 'remove');

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:clear', btnClear, null, panel);

        btnClear.on('click', () => {
            editor.call('picker:confirm', 'Are you sure you want to delete all the frames?', () => {
                const frames = atlasAsset.get('data.frames');

                btnClear.disabled = true;

                const redo = (): void => {
                    const asset = editor.call('assets:get', atlasAsset.get('id'));
                    if (!asset) {
                        return;
                    }
                    const history = asset.history.enabled;
                    asset.history.enabled = false;
                    setFrames(asset, {});
                    asset.history.enabled = history;
                };

                const undo = (): void => {
                    const asset = editor.call('assets:get', atlasAsset.get('id'));
                    if (!asset) {
                        return;
                    }
                    const history = asset.history.enabled;
                    asset.history.enabled = false;
                    setFrames(asset, frames);
                    asset.history.enabled = history;
                };

                editor.api.globals.history.add({
                    name: 'delete all frames',
                    combine: false,
                    undo,
                    redo
                });

                // do this in a timeout so that the button can appear disabled
                setTimeout(() => {
                    redo();
                    btnClear.disabled = false;
                });
            });
        });

        // Set frames without firing events for each individual json field
        const setFrames = (asset, frames): void => {
            const suspend = asset.suspendEvents;
            asset.suspendEvents = true;
            asset.set('data.frames', frames);
            asset.suspendEvents = suspend;
            asset.emit('data.frames:set', frames, null, false);
            asset.emit('*:set', 'data.frames', frames, null, false);
        };

        // Slice atlas in frames using a grid
        const sliceGridByCount = (cols: number, rows: number, frames): void => {
            const pivot = presetValues[fieldPivot.value];

            let maxKey = 1;
            for (const key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            const offsetX = fieldOffset[0].value;
            const offsetY = fieldOffset[1].value;

            const spacingX = fieldSpacing[0].value;
            const spacingY = fieldSpacing[1].value;

            const imgWidth = atlasImage.width - offsetX;
            const imgHeight = atlasImage.height - offsetY;

            const totalSpacingX = spacingX * (cols - 1);
            const totalSpacingY = spacingY * (rows - 1);

            const frameWidth = Math.floor((imgWidth - totalSpacingX) / cols);
            const frameHeight = Math.floor((imgHeight - totalSpacingY) / rows);

            const spacedHeight = frameHeight + spacingY;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const left = offsetX + c * (frameWidth + spacingX);
                    const top = offsetY + r * (frameHeight + spacingY) - offsetY - spacingY;

                    if (!isRegionEmpty(left, top + spacingY, frameWidth, frameHeight)) {
                        frames[maxKey] = {
                            name: `Frame ${maxKey}`,
                            rect: [left, Math.floor(imgHeight - (top + spacedHeight)), frameWidth, frameHeight],
                            pivot: pivot,
                            border: [0, 0, 0, 0]
                        };
                        maxKey++;
                    }
                }
            }
        };

        const sliceGridBySize = (frameWidth: number, frameHeight: number, frames): void => {
            const pivot = presetValues[fieldPivot.value];

            let maxKey = 1;
            for (const key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            const offsetX = fieldOffset[0].value;
            const offsetY = fieldOffset[1].value;

            const spacingX = fieldSpacing[0].value;
            const spacingY = fieldSpacing[1].value;

            const imgWidth = atlasImage.width - offsetX;
            const imgHeight = atlasImage.height - offsetY;

            const cols = Math.floor((imgWidth + spacingX) / (frameWidth + spacingX));
            const rows = Math.floor((imgHeight + spacingY) / (frameHeight + spacingY));

            const spacedHeight = frameHeight + spacingY;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const left = offsetX + c * (frameWidth + spacingX);
                    const top = offsetY + r * (frameHeight + spacingY) - offsetY - spacingY;

                    if (!isRegionEmpty(left, top + spacingY, frameWidth, frameHeight)) {
                        frames[maxKey] = {
                            name: `Frame ${maxKey}`,
                            rect: [left, Math.floor(imgHeight - (top + spacedHeight)), frameWidth, frameHeight],
                            pivot: pivot,
                            border: [0, 0, 0, 0]
                        };
                        maxKey++;
                    }
                }
            }
        };

        // Checks if an image region has alpha
        const isRegionEmpty = (left: number, top: number, width: number, height: number): boolean => {
            const right = left + width;
            const bottom = top + height;

            for (let x = left; x < right; x++) {
                for (let y = top; y < bottom; y++) {
                    if (!isPixelEmpty(x, y)) {
                        return false;
                    }
                }
            }

            return true;
        };

        const isPixelEmpty = (x: number, y: number): boolean => {
            const alpha = y * (atlasImage.width * 4) + x * 4 + 3;
            return imageData.data[alpha] === 0;
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
