editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:frames:relatedSprites', function (args) {
        var events = [];

        var frames = args.frames;
        var numFrames = frames.length;

        var rootPanel = editor.call('picker:sprites:rightPanel');

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'RELATED SPRITE ASSETS'
        });

        panel.class.add('component');

        var labelNoAssets = new ui.Label({
            text: 'None'
        });
        panel.append(labelNoAssets);

        var list = new ui.List();
        list.class.add('related-assets');
        panel.append(list);

        var assets = editor.call('assets:find', function (asset) {
            if (asset.get('type') !== 'sprite') return false;

            var keys = asset.getRaw('data.frameKeys');
            for (var i = 0; i < numFrames; i++) {
                if (keys.indexOf(frames[i]) !== -1) {
                    return true;
                }
            }

            return false;
        });

        labelNoAssets.hidden = assets.length > 0;
        list.hidden = assets.length === 0;

        var createAssetPanel = function (asset) {
            var assetEvents = [];

            var item = new ui.ListItem({
                text: asset.get('name')
            });
            item.class.add('type-sprite');
            list.append(item);
            item.on('click', function () {
                editor.call('picker:sprites:selectSprite', asset);
            });

            assetEvents.push(asset.on('name:set', function (value) {
                item.text = value;
            }));

            assetEvents.push(asset.once('destroy', function () {
                item.destroy();
            }));

            item.on('destroy', function () {
                for (var i = 0; i < assetEvents.length; i++) {
                    assetEvents[i].unbind();
                }
                assetEvents.length = 0;
            });
        };

        for (var i = 0; i < assets.length; i++) {
            createAssetPanel(assets[i][1]);
        }

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
