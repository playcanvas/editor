import { LegacyButton } from '../../../common/ui/button.ts';

/**
 * @import { Panel } from '@playcanvas/pcui'
 */

editor.once('load', () => {
    editor.method('picker:sprites:attributes:frames', (args) => {
        const events = [];
        let suspendChanges = false;
        const atlasAsset = args.atlasAsset;
        const atlasImage = args.atlasImage;
        const frames = args.frames;
        const numFrames = frames.length;

        /** @type {Panel} */
        const rootPanel = editor.call('picker:sprites:rightPanel');
        if (numFrames > 1) {
            rootPanel.headerText = 'FRAME INSPECTOR - MULTIPLE FRAMES';
        } else {
            rootPanel.headerText = `FRAME INSPECTOR - ${atlasAsset.get(`data.frames.${frames[0]}.name`)}`;
        }

        editor.call('picker:sprites:attributes:frames:preview', {
            atlasAsset: atlasAsset,
            atlasImage: atlasImage,
            frames: frames
        });

        const panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });
        panel.disabled = !editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', (canWrite) => {
            panel.disabled = !canWrite;
        }));

        const fieldName = editor.call('attributes:addField', {
            parent: panel,
            name: 'Name',
            type: 'string',
            link: atlasAsset,
            paths: frames.map((f) => {
                return `data.frames.${f}.name`;
            })
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:name', fieldName.parent.innerElement.firstChild.ui, null, panel);

        fieldName.on('change', (value) => {
            if (numFrames === 1) {
                rootPanel.headerText = `FRAME INSPECTOR - ${value}`;
            }
        });

        // add field for frame rect but hide it and only use it for multi-editing
        // The user only will see position and size fields in pixels which is more helpful
        // but we'll use the internal rect fields to edit it
        const fieldRect = editor.call('attributes:addField', {
            parent: panel,
            type: 'vec4',
            link: atlasAsset,
            paths: frames.map((f) => {
                return `data.frames.${f}.rect`;
            })
        });
        fieldRect[0].parent.hidden = true;

        fieldRect[0].on('change', () => {
            if (suspendChanges) return;

            suspendChanges = true;
            updatePositionX();
            updateSizeX();
            updateBorderMax();
            suspendChanges = false;
        });

        fieldRect[1].on('change', () => {
            if (suspendChanges) return;

            suspendChanges = true;
            updatePositionY();
            updateSizeY();
            updateBorderMax();
            suspendChanges = false;
        });

        fieldRect[2].on('change', () => {
            if (suspendChanges) return;

            suspendChanges = true;
            updateSizeX();
            updateBorderMax();
            suspendChanges = false;
        });

        fieldRect[3].on('change', () => {
            if (suspendChanges) return;

            suspendChanges = true;
            updatePositionY();
            updateSizeY();
            updateBorderMax();
            suspendChanges = false;
        });

        const updateMaxPosition = function (field) {
            const dimension = field === 0 ? atlasImage.width : atlasImage.height;
            let maxPos = dimension;

            const rectIndex = field === 0 ? 2 : 3;

            const frameData = atlasAsset.getRaw('data.frames')._data;

            for (let i = 0, len = frames.length; i < len; i++) {
                const f = frameData[frames[i]];
                if (!f) continue;
                const rect = f._data.rect;
                maxPos = Math.min(maxPos, dimension - rect[rectIndex]);
            }

            fieldPosition[field].max = maxPos;
        };

        const updateMaxSize = function (field) {
            const dimension = field === 0 ? atlasImage.width : atlasImage.height;
            let maxSize = dimension;

            const rectIndex = field === 0 ? 0 : 1;

            const frameData = atlasAsset.getRaw('data.frames')._data;

            for (let i = 0, len = frames.length; i < len; i++) {
                const f = frameData[frames[i]];
                if (!f) continue;
                const rect = f._data.rect;
                maxSize = Math.min(maxSize, dimension - rect[rectIndex]);
            }

            fieldSize[field].max = maxSize;
        };

        const updatePositionX = function () {
            if (fieldRect[0].proxy) {
                fieldPosition[0].value = null;
            } else {
                fieldPosition[0].value = fieldRect[0].value;
            }

            updateMaxPosition(0);

            // give time to rect proxy to update
            setTimeout(() => {
                fieldPosition[0].proxy = fieldRect[0].proxy;
            });
        };

        const updatePositionY = function () {
            if (fieldRect[1].proxy) {
                fieldPosition[1].value = null;
            } else {
                fieldPosition[1].value = fieldRect[1].value;
            }

            updateMaxPosition(1);

            // give time to rect proxy to update
            setTimeout(() => {
                fieldPosition[1].proxy = fieldRect[1].proxy;
            });
        };

        const updateSizeX = function () {
            if (fieldRect[2].proxy) {
                fieldSize[0].value = null;
            } else {
                fieldSize[0].value = fieldRect[2].value;
            }

            updateMaxSize(0);

            // give time to rect proxy to update
            setTimeout(() => {
                fieldSize[0].proxy = fieldRect[2].proxy;
            });
        };

        const updateSizeY = function () {
            if (fieldRect[3].proxy) {
                fieldSize[1].value = null;
            } else {
                fieldSize[1].value = fieldRect[3].value;
            }

            updateMaxSize(1);

            // give time to rect proxy to update
            setTimeout(() => {
                fieldSize[1].proxy = fieldRect[3].proxy;
            });
        };

        // position in pixels
        const fieldPosition = editor.call('attributes:addField', {
            parent: panel,
            name: 'Position',
            type: 'vec2',
            precision: 0,
            min: 0,
            placeholder: ['→', '↑']
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:position', fieldPosition[0].parent.innerElement.firstChild.ui, null, panel);

        updatePositionX();
        updatePositionY();

        fieldPosition[0].on('change', (value) => {
            if (suspendChanges) return;
            suspendChanges = true;
            fieldRect[0].value = value;
            fieldPosition[0].proxy = fieldRect[0].proxy;
            updateMaxPosition(0);
            suspendChanges = false;
        });

        fieldPosition[1].on('change', (value) => {
            if (suspendChanges) return;
            suspendChanges = true;
            fieldRect[1].value = value;
            fieldPosition[1].proxy = fieldRect[1].proxy;
            updateMaxPosition(1);
            suspendChanges = false;
        });

        // size in pixels
        const fieldSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'vec2',
            precision: 0,
            min: 1,
            placeholder: ['→', '↑']
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:size', fieldSize[0].parent.innerElement.firstChild.ui, null, panel);

        updateSizeX();
        updateSizeY();

        fieldSize[0].on('change', (value) => {
            if (suspendChanges) return;

            updateSizeAndAdjustBorder(value, false);
        });

        fieldSize[1].on('change', (value) => {
            if (suspendChanges) return;

            updateSizeAndAdjustBorder(value, true);
        });

        // Updates the rect of the selected frames adjusting
        // their borders if necessary.
        const updateSizeAndAdjustBorder = function (value, isHeight) {
            let prev = null;

            const rect = isHeight ? 3 : 2;
            const border = isHeight ? 1 : 0;

            const redo = function () {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) return;

                const history = asset.history.enabled;
                asset.history.enabled = false;

                const frameData = asset.getRaw('data.frames')._data;
                for (let i = 0, len = frames.length; i < len; i++) {
                    const frame = frameData[frames[i]];
                    if (!frame) continue;

                    if (frame._data.rect[rect] !== value) {
                        if (!prev) prev = {};

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

            const undo = function () {

                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) return;

                const history = asset.history.enabled;
                asset.history.enabled = false;

                const frameData = asset.getRaw('data.frames')._data;

                for (const key in prev) {
                    if (!frameData[key]) continue;

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
                undo: undo,
                redo: redo
            });

            redo();
        };

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

        const fieldPivotPreset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot Preset',
            type: 'string',
            enum: [
                { v: 0, t: 'Top Left' },
                { v: 1, t: 'Top' },
                { v: 2, t: 'Top Right' },
                { v: 3, t: 'Left' },
                { v: 4, t: 'Center' },
                { v: 5, t: 'Right' },
                { v: 6, t: 'Bottom Left' },
                { v: 7, t: 'Bottom' },
                { v: 8, t: 'Bottom Right' }
            ]
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:pivotPreset', fieldPivotPreset.parent.innerElement.firstChild.ui, null, panel);

        fieldPivotPreset.on('change', (value) => {
            if (suspendChanges) return;

            const newValue = presetValues[parseInt(value, 10)];
            if (!newValue) return;

            const prevValues = {};
            for (let i = 0; i < numFrames; i++) {
                prevValues[frames[i]] = atlasAsset.get(`data.frames.${frames[i]}.pivot`);
            }

            const redo = function () {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) return;

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

            const undo = function () {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) return;

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
                undo: undo,
                redo: redo
            });

            redo();
        });

        // pivot
        const fieldPivot = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot',
            type: 'vec2',
            min: 0,
            max: 1,
            precision: 2,
            step: 0.1,
            placeholder: ['↔', '↕'],
            link: atlasAsset,
            paths: frames.map((f) => {
                return `data.frames.${f}.pivot`;
            })
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:pivot', fieldPivot[0].parent.innerElement.firstChild.ui, null, panel);

        fieldPivot[0].on('change', (value) => {
            if (suspendChanges) return;
            updatePivotPreset();
        });
        fieldPivot[1].on('change', (value) => {
            if (suspendChanges) return;
            updatePivotPreset();
        });

        const updatePivotPreset = function () {
            const suspend = suspendChanges;
            suspendChanges = true;
            for (let i = 0; i < presetValues.length; i++) {
                if (presetValues[i][0] === fieldPivot[0].value && presetValues[i][1] === fieldPivot[1].value) {
                    fieldPivotPreset.value = i;
                    break;
                }
            }
            suspendChanges = suspend;
        };

        updatePivotPreset();

        // border
        const fieldBorder = editor.call('attributes:addField', {
            parent: panel,
            placeholder: ['←', '↓', '→', '↑'],
            name: 'Border',
            type: 'vec4',
            link: atlasAsset,
            min: 0,
            paths: frames.map((f) => {
                return `data.frames.${f}.border`;
            })
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:border', fieldBorder[0].parent.innerElement.firstChild.ui, null, panel);

        const updateBorderMax = function () {
            // set left border max to not exceed the right border in any frame
            let maxLeft = atlasImage.width;
            let maxRight = atlasImage.width;
            let maxBottom = atlasImage.height;
            let maxTop = atlasImage.height;

            const frameData = atlasAsset.getRaw('data.frames')._data;

            for (let i = 0, len = frames.length; i < len; i++) {
                const f = frameData[frames[i]];
                if (!f) continue;
                const rect = f._data.rect;
                const border = f._data.border;
                maxLeft = Math.min(maxLeft, rect[2] - border[2]);
                maxRight = Math.min(maxRight, rect[2] - border[0]);
                maxBottom = Math.min(maxBottom, rect[3] - border[3]);
                maxTop = Math.min(maxTop, rect[3] - border[1]);
            }

            fieldBorder[0].max = maxLeft;
            fieldBorder[2].max = maxRight;
            fieldBorder[1].max = maxBottom;
            fieldBorder[3].max = maxTop;
        };

        for (let i = 0; i < 4; i++) {
            fieldBorder[i].on('change', updateBorderMax);
        }

        const panelButtons = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'ACTIONS'
        });
        panelButtons.class.add('buttons');
        panelButtons.disabled = !editor.call('permissions:write');
        events.push(editor.on('permissions:writeState', (canWrite) => {
            panelButtons.disabled = !canWrite;
        }));

        // new sprite
        const btnCreateSprite = new LegacyButton({
            text: 'New Sprite From Selection'
        });
        btnCreateSprite.class.add('icon', 'wide', 'create');
        panelButtons.append(btnCreateSprite);

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:newsprite', btnCreateSprite, null, panel);

        btnCreateSprite.on('click', () => {
            btnCreateSprite.disabled = true;
            editor.call('picker:sprites:spriteFromSelection', {
                callback: function () {
                    btnCreateSprite.disabled = false;
                }
            });
        });

        // new sliced sprite
        const btnCreateSlicedSprite = new LegacyButton({
            text: 'New Sliced Sprite From Selection'
        });
        btnCreateSlicedSprite.class.add('icon', 'wide', 'create');
        panelButtons.append(btnCreateSlicedSprite);

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:newsprite', btnCreateSlicedSprite, null, panel);

        btnCreateSlicedSprite.on('click', () => {
            btnCreateSlicedSprite.disabled = true;
            editor.call('picker:sprites:spriteFromSelection', {
                sliced: true,
                callback: function () {
                    btnCreateSprite.disabled = false;
                }
            });
        });

        // new sprites from frames
        const btnCreateSpritesFromFrames = new LegacyButton({
            text: 'New Sprite Per Selected Frame'
        });
        btnCreateSpritesFromFrames.class.add('icon', 'wide', 'create');
        panelButtons.append(btnCreateSpritesFromFrames);

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:newspritesfromframes', btnCreateSpritesFromFrames, null, panel);

        btnCreateSpritesFromFrames.on('click', () => {
            btnCreateSpritesFromFrames.disabled = true;
            editor.call('picker:sprites:spritesFromFrames', {
                callback: function () {
                    btnCreateSpritesFromFrames.disabled = false;
                }
            });
        });

        // focus frame
        const btnFocus = new LegacyButton({
            text: 'Focus On Selection'
        });
        btnFocus.class.add('icon', 'wide', 'focus');
        panelButtons.append(btnFocus);
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:focus', btnFocus, null, panel);

        btnFocus.on('click', () => {
            editor.call('picker:sprites:focus');
        });

        // trim rect
        const btnTrim = new LegacyButton({
            text: 'Trim Selected Frames'
        });
        btnTrim.class.add('icon', 'wide', 'trim');
        panelButtons.append(btnTrim);

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:trim', btnTrim, null, panel);

        // trim transparent pixels around frame
        btnTrim.on('click', () => {
            editor.call('picker:sprites:trimFrames', frames);
        });

        // delete frame
        const btnDelete = new LegacyButton({
            text: 'Delete Selected Frames'
        });
        btnDelete.class.add('icon', 'wide', 'remove');
        panelButtons.append(btnDelete);

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:frame:delete', btnDelete, null, panel);

        btnDelete.on('click', () => {
            editor.call('picker:sprites:deleteFrames', frames, {
                history: true
            });
        });

        // clean up
        events.push(rootPanel.on('clear', () => {
            panel.destroy();
            panelButtons.destroy();
        }));

        panel.on('destroy', () => {
            for (let i = 0, len = events.length; i < len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
