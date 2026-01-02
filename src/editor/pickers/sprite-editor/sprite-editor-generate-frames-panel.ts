import type { EventHandle } from '@playcanvas/observer';
import { Button, Container, Panel, type SelectInput, type VectorInput } from '@playcanvas/pcui';

import type { Attribute } from '@/editor/inspector/attribute.type.d';
import { AttributesInspector } from '@/editor/inspector/attributes-inspector';

const METHOD_DELETE_EXISTING = 1;
const METHOD_ONLY_APPEND = 2;

const TYPE_GRID_BY_FRAME_COUNT = 1;
const TYPE_GRID_BY_FRAME_SIZE = 2;

const PIVOT_TOP_LEFT = 0;
const PIVOT_TOP = 1;
const PIVOT_TOP_RIGHT = 2;
const PIVOT_LEFT = 3;
const PIVOT_CENTER = 4;
const PIVOT_RIGHT = 5;
const PIVOT_BOTTOM_LEFT = 6;
const PIVOT_BOTTOM = 7;
const PIVOT_BOTTOM_RIGHT = 8;

const PIVOT_VALUES = [
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

const ATTRIBUTES: Attribute[] = [
    {
        label: 'Method',
        alias: 'method',
        type: 'select',
        reference: 'spriteeditor:generate:method',
        args: {
            type: 'number',
            value: METHOD_DELETE_EXISTING,
            options: [
                { v: METHOD_DELETE_EXISTING, t: 'Delete Existing' },
                { v: METHOD_ONLY_APPEND, t: 'Only Append' }
            ]
        }
    },
    {
        label: 'Type',
        alias: 'type',
        type: 'select',
        reference: 'spriteeditor:generate:type',
        args: {
            type: 'number',
            value: TYPE_GRID_BY_FRAME_COUNT,
            options: [
                { v: TYPE_GRID_BY_FRAME_COUNT, t: 'Grid By Frame Count' },
                { v: TYPE_GRID_BY_FRAME_SIZE, t: 'Grid By Frame Size' }
            ]
        }
    },
    {
        label: 'Frame Count',
        alias: 'frameCount',
        type: 'vec2',
        reference: 'spriteeditor:generate:count',
        args: {
            value: [1, 1],
            precision: 0,
            min: 1,
            placeholder: ['Cols', 'Rows']
        }
    },
    {
        label: 'Frame Size',
        alias: 'frameSize',
        type: 'vec2',
        reference: 'spriteeditor:generate:size',
        args: {
            precision: 0,
            min: 1,
            placeholder: ['X', 'Y']
        }
    },
    {
        label: 'Offset',
        alias: 'offset',
        type: 'vec2',
        reference: 'spriteeditor:generate:offset',
        args: {
            value: [0, 0],
            precision: 0,
            min: 0,
            placeholder: ['X', 'Y']
        }
    },
    {
        label: 'Spacing',
        alias: 'spacing',
        type: 'vec2',
        reference: 'spriteeditor:generate:spacing',
        args: {
            value: [0, 0],
            precision: 0,
            min: 0,
            placeholder: ['X', 'Y']
        }
    },
    {
        label: 'Pivot',
        alias: 'pivot',
        type: 'select',
        reference: 'spriteeditor:generate:pivot',
        args: {
            type: 'number',
            value: PIVOT_CENTER,
            options: [
                { v: PIVOT_TOP_LEFT, t: 'Top Left' },
                { v: PIVOT_TOP, t: 'Top' },
                { v: PIVOT_TOP_RIGHT, t: 'Top Right' },
                { v: PIVOT_LEFT, t: 'Left' },
                { v: PIVOT_CENTER, t: 'Center' },
                { v: PIVOT_RIGHT, t: 'Right' },
                { v: PIVOT_BOTTOM_LEFT, t: 'Bottom Left' },
                { v: PIVOT_BOTTOM, t: 'Bottom' },
                { v: PIVOT_BOTTOM_RIGHT, t: 'Bottom Right' }
            ]
        }
    }
];

editor.once('load', () => {
    editor.method('picker:sprites:attributes:slice', (args) => {
        const events: EventHandle[] = [];

        const atlasAsset = args.atlasAsset;
        const atlasImage = args.atlasImage;
        const imageData = args.atlasImageData;

        const rootPanel = editor.call('picker:sprites:rightPanel');
        const rootPanelContent: Container = editor.call('picker:sprites:rightPanelContent');

        const panel = new Panel({
            headerText: 'GENERATE FRAMES'
        });
        rootPanelContent.append(panel);

        const inspector = new AttributesInspector({
            history: editor.api.globals.history,
            attributes: ATTRIBUTES
        });
        panel.append(inspector);

        // Set initial frame size to atlas dimensions
        (inspector.getField('frameSize') as VectorInput).value = [atlasImage.width, atlasImage.height];

        panel.enabled = editor.call('permissions:write');

        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            panel.enabled = canWrite;
        }));

        const fieldType = inspector.getField('type');
        const fieldFrameCount = inspector.getField('frameCount');
        const fieldFrameSize = inspector.getField('frameSize');
        const fieldOffset = inspector.getField('offset');
        const fieldSpacing = inspector.getField('spacing');
        const fieldMethod = inspector.getField('method');
        const fieldPivot = inspector.getField('pivot');

        const toggleFields = (): void => {
            const typeValue = (fieldType as SelectInput).value as number;
            fieldFrameCount.parent.hidden = typeValue !== TYPE_GRID_BY_FRAME_COUNT;
            fieldFrameSize.parent.hidden = typeValue !== TYPE_GRID_BY_FRAME_SIZE;
            fieldOffset.parent.hidden = typeValue !== TYPE_GRID_BY_FRAME_COUNT && typeValue !== TYPE_GRID_BY_FRAME_SIZE;
            fieldSpacing.parent.hidden = typeValue !== TYPE_GRID_BY_FRAME_COUNT && typeValue !== TYPE_GRID_BY_FRAME_SIZE;
        };

        toggleFields();

        fieldType.on('change', toggleFields);

        // Button container with same styling as ACTIONS panel
        const buttonContainer = new Container({
            flex: true,
            class: 'action-buttons'
        });
        panel.append(buttonContainer);

        // Generate Frames button
        const btnGenerate = new Button({
            text: 'GENERATE FRAMES',
            icon: 'E398',
            class: 'wide'
        });
        buttonContainer.append(btnGenerate);

        btnGenerate.on('click', () => {
            btnGenerate.enabled = false;
            const type = (fieldType as SelectInput).value as number;
            const method = (fieldMethod as SelectInput).value as number;

            const oldFrames = atlasAsset.get('data.frames');
            const newFrames = method === METHOD_DELETE_EXISTING ? {} : atlasAsset.get('data.frames');

            const redo = (): void => {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) {
                    return;
                }
                const history = asset.history.enabled;
                asset.history.enabled = false;

                const frameCountValue = (fieldFrameCount as VectorInput).value;
                const frameSizeValue = (fieldFrameSize as VectorInput).value;

                if (type === TYPE_GRID_BY_FRAME_COUNT) {
                    sliceGridByCount(frameCountValue[0], frameCountValue[1], newFrames);

                    // set frames and manually emit 'set' event
                    // to avoid huge performance hit if there's a lot of frames
                    setFrames(asset, newFrames);
                } else if (type === TYPE_GRID_BY_FRAME_SIZE) {
                    sliceGridBySize(frameSizeValue[0], frameSizeValue[1], newFrames);
                    setFrames(asset, newFrames);
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
                btnGenerate.enabled = true;
            }, 50);
        });

        // Delete All Frames button
        const btnClear = new Button({
            text: 'DELETE ALL FRAMES',
            icon: 'E124',
            class: 'wide'
        });
        buttonContainer.append(btnClear);

        btnClear.on('click', () => {
            editor.call('picker:confirm', 'Are you sure you want to delete all the frames?', () => {
                const frames = atlasAsset.get('data.frames');

                btnClear.enabled = false;

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
                    btnClear.enabled = true;
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
            const pivotValue = (fieldPivot as SelectInput).value as number;
            const pivot = PIVOT_VALUES[pivotValue];
            const offsetValue = (fieldOffset as VectorInput).value;
            const spacingValue = (fieldSpacing as VectorInput).value;

            let maxKey = 1;
            for (const key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            const offsetX = offsetValue[0];
            const offsetY = offsetValue[1];

            const spacingX = spacingValue[0];
            const spacingY = spacingValue[1];

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
            const pivotValue = (fieldPivot as SelectInput).value as number;
            const pivot = PIVOT_VALUES[pivotValue];
            const offsetValue = (fieldOffset as VectorInput).value;
            const spacingValue = (fieldSpacing as VectorInput).value;

            let maxKey = 1;
            for (const key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            const offsetX = offsetValue[0];
            const offsetY = offsetValue[1];

            const spacingX = spacingValue[0];
            const spacingY = spacingValue[1];

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
