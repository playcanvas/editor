import type { EventHandle } from '@playcanvas/observer';
import { Container, type Panel } from '@playcanvas/pcui';

editor.once('load', () => {
    editor.method('picker:sprites:attributes:atlas', (atlasAsset) => {
        const rootPanel: Panel = editor.call('picker:sprites:rightPanel');

        rootPanel.headerText = 'TEXTURE ATLAS';

        const container = new Container({
            class: 'atlas-attributes'
        });
        rootPanel.append(container);

        const events: EventHandle[] = [];

        // atlas id
        const fieldId = editor.call('attributes:addField', {
            parent: container,
            name: 'ID',
            link: atlasAsset,
            path: 'id'
        });
        // reference
        editor.call('attributes:reference:attach', 'asset:id', fieldId.parent.innerElement.firstChild.ui, null, container);

        // atlas width
        const fieldWidth = editor.call('attributes:addField', {
            parent: container,
            name: 'Width',
            path: 'meta.width',
            link: atlasAsset
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:width', fieldWidth.parent.innerElement.firstChild.ui, null, container);

        // atlas height
        const fieldHeight = editor.call('attributes:addField', {
            parent: container,
            name: 'Height',
            path: 'meta.height',
            link: atlasAsset
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:height', fieldHeight.parent.innerElement.firstChild.ui, null, container);

        // number of frames
        const fieldFrames = editor.call('attributes:addField', {
            parent: container,
            name: 'Frames'
        });
        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:atlas:frames', fieldFrames.parent.innerElement.firstChild.ui, null, container);

        let timeout: ReturnType<typeof setTimeout> | null = null;

        // Update number of frames field
        const updateFrameCount = () => {
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
            container.destroy();
        }));

        container.once('destroy', () => {
            events.forEach(event => event.unbind());
            events.length = 0;
        });
    });
});
