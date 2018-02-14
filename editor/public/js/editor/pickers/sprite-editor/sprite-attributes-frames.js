editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:frames', function (args) {
        var events = [];
        var suspendChanges = false;
        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;
        var frames = args.frames;
        var numFrames = frames.length;

        var rootPanel = editor.call('picker:sprites:editor:rightPanel');
        rootPanel.header = numFrames > 1 ? 'MULTIPLE FRAMES' : 'FRAME';

        editor.call('picker:sprites:attributes:frames:preview', {
            atlasAsset: atlasAsset,
            atlasImage: atlasImage,
            frames: frames//frames.map(function (f) {return atlasAsset.get('data.frames.' + f);})
        });

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });

        var fieldName = editor.call('attributes:addField', {
            parent: panel,
            name: 'Name',
            type: 'string',
            link: atlasAsset,
            paths: frames.map(function (f) {return 'data.frames.' + f + '.name';})
        });

        // add field for frame rect but hide it and only use it for multi-editing
        // The user only will see position and size fields in pixels which is more helpful
        // but we'll use the internal rect fields to edit it
        var fieldRect = editor.call('attributes:addField', {
            parent: panel,
            name: 'Rect',
            type: 'vec4',
            link: atlasAsset,
            paths: frames.map(function (f) {return 'data.frames.' + f + '.rect';})
        });
        fieldRect[0].parent.hidden = true;

        fieldRect[0].on('change', function () {
            if (suspendChanges) return;

            suspendChanges = true;
            updatePositionX();
            updateSizeX();
            suspendChanges = false;
        });

        fieldRect[1].on('change', function () {
            if (suspendChanges) return;

            suspendChanges = true;
            updatePositionY();
            updateSizeY();
            suspendChanges = false;
        });

        fieldRect[2].on('change', function () {
            if (suspendChanges) return;

            suspendChanges = true;
            updateSizeX();
            suspendChanges = false;
        });

        fieldRect[3].on('change', function () {
            if (suspendChanges) return;

            suspendChanges = true;
            updatePositionY();
            updateSizeY();
            suspendChanges = false;
        });

        var updatePositionX = function () {
            if (fieldRect[0].proxy) {
                fieldPosition[0].proxy = fieldRect[0].proxy;
                fieldPosition[0].value = null;
            } else {
                fieldPosition[0].value = fieldRect[0].value * atlasAsset.get('meta.width');
            }
        };

        var updatePositionY = function () {
            if (fieldRect[1].proxy || fieldRect[3].proxy) {
                fieldPosition[1].proxy = fieldRect[1].proxy || fieldRect[3].proxy;
                fieldPosition[1].value = null;
            } else {
                fieldPosition[1].value = fieldRect[1].value * atlasAsset.get('meta.height');
            }
        };

        var updateSizeX = function () {
            if (fieldRect[2].proxy) {
                fieldSize[0].proxy = fieldRect[2].proxy;
                fieldSize[0].value = null;
            } else {
                fieldSize[0].value = fieldRect[2].value * atlasAsset.get('meta.width');
            }
        };

        var updateSizeY = function () {
            if (fieldRect[3].proxy) {
                fieldSize[1].proxy = fieldRect[3].proxy;
                fieldSize[1].value = null;
            } else {
                fieldSize[1].value = fieldRect[3].value * atlasAsset.get('meta.height');
            }
        };

        // position in pixels
        var fieldPosition = editor.call('attributes:addField', {
            parent: panel,
            name: 'Position',
            type: 'vec2',
            precision: 1,
            placeholder: ['→', '↑']
        });

        updatePositionX();
        updatePositionY();

        fieldPosition[0].on('change', function (value) {
            if (suspendChanges) return;
            suspendChanges = true;
            fieldRect[0].value = value / atlasAsset.get('meta.width');
            suspendChanges = false;
        });

        fieldPosition[1].on('change', function (value) {
            if (suspendChanges) return;
            suspendChanges = true;
            fieldRect[1].value = value / atlasAsset.get('meta.height');
            suspendChanges = false;
        });

        // size in pixels
        var fieldSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'vec2',
            precision: 1,
            placeholder: ['→', '↑'],
            min: 0.1
        });

        updateSizeX();
        updateSizeY();

        fieldSize[0].on('change', function (value) {
            if (suspendChanges) return;
            suspendChanges = true;
            fieldRect[2].value = value / atlasAsset.get('meta.width');
            suspendChanges = false;
        });

        fieldSize[1].on('change', function (value) {
            if (suspendChanges) return;
            suspendChanges = true;
            fieldRect[3].value = value / atlasAsset.get('meta.height');
            suspendChanges = false;
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

        var fieldPivotPreset = editor.call('attributes:addField', {
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

        fieldPivotPreset.on('change', function (value) {
            if (suspendChanges) return;

            var newValue = presetValues[parseInt(value, 10)];
            if (! newValue) return;

            var prevValues = {};
            for (var i = 0; i < numFrames; i++) {
                prevValues[frames[i]] = atlasAsset.get('data.frames.' + frames[i] + '.pivot');
            }

            var redo = function () {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;

                var history = asset.history.enabled;
                asset.history.enabled = false;
                for (var i = 0; i < numFrames; i++) {
                    var key = 'data.frames.' + frames[i];
                    if (asset.has(key)) {
                        asset.set(key + '.pivot', newValue);
                    }
                }
                asset.history.enabled = history;
            };

            var undo = function () {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;

                var history = asset.history.enabled;
                asset.history.enabled = false;
                for (var i = 0; i < numFrames; i++) {
                    var key = 'data.frames.' + frames[i];
                    if (asset.has(key) && prevValues[frames[i]]) {
                        asset.set(key + '.pivot', prevValues[frames[i]]);
                    }

                }
                asset.history.enabled = history;
            };

            editor.call('history:add', {
                name: 'edit pivot',
                undo: undo,
                redo: redo
            });

            redo();
        });

        // pivot
        var fieldPivot = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot',
            type: 'vec2',
            min: 0,
            max: 1,
            precision: 2,
            step: 0.1,
            placeholder: ['↔', '↕'],
            link: atlasAsset,
            paths: frames.map(function (f) {return 'data.frames.' + f + '.pivot';})
        });

        fieldPivot[0].on('change', function (value) {
            if (suspendChanges) return;
            updatePivotPreset();
        });
        fieldPivot[1].on('change', function (value) {
            if (suspendChanges) return;
            updatePivotPreset();
        });

        var updatePivotPreset = function () {
            var suspend = suspendChanges;
            suspendChanges = true;
            for (var i = 0; i < presetValues.length; i++) {
                if (presetValues[i][0] === fieldPivot[0].value && presetValues[i][1] === fieldPivot[1].value) {
                    fieldPivotPreset.value = i;
                    break;
                }
            }
            suspendChanges = suspend;
        };

        updatePivotPreset();

        var panelButtons = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'ACTIONS'
        });
        panelButtons.class.add('buttons');

        // new sprite
        var btnCreateSprite = new ui.Button({
            text: 'New Sprite'
        });
        btnCreateSprite.class.add('icon', 'wide', 'create');
        panelButtons.append(btnCreateSprite);

        btnCreateSprite.on('click', function () {
            btnCreateSprite.disabled = true;
            editor.call('picker:sprites:editor:spriteFromSelection', function () {
                btnCreateSprite.disabled = false;
            });
        });

        // trim rect
        var btnTrim = new ui.Button({
            text: 'Trim'
        });
        btnTrim.class.add('icon', 'wide', 'trim');
        panelButtons.append(btnTrim);

        btnTrim.on('click', function () {
            // TODO
        });

        // delete frame
        var btnDelete = new ui.Button({
            text: 'Delete'
        });
        btnDelete.class.add('icon', 'wide', 'remove');
        panelButtons.append(btnDelete);
        btnDelete.on('click', function () {
            editor.call('picker:sprites:editor:deleteFrames', frames);
        });

        // clean up
        events.push(rootPanel.on('clear', function () {
            panel.destroy();
            panelButtons.destroy();
        }));

        panel.on('destroy', function () {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
