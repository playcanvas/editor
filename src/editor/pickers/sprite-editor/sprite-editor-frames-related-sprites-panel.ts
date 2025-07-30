import { LegacyLabel } from '../../../common/ui/label.ts';
import { LegacyListItem } from '../../../common/ui/list-item.ts';
import { LegacyList } from '../../../common/ui/list.ts';

editor.once('load', () => {
    editor.method('picker:sprites:attributes:frames:relatedSprites', (args) => {
        const events = [];

        const atlasAsset = args.atlasAsset;
        const frames = args.frames;
        const numFrames = frames.length;

        const rootPanel = editor.call('picker:sprites:rightPanel');

        const panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'RELATED SPRITE ASSETS'
        });

        panel.class.add('component');

        const labelNoAssets = new LegacyLabel({
            text: 'None'
        });
        panel.append(labelNoAssets);

        const list = new LegacyList();
        list.class.add('related-assets');
        panel.append(list);

        const assets = editor.call('assets:find', (asset) => {
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

        const createAssetPanel = function (asset) {
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

            item.on('destroy', () => {
                for (let i = 0; i < assetEvents.length; i++) {
                    assetEvents[i].unbind();
                }
                assetEvents.length = 0;
            });
        };

        for (let i = 0; i < assets.length; i++) {
            createAssetPanel(assets[i][1]);
        }

        // clean up
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
