editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:slice', function (args) {
        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;
        var imageData = args.atlasImageData;

        var rootPanel = editor.call('picker:sprites:rightPanel');

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'GENERATE FRAMES'
        });

        var METHOD_DELETE_EXISTING = 1;
        var METHOD_ONLY_APPEND = 2;

        var TYPE_GRID_BY_FRAME_COUNT  = 1;
        var TYPE_GRID_BY_FRAME_SIZE  = 2;
        var TYPE_GRID_AUTO = 3; // not implemented

        var PIVOT_TOP_LEFT  = 0;
        var PIVOT_TOP       = 1;
        var PIVOT_TOP_RIGHT = 2;
        var PIVOT_LEFT      = 3;
        var PIVOT_CENTER    = 4;
        var PIVOT_RIGHT     = 5;
        var PIVOT_BOTTOM_LEFT   = 6;
        var PIVOT_BOTTOM        = 7;
        var PIVOT_BOTTOM_RIGHT  = 8;

        var events = [];

        var fieldMethod = editor.call('attributes:addField', {
            parent: panel,
            name: 'Method',
            type: 'number',
            value: METHOD_DELETE_EXISTING,
            enum: [
                { v: METHOD_DELETE_EXISTING, t: 'Delete Existing' },
                { v: METHOD_ONLY_APPEND, t: 'Only Append' },
            ],
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:method', fieldMethod.parent.innerElement.firstChild.ui, null, panel);

        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'number',
            value: TYPE_GRID_BY_FRAME_COUNT,
            enum: [
                {v: TYPE_GRID_BY_FRAME_COUNT, t: 'Grid By Frame Count'},
                {v: TYPE_GRID_BY_FRAME_SIZE, t: 'Grid By Frame Size'}
                // {v: 3, t: 'Auto'}
            ]
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:type', fieldType.parent.innerElement.firstChild.ui, null, panel);

        var fieldColsRows = editor.call('attributes:addField', {
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

        var fieldPixels = editor.call('attributes:addField', {
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

        var fieldOffset = editor.call('attributes:addField', {
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

        var fieldSpacing = editor.call('attributes:addField', {
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
        var presetValues = [
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

        var fieldPivot = editor.call('attributes:addField', {
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

        var toggleFields = function () {
            fieldColsRows[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_COUNT;
            fieldPixels[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_SIZE;
            fieldOffset[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_COUNT && fieldType.value !== TYPE_GRID_BY_FRAME_SIZE;
            fieldSpacing[0].parent.hidden = fieldType.value !== TYPE_GRID_BY_FRAME_COUNT && fieldType.value !== TYPE_GRID_BY_FRAME_SIZE;
        };

        toggleFields();

        fieldType.on('change', toggleFields);

        var btnGenerate = editor.call('attributes:addField', {
            parent: panel,
            text: 'GENERATE FRAMES',
            type: 'button',
            name: ' '
        });

        btnGenerate.class.add('icon', 'generate');

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:generate', btnGenerate, null, panel);

        btnGenerate.on('click', function () {
            btnGenerate.disabled = true;
            var type = fieldType.value;
            var method = fieldMethod.value;

            var oldFrames = atlasAsset.get('data.frames');
            var newFrames = method === METHOD_DELETE_EXISTING ? {} : atlasAsset.get('data.frames');

            var redo = function () {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;
                var history = asset.history.enabled;
                asset.history.enabled = false;

                if (type === TYPE_GRID_BY_FRAME_COUNT) {
                    sliceGridByCount(fieldColsRows[0].value, fieldColsRows[1].value, newFrames);

                    // set frames and manually emit 'set' event
                    // to avoid huge performance hit if there's a lot of frames
                    setFrames(asset, newFrames);
                } else if (type === TYPE_GRID_BY_FRAME_SIZE) {
                    var width = atlasImage.width;
                    var height = atlasImage.height;
                    sliceGridBySize(fieldPixels[0].value, fieldPixels[1].value, newFrames);
                    setFrames(asset, newFrames);
                } else if (type === TYPE_GRID_AUTO) {
                    // TODO
                }

                asset.history.enabled = history;
            };

            var undo = function () {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;
                var history = asset.history.enabled;
                asset.history.enabled = false;
                setFrames(asset, oldFrames);
                asset.history.enabled = history;
            };

            editor.call('history:add', {
                name: 'slice',
                redo: redo,
                undo: undo
            });

            // do this in a timeout to give a chance to the button to
            // appear disabled
            setTimeout(function () {
                redo();
                btnGenerate.disabled = false;
            }, 50);
        });

        var btnClear = editor.call('attributes:addField', {
            parent: panel,
            text: 'Delete All Frames',
            type: 'button',
            name: ' '
        });

        btnClear.class.add('icon', 'remove');

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:generate:clear', btnClear, null, panel);

        btnClear.on('click', function () {
            editor.call('picker:confirm', 'Are you sure you want to delete all the frames?', function () {
                var frames = atlasAsset.get('data.frames');

                btnClear.disabled = true;

                var redo = function () {
                    var asset = editor.call('assets:get', atlasAsset.get('id'));
                    if (! asset) return;
                    var history = asset.history.enabled;
                    asset.history.enabled = false;
                    setFrames(asset, {});
                    asset.history.enabled = history;
                };

                var undo = function () {
                    var asset = editor.call('assets:get', atlasAsset.get('id'));
                    if (! asset) return;
                    var history = asset.history.enabled;
                    asset.history.enabled = false;
                    setFrames(asset, frames);
                    asset.history.enabled = history;
                };

                editor.call('history:add', {
                    name: 'delete all frames',
                    undo: undo,
                    redo: redo
                });

                // do this in a timeout so that the button can appear disabled
                setTimeout(function () {
                    redo();
                    btnClear.disabled = false;
                });
            });
        });

        // Set frames without firing events for each individual json field
        var setFrames = function (asset, frames) {
            var suspend = asset.suspendEvents;
            asset.suspendEvents = true;
            asset.set('data.frames', frames);
            asset.suspendEvents = suspend;
            asset.emit('data.frames:set', frames, null, false);
            asset.emit('*:set', 'data.frames', frames, null, false);
        };

        // Slice atlas in frames using a grid
        var sliceGridByCount = function (cols, rows, frames) {
            var pivot = presetValues[fieldPivot.value];

            var maxKey = 1;
            for (var key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            var offsetX = fieldOffset[0].value;
            var offsetY = fieldOffset[1].value;

            var spacingX = fieldSpacing[0].value;
            var spacingY = fieldSpacing[1].value;

            var imgWidth = atlasImage.width - offsetX;
            var imgHeight = atlasImage.height - offsetY;

            var totalSpacingX = spacingX * (cols - 1);
            var totalSpacingY = spacingY * (rows - 1);

            var frameWidth = Math.floor((imgWidth - totalSpacingX) / cols);
            var frameHeight = Math.floor((imgHeight - totalSpacingY) / rows);

            var spacedWidth = frameWidth + spacingX;
            var spacedHeight = frameHeight + spacingY;

            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var left = offsetX + c * (frameWidth + spacingX);
                    var top = offsetY + r * (frameHeight + spacingY) - offsetY - spacingY;

                    if (! isRegionEmpty(left, top+spacingY, frameWidth, frameHeight)) {
                        frames[maxKey] = {
                            name: 'Frame ' + maxKey,
                            rect: [left, Math.floor(imgHeight - (top + spacedHeight)), frameWidth, frameHeight],
                            pivot: pivot,
                            border: [0,0,0,0]
                        };
                        maxKey++;
                    }
                }
            }
        };

        var sliceGridBySize = function (frameWidth, frameHeight, frames) {
            var pivot = presetValues[fieldPivot.value];

            var maxKey = 1;
            for (var key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            var offsetX = fieldOffset[0].value;
            var offsetY = fieldOffset[1].value;

            var spacingX = fieldSpacing[0].value;
            var spacingY = fieldSpacing[1].value;

            var imgWidth = atlasImage.width - offsetX;
            var imgHeight = atlasImage.height - offsetY;

            var cols = Math.floor((imgWidth + spacingX) / (frameWidth + spacingX));
            var rows = Math.floor((imgHeight + spacingY) / (frameHeight + spacingY));

            var totalSpacingX = spacingX * (cols - 1);
            var totalSpacingY = spacingY * (rows - 1);

            var spacedWidth = frameWidth + spacingX;
            var spacedHeight = frameHeight + spacingY;

            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var left = offsetX + c * (frameWidth + spacingX);
                    var top = offsetY + r * (frameHeight + spacingY) - offsetY - spacingY;

                    if (! isRegionEmpty(left, top+spacingY, frameWidth, frameHeight)) {
                        frames[maxKey] = {
                            name: 'Frame ' + maxKey,
                            rect: [left, Math.floor(imgHeight - (top + spacedHeight)), frameWidth, frameHeight],
                            pivot: pivot,
                            border: [0,0,0,0]
                        };
                        maxKey++;
                    }
                }
            }
        };

        // Checks if an image region has alpha
        var isRegionEmpty = function (left, top, width, height) {
            var right = left + width;
            var bottom = top + height;

            for (var x = left; x < right; x++) {
                for (var y = top; y < bottom; y++) {
                    if (! isPixelEmpty(x, y)) {
                        return false;
                    }
                }
            }

            return true;
        };

        var isPixelEmpty = function (x, y) {
            var alpha = y * (atlasImage.width * 4) + x * 4 + 3;
            return imageData.data[alpha] === 0;
        };

        events.push(rootPanel.on('clear', function () {
            panel.destroy();
        }));

        panel.on('destroy', function () {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
