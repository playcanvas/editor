import type { EventHandle, Observer } from '@playcanvas/observer';
import { type Container, Label, Panel } from '@playcanvas/pcui';

import { LegacyList } from '@/common/ui/list';
import { LegacyListItem } from '@/common/ui/list-item';

editor.once('load', () => {
    editor.method('picker:sprites:attributes:frames:relatedSprites', (args) => {
        const events: EventHandle[] = [];

        const atlasAsset = args.atlasAsset;
        const frames = args.frames;
        const numFrames = frames.length;

        const rootPanel: Panel = editor.call('picker:sprites:rightPanel');
        const rootPanelContent: Container = editor.call('picker:sprites:rightPanelContent');

        const panel = new Panel({
            headerText: 'RELATED SPRITE ASSETS',
            class: 'component'
        });
        rootPanelContent.append(panel);

        const labelNoAssets = new Label({
            text: 'None'
        });
        panel.append(labelNoAssets);

        const list = new LegacyList();
        list.class.add('related-assets');
        panel.append(list);

        const assets = editor.call('assets:find', (asset: Observer) => {
            if (asset.get('type') !== 'sprite' || asset.get('data.textureAtlasAsset') !== atlasAsset.get('id')) {
                return false;
            }

            const keys = asset.getRaw('data.frameKeys');
            for (let i = 0; i < numFrames; i++) {
                if (keys.indexOf(frames[i]) !== -1) {
                    return true;
                }
            }

            return false;
        });

        labelNoAssets.hidden = assets.length > 0;
        list.hidden = assets.length === 0;

        const createAssetPanel = (asset: Observer): void => {
            const assetEvents = [];

            const item = new LegacyListItem({
                text: asset.get('name')
            });
            item.class.add('type-sprite');
            list.append(item);
            item.on('click', () => {
                editor.call('picker:sprites:selectSprite', asset);
            });

            assetEvents.push(asset.on('name:set', (value) => {
                item.text = value;
            }));

            assetEvents.push(asset.once('destroy', () => {
                item.destroy();
            }));

            item.once('destroy', () => {
                assetEvents.forEach(event => event.unbind());
                assetEvents.length = 0;
            });
        };

        assets.forEach(([, asset]) => createAssetPanel(asset));

        // clean up
        events.push(rootPanel.on('clear', () => {
            panel.destroy();
        }));

        panel.once('destroy', () => {
            events.forEach(event => event.unbind());
            events.length = 0;
        });
    });
});
