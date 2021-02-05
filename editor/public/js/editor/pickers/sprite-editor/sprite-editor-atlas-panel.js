editor.once('load', function () {
    'use strict';

    editor.method('picker:sprites:attributes:atlas', function (atlasAsset) {
        var rootPanel = editor.call('picker:sprites:rightPanel');

        rootPanel.header = 'TEXTURE ATLAS';

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });

        var events = [];

        // atlas id
        var fieldId = editor.call('attributes:addField', {
            parent: panel,
            name: 'ID',
            link: atlasAsset,
            path: 'id'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:id', fieldId.parent.innerElement.firstChild.ui, null, panel);

        // atlas width
        var fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Width',
            path: 'meta.width',
            link: atlasAsset
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:width', fieldWidth.parent.innerElement.firstChild.ui, null, panel);

        // atlas height
        var fieldHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            path: 'meta.height',
            link: atlasAsset
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:height', fieldHeight.parent.innerElement.firstChild.ui, null, panel);

        // number of frames
        var fieldFrames = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frames'
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:frames', fieldFrames.parent.innerElement.firstChild.ui, null, panel);

        var timeout;

        // Update number of frames field
        var updateFrameCount = function () {
            timeout = null;
            var frames = atlasAsset.getRaw('data.frames')._data;
            fieldFrames.value = Object.keys(frames).length;
        };

        updateFrameCount();

        // Update number of frames when data.frames changes or when a new frame is added
        atlasAsset.on('*:set', function (path, value) {
            if (! /^data\.frames(\.\d+)?$/.test(path)) return;

            // do this in a timeout to avoid updating
            // when we add a lot of frames at once
            if (! timeout)
                timeout = setTimeout(updateFrameCount);

        });

        // Update number of frames when a frame is deleted
        atlasAsset.on('*:unset', function (path) {
            if (! /^data\.frames\.\d+$/.test(path)) return;

            // do this in a timeout to avoid updating
            // when we add a lot of frames at once
            if (! timeout)
                timeout = setTimeout(updateFrameCount);
        });

        events.push(rootPanel.on('clear', function () {
            panel.destroy();
        }));

        panel.on('destroy', function () {
            for (var i = 0, len = events.length; i < len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
