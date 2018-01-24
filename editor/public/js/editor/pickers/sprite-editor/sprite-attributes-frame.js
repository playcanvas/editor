editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:frame', function(args) {
        var events = [];
        var suspendChanges = false;
        var atlasAsset = args.atlasAsset;
        var frameKey = args.frameKey;

        var rootPanel = editor.call('picker:sprites:editor:rightPanel');
        rootPanel.header = 'FRAME';

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });

        // position in pixels
        var fieldPosition = editor.call('attributes:addField', {
            parent: panel,
            name: 'Position',
            type: 'vec2',
            precision: 1,
            placeholder: ['X', 'Y'],
        });

        fieldPosition[0].on('change', function (value) {
            if (suspendChanges) return;
            var width = atlasAsset.get('meta.width');
            atlasAsset.set('data.frames.' + frameKey + '.rect.0', value / width);
        });

        fieldPosition[1].on('change', function (value) {
            if (suspendChanges) return;
            var height = atlasAsset.get('meta.height');
            var frameHeight = atlasAsset.get('data.frames.' + frameKey + '.rect.3');
            atlasAsset.set('data.frames.' + frameKey + '.rect.1', 1 - (value / height + frameHeight));
        });

        // size in pixels
        var fieldSize = editor.call('attributes:addField', {
            parent: panel,
            name: 'Size',
            type: 'vec2',
            precision: 1,
            min: 0.1,
            placeholder: ['W', 'H'],
        });

        fieldSize[0].on('change', function (value) {
            if (suspendChanges) return;
            var width = atlasAsset.get('meta.width');
            atlasAsset.set('data.frames.' + frameKey + '.rect.2', value / width);
        });

        fieldSize[1].on('change', function (value) {
            if (suspendChanges) return;
            var height = atlasAsset.get('meta.height');
            atlasAsset.set('data.frames.' + frameKey + '.rect.3', value / height);
        });

        // pivot presets
        var presetValues = [
            [0, 0],
            [0.5, 0],
            [1, 0],
            [0, 0.5],
            [0.5, 0.5],
            [1, 0.5],
            [0, 1],
            [0.5, 1],
            [1, 1]
        ];

        var fieldPivotPreset = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot Preset',
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
            ]
        });

        fieldPivotPreset.on('change', function (value) {
            if (suspendChanges) return;
            atlasAsset.set('data.frames.' + frameKey + '.pivot', presetValues[value]);
        });

        // pivot
        var fieldPivot = editor.call('attributes:addField', {
            parent: panel,
            name: 'Pivot',
            type: 'vec2',
            min: 0,
            max: 1,
            placeholder: ['\u2194', '\u2195']
        });

        fieldPivot[0].on('change', function (value) {
            if (suspendChanges) return;

            atlasAsset.set('data.frames.' + frameKey + '.pivot.0', value);
        });
        fieldPivot[1].on('change', function (value) {
            if (suspendChanges) return;

            atlasAsset.set('data.frames.' + frameKey + '.pivot.1', value);
        });

        // sync field values to asset
        var updateFields = function () {
            suspendChanges = true;

            var frame = atlasAsset.get('data.frames.' + frameKey);
            var width = atlasAsset.get('meta.width');
            var height = atlasAsset.get('meta.height');

            // check if frame rect / pivot exist because
            // this might be a new frame and not all fields have been set yet
            if (frame.rect)  {
                fieldPosition[0].value = frame.rect[0] * width;
                fieldPosition[1].value = (1 - (frame.rect[1] + frame.rect[3])) * height;
                fieldSize[0].value = frame.rect[2] * width;
                fieldSize[1].value = frame.rect[3] * height;
            }

            if (frame.pivot) {
                fieldPivot[0].value = frame.pivot[0];
                fieldPivot[1].value = frame.pivot[1];
                for (var i = 0; i < presetValues.length; i++) {
                    if (presetValues[i][0] === frame.pivot[0] && presetValues[i][1] === frame.pivot[1]) {
                        fieldPivotPreset.value = i;
                        break;
                    }
                }
            }

            suspendChanges = false;
        };

        events.push(atlasAsset.on('*:set', function (path, value) {
            if (! path.startsWith('data.frames.' + frameKey)) return;

            var parts = path.split('.');
            if (parts[2] !== frameKey) return;

            updateFields() ;
        }));

        updateFields();

        // trim rect
        var btnTrim = editor.call('attributes:addField', {
            parent: panel,
            name: ' ',
            text: 'Trim',
            type: 'button',
        });

        // delete frame
        var btnDelete = editor.call('attributes:addField', {
            parent: panel,
            text: 'Delete',
            type: 'button',
            name: ' '
        });

        btnDelete.on('click', function () {
            atlasAsset.unset('data.frames.' + frameKey);
        });

        // clean up
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
