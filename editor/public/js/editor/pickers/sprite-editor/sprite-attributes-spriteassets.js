editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:spriteassets', function(args) {
        var events = [];

        var atlasAsset = args.atlasAsset;
        var frame = args.frame;

        var rootPanel = editor.call('picker:sprites:editor:attributesPanel');

        // Sprites assets associated with this atlas
        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'SPRITE ASSETS',
            foldable: true,
        });

        var fieldSprites = editor.call('attributes:addField', {
            parent: panel,
            name: 'No. of sprites'
        });

        var panelSpriteAssets = new ui.Panel();
        panelSpriteAssets.class.add('sprite-assets');
        panel.append(panelSpriteAssets);

        var createSpriteAssetPanel = function (asset) {
            var spriteEvents = [];

            // sprite panel
            var panel = new ui.Panel();
            panel.flex = true;
            panel.flexGrow = 1;
            panel.class.add('sprite');

            // sprite preview
            var canvas = new ui.Canvas();
            canvas.class.add('preview');
            canvas.resize(26, 26);
            panel.append(canvas);

            var renderQueued = false;

            var queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            var renderPreview = function () {
                editor.call('preview:render', asset, 26, 26, canvas.element);
            };

            renderPreview();

            // watch and re-render preview when necessary
            var spriteWatch = editor.call('assets:sprite:watch', {
                asset: asset,
                callback: queueRender
            });

            // sprite name
            var fieldName = new ui.Label();
            fieldName.class.add('name');
            fieldName.value = asset.get('name');
            panel.append(fieldName);

            spriteEvents.push(asset.on('name:set', function (value) {
                fieldName.value = value;
            }));

            // sprite path (TODO)
            var fieldPath = new ui.Label();
            fieldPath.class.add('path');

            // link to sprite asset
            panel.on('click', function () {
                // todo
            });

            // clean up events
            panel.on('destroy', function () {
                for (var i = 0, len = spriteEvents.length; i<len; i++) {
                    spriteEvents[i].unbind();
                }
                spriteEvents.length = 0;

                editor.call('assets:sprite:unwatch', asset, spriteWatch);
            });

            panelSpriteAssets.append(panel);
        };

        // Update number of sprite assets field
        var updateSpriteCount = function () {
            // find all sprite assets associated with this atlas
            var spriteAssets = editor.call('assets:find', function (asset) {
                var atlasId = parseInt(atlasAsset.get('id'), 10);
                return asset.get('type') === 'sprite' && parseInt(asset.get('data.textureAtlasAsset'), 10) === atlasId;
            });

            var count = spriteAssets.length;
            fieldSprites.value = count;

            for (var i = 0; i<count; i++) {
                createSpriteAssetPanel(spriteAssets[i][1]);
            }
        };


        updateSpriteCount();

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
