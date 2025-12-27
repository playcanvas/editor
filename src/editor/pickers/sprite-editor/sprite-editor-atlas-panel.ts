import type { EventHandle } from '@playcanvas/observer';
import { type Container, Label, type Panel } from '@playcanvas/pcui';

import type { Attribute } from '@/editor/inspector/attribute.type.d';
import { AttributesInspector } from '@/editor/inspector/attributes-inspector';

const ATTRIBUTES: Attribute[] = [
    {
        label: 'ID',
        path: 'id',
        reference: 'asset:id',
        type: 'label'
    },
    {
        label: 'Width',
        path: 'meta.width',
        reference: 'spriteeditor:atlas:width',
        type: 'label'
    },
    {
        label: 'Height',
        path: 'meta.height',
        reference: 'spriteeditor:atlas:height',
        type: 'label'
    },
    {
        label: 'Frames',
        alias: 'frames',
        reference: 'spriteeditor:atlas:frames',
        type: 'label',
        args: {
            value: '0'
        }
    }
];

editor.once('load', () => {
    editor.method('picker:sprites:attributes:atlas', (atlasAsset) => {
        const rootPanel: Panel = editor.call('picker:sprites:rightPanel');
        const rootPanelContent: Container = editor.call('picker:sprites:rightPanelContent');

        rootPanel.headerText = 'TEXTURE ATLAS';

        const events: EventHandle[] = [];

        const inspector = new AttributesInspector({
            history: editor.api.globals.history,
            attributes: ATTRIBUTES
        });
        rootPanelContent.append(inspector);
        inspector.link([atlasAsset]);

        let timeout: ReturnType<typeof setTimeout> | null = null;

        // Update number of frames field
        const updateFrameCount = (): void => {
            timeout = null;
            const frames = atlasAsset.getRaw('data.frames')._data;
            (inspector.getField('frames') as Label).value = String(Object.keys(frames).length);
        };

        updateFrameCount();

        // Update number of frames when data.frames changes or when a new frame is added
        events.push(atlasAsset.on('*:set', (path: string) => {
            if (!/^data\.frames(?:\.\d+)?$/.test(path)) {
                return;
            }

            // do this in a timeout to avoid updating
            // when we add a lot of frames at once
            if (!timeout) {
                timeout = setTimeout(updateFrameCount);
            }
        }));

        // Update number of frames when a frame is deleted
        events.push(atlasAsset.on('*:unset', (path: string) => {
            if (!/^data\.frames\.\d+$/.test(path)) {
                return;
            }

            // do this in a timeout to avoid updating
            // when we add a lot of frames at once
            if (!timeout) {
                timeout = setTimeout(updateFrameCount);
            }
        }));

        events.push(rootPanel.on('clear', () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            inspector.unlink();
            inspector.destroy();
        }));

        inspector.once('destroy', () => {
            events.forEach(event => event.unbind());
            events.length = 0;
        });
    });
});
