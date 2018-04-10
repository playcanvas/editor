editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:spriteassets', function(args) {
        // TODO: make this a bottom panel
        return;

        var events = [];

        var atlasAsset = args.atlasAsset;

        var rootPanel = editor.call('picker:sprites:leftPanel');

        // Sprites assets associated with this atlas
        var panelSpriteAssets = editor.call('attributes:addPanel', {
            parent: rootPanel,
            name: 'SPRITE ASSETS'
        });

        panelSpriteAssets.class.add('sprite-assets');

        // reference
        editor.call('attributes:reference:attach', 'spriteeditor:sprites', panelSpriteAssets, panelSpriteAssets.headerElement, rootPanel);

        var fieldSprites = editor.call('attributes:addField', {
            parent: panelSpriteAssets,
            name: 'No. of sprites'
        });

        // holds all panels indexed by asset id
        var panelsIndex = {};
        // holds the key of the first frame for each sprite asset - used for rendering preview
        var firstFramePerSprite = {};

        var createSpriteAssetPanel = function (asset) {
            var spriteEvents = [];

            // sprite panel
            var panel = new ui.Panel();
            panel.class.add('sprite');

            // sprite preview
            var canvas = new ui.Canvas();
            canvas.class.add('preview');
            canvas.resize(26, 26);
            panel.append(canvas);

            panelsIndex[asset.get('id')] = panel;

            panel.updateFirstFrame = function () {
                var frameKeys = asset.getRaw('data.frameKeys');
                firstFramePerSprite[asset.get('id')] = frameKeys[0];
            };

            panel.updateFirstFrame();

            var renderQueued = false;

            panel.queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            var renderPreview = function () {
                renderQueued = false;

                var frameKeys = asset.getRaw('data.frameKeys');
                var frames = frameKeys.map(function (f) {
                    if (f) {
                        var frame = atlasAsset.getRaw('data.frames.' + f);
                        return frame && frame._data;
                    } else {
                        return null;
                    }
                });

                editor.call('picker:sprites:renderFramePreview', frames[0], canvas.element, frames);
            };

            renderPreview();

            // sprite name
            var fieldName = new ui.Label();
            fieldName.class.add('name');
            fieldName.value = asset.get('name');
            panel.append(fieldName);

            spriteEvents.push(asset.on('name:set', function (value) {
                fieldName.value = value;
            }));

            spriteEvents.push(asset.on('data.frameKeys:insert', function (value, index) {
                if (index === 0) {
                    panel.updateFirstFrame();
                    panel.queueRender();
                }
            }));

            spriteEvents.push(asset.on('data.frameKeys:remove', function (value, index) {
                if (index === 0) {
                    panel.updateFirstFrame();
                    panel.queueRender();
                }
            }));

            spriteEvents.push(asset.on('data.frameKeys:move', function (value, indNew, indOld) {
                if (indNew === 0 || indOld === 0) {
                    panel.updateFirstFrame();
                    panel.queueRender();
                }
            }));

            spriteEvents.push(asset.on('data.frameKeys:set', function (value) {
                panel.updateFirstFrame();
                panel.queueRender();
            }));

            // sprite path (TODO)
            var fieldPath = new ui.Label();
            fieldPath.class.add('path');

            // delete sprite
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.append(btnRemove);

            btnRemove.on('click', function (e) {
                e.stopPropagation();
                editor.call('assets:delete:picker', [ asset ]);
            });

            // link to sprite asset
            panel.on('click', function () {
                editor.call('picker:sprites:selectSprite', asset, {
                    history: true
                });
            });

            spriteEvents.push(editor.on('assets:remove[' + asset.get('id') + ']', function () {
                panel.destroy();
                delete panelsIndex[asset.get('id')];
                fieldSprites.value = Math.max(0, parseInt(fieldSprites.value, 10) - 1);
            }));

            // clean up events
            panel.on('destroy', function () {
                for (var i = 0, len = spriteEvents.length; i<len; i++) {
                    spriteEvents[i].unbind();
                }
                spriteEvents.length = 0;
            });

            panelSpriteAssets.append(panel);
        };

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

        events.push(atlasAsset.on('*:set', function (path) {
            if (! path.startsWith('data.frames')) {
                return;
            }

            var parts = path.split('.');
            if (parts.length >= 3) {
                var key = parts[2];
                for (var assetId in firstFramePerSprite) {
                    if (firstFramePerSprite[assetId] === key) {
                        var p = panelsIndex[assetId];
                        if (p) {
                            p.queueRender();
                        }
                    }
                }
            }
        }));

        events.push(atlasAsset.on('*:unset', function (path) {
            if (! path.startsWith('data.frames')) {
                return;
            }

            var parts = path.split('.');
            if (parts.length >= 3) {
                var key = parts[2];
                for (var assetId in firstFramePerSprite) {
                    if (firstFramePerSprite[assetId] === key) {
                        var p = panelsIndex[assetId];
                        if (p) {
                            p.queueRender();
                        }
                    }
                }
            }
        }));

        events.push(rootPanel.on('clear', function () {
            panelSpriteAssets.destroy();
        }));

        panelSpriteAssets.on('destroy', function () {
            for (var i = 0, len = events.length; i<len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
