import type { EventHandle } from '@playcanvas/observer';
import { Button, Container, Panel, type NumericInput, type SelectInput, type TextInput, type VectorInput } from '@playcanvas/pcui';

import type { Attribute } from '@/editor/inspector/attribute.type.d';
import { AttributesInspector } from '@/editor/inspector/attributes-inspector';

import { SpritePreviewContainer } from './sprite-editor-preview-panel';

// Pivot presets mapping
const PIVOT_PRESETS = [
    [0, 1],      // Top Left
    [0.5, 1],    // Top
    [1, 1],      // Top Right
    [0, 0.5],    // Left
    [0.5, 0.5],  // Center
    [1, 0.5],    // Right
    [0, 0],      // Bottom Left
    [0.5, 0],    // Bottom
    [1, 0]       // Bottom Right
];

// Generate attributes based on selected frames
const createAttributes = (frames: string[]): Attribute[] => [
    {
        label: 'Name',
        type: 'string',
        reference: 'spriteeditor:frame:name',
        paths: frames.map(f => `data.frames.${f}.name`)
    },
    {
        label: 'Rect',
        alias: 'rect',
        type: 'vec4',
        paths: frames.map(f => `data.frames.${f}.rect`)
    },
    {
        label: 'Position',
        alias: 'position',
        type: 'vec2',
        reference: 'spriteeditor:frame:position',
        args: {
            precision: 0,
            min: 0,
            placeholder: ['→', '↑']
        }
    },
    {
        label: 'Size',
        alias: 'size',
        type: 'vec2',
        reference: 'spriteeditor:frame:size',
        args: {
            precision: 0,
            min: 1,
            placeholder: ['→', '↑']
        }
    },
    {
        label: 'Pivot Preset',
        alias: 'pivotPreset',
        type: 'select',
        reference: 'spriteeditor:frame:pivotPreset',
        args: {
            type: 'number',
            options: [
                { v: 0, t: 'Top Left' },
                { v: 1, t: 'Top' },
                { v: 2, t: 'Top Right' },
                { v: 3, t: 'Left' },
                { v: 4, t: 'Center' },
                { v: 5, t: 'Right' },
                { v: 6, t: 'Bottom Left' },
                { v: 7, t: 'Bottom' },
                { v: 8, t: 'Bottom Right' },
                { v: 9, t: 'Custom' }
            ]
        }
    },
    {
        label: 'Pivot',
        alias: 'pivot',
        type: 'vec2',
        reference: 'spriteeditor:frame:pivot',
        paths: frames.map(f => `data.frames.${f}.pivot`),
        args: {
            min: 0,
            max: 1,
            precision: 2,
            step: 0.1,
            placeholder: ['↔', '↕']
        }
    },
    {
        label: 'Border',
        alias: 'border',
        type: 'vec4',
        reference: 'spriteeditor:frame:border',
        paths: frames.map(f => `data.frames.${f}.border`),
        args: {
            min: 0,
            placeholder: ['←', '↓', '→', '↑']
        }
    }
];

