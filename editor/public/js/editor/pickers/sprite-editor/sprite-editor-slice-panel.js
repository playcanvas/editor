editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:slice', function (args) {
        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;
        var imageData = args.atlasImageData;

        var rootPanel = editor.call('picker:sprites:rightPanel');

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'SLICE'
        });

        var events = [];

        var fieldMethod = editor.call('attributes:addField', {
            parent: panel,
            name: 'Method',
            type: 'number',
            value: 1,
            enum: [
                { v: 1, t: 'Delete Existing' },
                { v: 2, t: 'Only Append' },
            ],
        });

        var fieldType = editor.call('attributes:addField', {
            parent: panel,
            name: 'Type',
            type: 'number',
            value: 1,
            enum: [
                {v: 1, t: 'Grid By Cell Count'},
                {v: 2, t: 'Grid By Cell Size'}
                // {v: 3, t: 'Auto'}
            ]
        });

        var fieldColsRows = editor.call('attributes:addField', {
            parent: panel,
            name: 'Cell Count',
            type: 'vec2',
            value: [1, 1],
            precision: 0,
            min: 1,
            placeholder: ['Cols', 'Rows']
        });

        var fieldPixels = editor.call('attributes:addField', {
            parent: panel,
            name: 'Cell Size',
            type: 'vec2',
            value: [atlasImage.width, atlasImage.height],
            precision: 0,
            min: 1,
            placeholder: ['X', 'Y']
        });

        var fieldOffset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Offset',
            type: 'vec2',
            value: [0, 0],
            precision: 0,
            min: 0,
            placeholder: ['X', 'Y']
        });

        var fieldPadding = editor.call('attributes:addField', {
            parent: panel,
            name: 'Padding',
            type: 'vec2',
            value: [0, 0],
            precision: 0,
            min: 0,
            placeholder: ['X', 'Y']
        });

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
                { v: 0, t: 'Top Left' },
                { v: 1, t: 'Top' },
                { v: 2, t: 'Top Right' },
                { v: 3, t: 'Left' },
                { v: 4, t: 'Center' },
                { v: 5, t: 'Right' },
                { v: 6, t: 'Bottom Left' },
                { v: 7, t: 'Bottom' },
                { v: 8, t: 'Bottom Right' }
            ],
            value: 4
        });

        var toggleFields = function () {
            fieldColsRows[0].parent.hidden = fieldType.value !== 1;
            fieldPixels[0].parent.hidden = fieldType.value !== 2;
            fieldOffset[0].parent.hidden = fieldType.value !== 1 && fieldType.value !== 2;
            fieldPadding[0].parent.hidden = fieldType.value !== 1 && fieldType.value !== 2;
        };

        toggleFields();

        fieldType.on('change', toggleFields);

        var btnSlice = editor.call('attributes:addField', {
            parent: panel,
            text: 'Slice Atlas',
            type: 'button',
            name: ' '
        });

        btnSlice.class.add('icon', 'slice');

        btnSlice.on('click', function () {
            btnSlice.disabled = true;
            var type = fieldType.value;
            var method = fieldMethod.value;

            var oldFrames = atlasAsset.get('data.frames');
            var newFrames = method === 1 ? {} : atlasAsset.get('data.frames');

            var redo = function () {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;
                var history = asset.history.enabled;
                asset.history.enabled = false;

                if (type === 1) {
                    sliceGrid(fieldColsRows[0].value, fieldColsRows[1].value, newFrames);

                    // set frames and manually emit 'set' event
                    // to avoid huge performance hit if there's a lot of frames
                    setFrames(asset, newFrames);
                } else if (type === 2) {
                    var width = atlasImage.width;
                    var height = atlasImage.height;
                    sliceGrid(Math.floor(width / fieldPixels[0].value), Math.floor(height / fieldPixels[1].value), newFrames);
                    setFrames(asset, newFrames);
                } else if (type === 3) {
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
                btnSlice.disabled = false;
            }, 50);
        });

        var btnClear = editor.call('attributes:addField', {
            parent: panel,
            text: 'Delete All Frames',
            type: 'button',
            name: ' '
        });

        btnClear.class.add('icon', 'remove');

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
        var sliceGrid = function (cols, rows, frames) {
            var pivot = presetValues[fieldPivot.value];

            var maxKey = 1;
            for (var key in frames) {
                maxKey = Math.max(maxKey, parseInt(key, 10) + 1);
            }

            var offsetX = fieldOffset[0].value;
            var offsetY = fieldOffset[1].value;
            var paddingX = fieldPadding[0].value;
            var paddingY = fieldPadding[1].value;

            var imgWidth = atlasImage.width;
            var imgHeight = atlasImage.height;

            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var w = imgWidth / cols;
                    var h = imgHeight / rows;
                    var width = Math.floor(w - 2 * paddingX);
                    var height = Math.floor(h - 2 * paddingY);
                    var left = Math.floor(offsetX + c * w + paddingX);
                    var top = Math.floor(offsetY + r * h + paddingY);
                    if (! isRegionEmpty(left, top, width, height)) {
                        frames[maxKey] = {
                            name: 'Frame ' + maxKey,
                            rect: [left, Math.floor(imgHeight - (top + height)), width, height],
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
