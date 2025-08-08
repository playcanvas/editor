/**
 * @import { Panel } from '@playcanvas/pcui'
 */

editor.once('load', () => {
    editor.method('picker:sprites:attributes:atlas', (atlasAsset) => {
        /** @type {Panel} */
        const rootPanel = editor.call('picker:sprites:rightPanel');

        rootPanel.headerText = 'TEXTURE ATLAS';

        const panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });

        const events = [];

        // atlas id
        const fieldId = editor.call('attributes:addField', {
            parent: panel,
            name: 'ID',
            link: atlasAsset,
            path: 'id'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:id', fieldId.parent.innerElement.firstChild.ui, null, panel);

        // atlas width
        const fieldWidth = editor.call('attributes:addField', {
            parent: panel,
            name: 'Width',
            path: 'meta.width',
            link: atlasAsset
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:width', fieldWidth.parent.innerElement.firstChild.ui, null, panel);

        // atlas height
        const fieldHeight = editor.call('attributes:addField', {
            parent: panel,
            name: 'Height',
            path: 'meta.height',
            link: atlasAsset
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:height', fieldHeight.parent.innerElement.firstChild.ui, null, panel);

        // number of frames
        const fieldFrames = editor.call('attributes:addField', {
            parent: panel,
            name: 'Frames'
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:frames', fieldFrames.parent.innerElement.firstChild.ui, null, panel);

        let timeout;

        // Update number of frames field
        const updateFrameCount = function () {
            timeout = null;
            const frames = atlasAsset.getRaw('data.frames')._data;
            fieldFrames.value = Object.keys(frames).length;
        };

        updateFrameCount();

        // Update number of frames when data.frames changes or when a new frame is added
        atlasAsset.on('*:set', (path, value) => {
            if (!/^data\.frames(?:\.\d+)?$/.test(path)) {
                return;
            }

            // do this in a timeout to avoid updating
            // when we add a lot of frames at once
            if (!timeout) {
                timeout = setTimeout(updateFrameCount);
            }

        });

        // Update number of frames when a frame is deleted
        atlasAsset.on('*:unset', (path) => {
            if (!/^data\.frames\.\d+$/.test(path)) {
                return;
            }

            // do this in a timeout to avoid updating
            // when we add a lot of frames at once
            if (!timeout) {
                timeout = setTimeout(updateFrameCount);
            }
        });

        events.push(rootPanel.on('clear', () => {
            panel.destroy();
        }));

        panel.on('destroy', () => {
            for (let i = 0, len = events.length; i < len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