editor.once('load', () => {
    editor.method('picker:sprites:attributes:frames', (args) => {
        const events: EventHandle[] = [];
        let suspendChanges = false;
        const atlasAsset = args.atlasAsset;
        const atlasImage = args.atlasImage;
        const frames = args.frames;
        const numFrames = frames.length;

        const rootPanel: Panel = editor.call('picker:sprites:rightPanel');
        const rootPanelContent: Container = editor.call('picker:sprites:rightPanelContent');
        if (numFrames > 1) {
            rootPanel.headerText = 'FRAME INSPECTOR - MULTIPLE FRAMES';
        } else {
            rootPanel.headerText = `FRAME INSPECTOR - ${atlasAsset.get(`data.frames.${frames[0]}.name`)}`;
        }

        // Create preview and prepend to panel (before scrollable content)
        const preview = new SpritePreviewContainer({
            atlasAsset,
            frames
        });
        preview.resizeTarget = rootPanel;
        rootPanel.prepend(preview);

        // Create inspector with dynamic attributes based on selected frames
        const inspector = new AttributesInspector({
            history: editor.api.globals.history,
            attributes: createAttributes(frames)
        });
        rootPanelContent.append(inspector);
        // Pass atlasAsset once per frame so PCUI shows "..." for differing values
        inspector.link(frames.map(() => atlasAsset));

        inspector.enabled = editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            inspector.enabled = canWrite;
        }));

        // Get field references
        const fieldName = inspector.getField(`data.frames.${frames[0]}.name`) as TextInput;
        const fieldRect = inspector.getField('rect') as VectorInput;
        const fieldPosition = inspector.getField('position') as VectorInput;
        const fieldSize = inspector.getField('size') as VectorInput;
        const fieldPivotPreset = inspector.getField('pivotPreset') as SelectInput;
        const fieldPivot = inspector.getField('pivot') as VectorInput;
        const fieldBorder = inspector.getField('border') as VectorInput;

        // Hide the Rect field - it's used internally for data binding
        fieldRect.parent.hidden = true;

        // Name field change handler
        fieldName.on('change', (value: string) => {
            if (numFrames === 1) {
                rootPanel.headerText = `FRAME INSPECTOR - ${value}`;
            }
        });

        // --- Rect <-> Position/Size sync ---

        // Helper to get rect component values from all frames
        const getRectComponentValues = (componentIndex: number): number[] => {
            const frameData = atlasAsset.getRaw('data.frames')._data;
            const values: number[] = [];

            for (let i = 0; i < frames.length; i++) {
                const f = frameData[frames[i]];
                if (f) {
                    values.push(f._data.rect[componentIndex]);
                }
            }

            return values;
        };

        const updateMaxPosition = (field: number): void => {
            const dimension = field === 0 ? atlasImage.width : atlasImage.height;
            let maxPos = dimension;

            const rectIndex = field === 0 ? 2 : 3;

            const frameData = atlasAsset.getRaw('data.frames')._data;

            for (let i = 0, len = frames.length; i < len; i++) {
                const f = frameData[frames[i]];
                if (!f) {
                    continue;
                }
                const rect = f._data.rect;
                maxPos = Math.min(maxPos, dimension - rect[rectIndex]);
            }

            (fieldPosition.inputs[field] as NumericInput).max = maxPos;
        };

        const updateMaxSize = (field: number): void => {
            const dimension = field === 0 ? atlasImage.width : atlasImage.height;
            let maxSize = dimension;

            const rectIndex = field === 0 ? 0 : 1;

            const frameData = atlasAsset.getRaw('data.frames')._data;

            for (let i = 0, len = frames.length; i < len; i++) {
                const f = frameData[frames[i]];
                if (!f) {
                    continue;
                }
                const rect = f._data.rect;
                maxSize = Math.min(maxSize, dimension - rect[rectIndex]);
            }

            (fieldSize.inputs[field] as NumericInput).max = maxSize;
        };

        // Updates a position or size input from rect values
        // Update max BEFORE setting values (set max does self-assignment that would overwrite "...")
        const updatePositionX = (): void => {
            updateMaxPosition(0);
            (fieldPosition.inputs[0] as NumericInput).values = getRectComponentValues(0);
        };

        const updatePositionY = (): void => {
            updateMaxPosition(1);
            (fieldPosition.inputs[1] as NumericInput).values = getRectComponentValues(1);
        };

        const updateSizeX = (): void => {
            updateMaxSize(0);
            (fieldSize.inputs[0] as NumericInput).values = getRectComponentValues(2);
        };

        const updateSizeY = (): void => {
            updateMaxSize(1);
            (fieldSize.inputs[1] as NumericInput).values = getRectComponentValues(3);
        };

        // Rect change handlers
        fieldRect.on('change', () => {
            if (suspendChanges) {
                return;
            }

            suspendChanges = true;
            updatePositionX();
            updatePositionY();
            updateSizeX();
            updateSizeY();
            updateBorderMax();
            suspendChanges = false;
        });

        // Initialize position and size from rect
        updatePositionX();
        updatePositionY();
        updateSizeX();
        updateSizeY();

        // Position change handlers
        const positionInputs = fieldPosition.inputs as NumericInput[];
        positionInputs[0].on('change', (value: number) => {
            if (suspendChanges) {
                return;
            }
            suspendChanges = true;
            const rectValue = (fieldRect.value as number[]).slice();
            rectValue[0] = value;
            fieldRect.value = rectValue;
            updateMaxPosition(0);
            suspendChanges = false;
        });

        positionInputs[1].on('change', (value: number) => {
            if (suspendChanges) {
                return;
            }
            suspendChanges = true;
            const rectValue = (fieldRect.value as number[]).slice();
            rectValue[1] = value;
            fieldRect.value = rectValue;
            updateMaxPosition(1);
            suspendChanges = false;
        });

        // Size change handlers
        const sizeInputs = fieldSize.inputs as NumericInput[];
        sizeInputs[0].on('change', (value: number) => {
            if (suspendChanges) {
                return;
            }

            updateSizeAndAdjustBorder(value, false);
        });

        sizeInputs[1].on('change', (value: number) => {
            if (suspendChanges) {
                return;
            }

            updateSizeAndAdjustBorder(value, true);
        });

        // Updates the rect of the selected frames adjusting
        // their borders if necessary.
        const updateSizeAndAdjustBorder = (value: number, isHeight: boolean): void => {
            let prev: Record<string, { value: number; border: number[] }> | null = null;

            const rect = isHeight ? 3 : 2;
            const border = isHeight ? 1 : 0;

            const redo = (): void => {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) {
                    return;
                }

                const history = asset.history.enabled;
                asset.history.enabled = false;

                const frameData = asset.getRaw('data.frames')._data;
                for (let i = 0, len = frames.length; i < len; i++) {
                    const frame = frameData[frames[i]];
                    if (!frame) {
                        continue;
                    }

                    if (frame._data.rect[rect] !== value) {
                        if (!prev) {
                            prev = {};
                        }

                        prev[frames[i]] = {
                            value: frame._data.rect[rect],
                            border: [frame._data.border[border], frame._data.border[border + 2]]
                        };

                        // set property
                        asset.set(`data.frames.${frames[i]}.rect.${rect}`, value);

                        // check if border needs to be adjusted
                        if (frame._data.border[border] > value - frame._data.border[border + 2]) {
                            asset.set(`data.frames.${frames[i]}.border.${border}`, Math.max(0, value - frame._data.border[border + 2]));
                        }

                        if (frame._data.border[border + 2] > value - frame._data.border[border]) {
                            asset.set(`data.frames.${frames[i]}.border.${border + 2}`, Math.max(0, value - frame._data.border[border]));
                        }
                    }
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

                const frameData = asset.getRaw('data.frames')._data;

                for (const key in prev) {
                    if (!frameData[key]) {
                        continue;
                    }

                    asset.set(`data.frames.${key}.rect.${rect}`, prev[key].value);
                    asset.set(`data.frames.${key}.border.${border}`, prev[key].border[0]);
                    asset.set(`data.frames.${key}.border.${border + 2}`, prev[key].border[1]);
                }

                asset.history.enabled = history;

                prev = null;
            };

            editor.api.globals.history.add({
                name: 'change rect',
                combine: false,
                undo,
                redo
            });

            redo();
        };

        // --- Pivot Preset <-> Pivot sync ---

        fieldPivotPreset.on('change', (value: number) => {
            if (suspendChanges) {
                return;
            }

            const newValue = PIVOT_PRESETS[value];
            if (!newValue) {
                return;
            }

            const prevValues: Record<string, number[]> = {};
            for (let i = 0; i < numFrames; i++) {
                prevValues[frames[i]] = atlasAsset.get(`data.frames.${frames[i]}.pivot`);
            }

            const redo = (): void => {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) {
                    return;
                }

                const history = asset.history.enabled;
                asset.history.enabled = false;
                for (let i = 0; i < numFrames; i++) {
                    const key = `data.frames.${frames[i]}`;
                    if (asset.has(key)) {
                        asset.set(`${key}.pivot`, newValue);
                    }
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
                for (let i = 0; i < numFrames; i++) {
                    const key = `data.frames.${frames[i]}`;
                    if (asset.has(key) && prevValues[frames[i]]) {
                        asset.set(`${key}.pivot`, prevValues[frames[i]]);
                    }

                }
                asset.history.enabled = history;
            };

            editor.api.globals.history.add({
                name: 'edit pivot',
                combine: false,
                undo,
                redo
            });

            redo();
        });

        // Pivot change handler - sync with preset
        const pivotInputs = fieldPivot.inputs as NumericInput[];
        const updatePivotPreset = (): void => {
            const suspend = suspendChanges;
            suspendChanges = true;
            const pivotValue = fieldPivot.value as number[];
            const index = PIVOT_PRESETS.findIndex(p => p[0] === pivotValue[0] && p[1] === pivotValue[1]);
            // Set to 9 (Custom) if no preset matches
            fieldPivotPreset.value = index >= 0 ? index : 9;
            suspendChanges = suspend;
        };

        pivotInputs[0].on('change', () => {
            if (suspendChanges) {
                return;
            }
            updatePivotPreset();
        });
        pivotInputs[1].on('change', () => {
            if (suspendChanges) {
                return;
            }
            updatePivotPreset();
        });

        updatePivotPreset();

        // --- Border max constraints ---

        const borderInputs = fieldBorder.inputs as NumericInput[];

        const updateBorderMax = (): void => {
            // set left border max to not exceed the right border in any frame
            let maxLeft = atlasImage.width;
            let maxRight = atlasImage.width;
            let maxBottom = atlasImage.height;
            let maxTop = atlasImage.height;

            const frameData = atlasAsset.getRaw('data.frames')._data;

            for (let i = 0, len = frames.length; i < len; i++) {
                const f = frameData[frames[i]];
                if (!f) {
                    continue;
                }
                const rect = f._data.rect;
                const border = f._data.border;
                maxLeft = Math.min(maxLeft, rect[2] - border[2]);
                maxRight = Math.min(maxRight, rect[2] - border[0]);
                maxBottom = Math.min(maxBottom, rect[3] - border[3]);
                maxTop = Math.min(maxTop, rect[3] - border[1]);
            }

            borderInputs[0].max = maxLeft;
            borderInputs[2].max = maxRight;
            borderInputs[1].max = maxBottom;
            borderInputs[3].max = maxTop;
        };

        borderInputs.forEach(input => input.on('change', updateBorderMax));

        const panelButtons = new Panel({
            headerText: 'ACTIONS',
            class: 'buttons'
        });
        rootPanelContent.append(panelButtons);
        panelButtons.enabled = editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', (canWrite: boolean) => {
            panelButtons.enabled = canWrite;
        }));

        // new sprite
        const btnCreateSprite = new Button({
            text: 'New Sprite From Selection',
            icon: 'E120',
            class: 'wide'
        });
        panelButtons.append(btnCreateSprite);

        btnCreateSprite.on('click', () => {
            editor.call('picker:sprites:spriteFromSelection');
        });

        // new sliced sprite
        const btnCreateSlicedSprite = new Button({
            text: 'New Sliced Sprite From Selection',
            icon: 'E120',
            class: 'wide'
        });
        panelButtons.append(btnCreateSlicedSprite);

        btnCreateSlicedSprite.on('click', () => {
            editor.call('picker:sprites:spriteFromSelection', { sliced: true });
        });

        // new sprites from frames
        const btnCreateSpritesFromFrames = new Button({
            text: 'New Sprite Per Selected Frame',
            icon: 'E120',
            class: 'wide'
        });
        panelButtons.append(btnCreateSpritesFromFrames);

        btnCreateSpritesFromFrames.on('click', () => {
            editor.call('picker:sprites:spritesFromFrames');
        });

        // focus frame
        const btnFocus = new Button({
            text: 'Focus On Selection',
            icon: 'E397',
            class: 'wide'
        });
        panelButtons.append(btnFocus);

        btnFocus.on('click', () => {
            editor.call('picker:sprites:focus');
        });

        // trim rect
        const btnTrim = new Button({
            text: 'Trim Selected Frames',
            icon: 'E394',
            class: 'wide'
        });
        panelButtons.append(btnTrim);

        // trim transparent pixels around frame
        btnTrim.on('click', () => {
            editor.call('picker:sprites:trimFrames', frames);
        });

        // delete frame
        const btnDelete = new Button({
            text: 'Delete Selected Frames',
            icon: 'E124',
            class: 'wide'
        });
        panelButtons.append(btnDelete);

        btnDelete.on('click', () => {
            editor.call('picker:sprites:deleteFrames', frames, {
                history: true
            });
        });

        // clean up
        events.push(rootPanel.on('clear', () => {
            preview.destroy();
            inspector.unlink();
            inspector.destroy();
            panelButtons.destroy();
        }));

        inspector.once('destroy', () => {
            events.forEach(event => event.unbind());
            events.length = 0;
        });
    });
});
