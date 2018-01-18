editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:atlas', function (atlasAsset) {
        var rootPanel = editor.call('picker:sprites:editor:attributesPanel');

        rootPanel.header = 'TEXTURE ATLAS';

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });

        var events = [];

        // atlas width
        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Width',
            path: 'meta.width',
            link: atlasAsset
        });

        // atlas height
        var fieldHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            path: 'meta.height',
            link: atlasAsset
        });

        // number of frames
        var fieldFrames = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frames'
        });

        // Update number of frames field
        var updateFrameCount = function () {
            var frames = atlasAsset.get('data.frames');
            fieldFrames.value = Object.keys(frames).length;
        };

        updateFrameCount();

        // Update number of frames when data.frames changes or when a new frame is added
        atlasAsset.on('*:set', function (path, value) {
            if (! /^data\.frames(\.\d+)?$/.test(path)) return;

            updateFrameCount();
        });

        // Update number of frames when a frame is deleted
        atlasAsset.on('*:unset', function (path) {
            if (! /^data\.frames\.\d+$/.test(path)) return;

            updateFrameCount();
        });

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
