editor.once('load', function () {
    editor.method('picker:sprites:spriteassets', function (args) {
        const events = [];

        const atlasAsset = args.atlasAsset;

        // context menu
        const menu = new ui.Menu();
        editor.call('layout.root').append(menu);
        let contextMenuAsset = null;

        // context menu options

        // duplicate
        const menuDuplicate = new ui.MenuItem({
            text: 'Duplicate',
            icon: '&#57638;',
            value: 'duplicate'
        });
        menuDuplicate.on('select', function () {
            if (!contextMenuAsset) return;
            editor.call('assets:duplicate', contextMenuAsset);
        });
        menu.append(menuDuplicate);

        // delete
        const menuDelete = new ui.MenuItem({
            text: 'Delete',
            icon: '&#57636;',
            value: 'delete'
        });
        menuDelete.on('select', function () {
            if (!contextMenuAsset) return;
            editor.call('assets:delete:picker', [contextMenuAsset]);
        });
        menu.append(menuDelete);

        /** @type {import('@playcanvas/pcui').Panel} */
        const rootPanel = editor.call('picker:sprites:bottomPanel');

        // grid
        const grid = new ui.Grid({
            multiSelect: false
        });
        grid.class.add('sprites');
        rootPanel.append(grid);

        // holds all sprite items indexed by asset id
        const spriteItems = {};
        // holds the key of the first frame for each sprite asset - used for rendering preview
        const firstFramePerSprite = {};

        const createSpriteItem = function (asset) {
            const spriteEvents = [];

            // sprite item
            const spriteItem = new ui.GridItem({
                toggleSelectOnClick: false
            });

            // sprite preview
            const canvas = new ui.Canvas();
            canvas.class.add('thumbnail');
            canvas.resize(64, 64);
            spriteItem.element.appendChild(canvas.element);

            spriteItems[asset.get('id')] = spriteItem;

            spriteItem.updateFirstFrame = function () {
                const frameKeys = asset.getRaw('data.frameKeys');
                firstFramePerSprite[asset.get('id')] = frameKeys[0];
            };

            spriteItem.updateFirstFrame();

            let renderQueued = false;

            spriteItem.queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            const renderPreview = function () {
                renderQueued = false;

                const frameKeys = asset.getRaw('data.frameKeys');
                const frames = frameKeys.map(function (f) {
                    if (f) {
                        const frame = atlasAsset.getRaw('data.frames.' + f);
                        return frame && frame._data;
                    }
                    return null;

                });

                editor.call('picker:sprites:renderFramePreview', frames[0], canvas.element, frames);
            };

            renderPreview();

            // sprite name
            const fieldName = new ui.Label();
            fieldName.class.add('label');
            fieldName.value = asset.get('name');
            spriteItem.element.appendChild(fieldName.element);

            spriteEvents.push(asset.on('name:set', function (value) {
                fieldName.value = value;
            }));

            spriteEvents.push(asset.on('data.frameKeys:insert', function (value, index) {
                if (index === 0) {
                    spriteItem.updateFirstFrame();
                    spriteItem.queueRender();
                }
            }));

            spriteEvents.push(asset.on('data.frameKeys:remove', function (value, index) {
                if (index === 0) {
                    spriteItem.updateFirstFrame();
                    spriteItem.queueRender();
                }
            }));

            spriteEvents.push(asset.on('data.frameKeys:move', function (value, indNew, indOld) {
                if (indNew === 0 || indOld === 0) {
                    spriteItem.updateFirstFrame();
                    spriteItem.queueRender();
                }
            }));

            spriteEvents.push(asset.on('data.frameKeys:set', function (value) {
                spriteItem.updateFirstFrame();
                spriteItem.queueRender();
            }));

            // link to sprite asset
            spriteItem.on('click', function () {
                editor.call('picker:sprites:selectSprite', asset, {
                    history: true
                });
            });

            spriteEvents.push(editor.on('assets:remove[' + asset.get('id') + ']', function () {
                spriteItem.destroy();
                delete spriteItems[asset.get('id')];
                if (contextMenuAsset && contextMenuAsset.get('id') === asset.get('id')) {
                    contextMenuAsset = null;
                    if (menu.open) {
                        menu.open = false;
                    }
                }
            }));

            // context menu
            const contextMenu = function (e) {
                if (!editor.call('permissions:write')) return;

                contextMenuAsset = asset;
                menu.open = true;
                menu.position(e.clientX + 1, e.clientY);
            };

            spriteItem.element.addEventListener('contextmenu', contextMenu);

            // clean up events
            spriteItem.on('destroy', function () {
                for (let i = 0, len = spriteEvents.length; i < len; i++) {
                    spriteEvents[i].unbind();
                }
                spriteEvents.length = 0;

                spriteItem.element.removeEventListener('contextmenu', contextMenu);
            });

            grid.append(spriteItem);

            return spriteItem;
        };

        // find all sprite assets associated with this atlas
        const spriteAssets = editor.call('assets:find', function (asset) {
            const atlasId = parseInt(atlasAsset.get('id'), 10);
            return asset.get('type') === 'sprite' && parseInt(asset.get('data.textureAtlasAsset'), 10) === atlasId;
        });

        for (let i = 0; i < spriteAssets.length; i++) {
            createSpriteItem(spriteAssets[i][1]);
        }

        // Add / modify frame event
        events.push(atlasAsset.on('*:set', function (path) {
            if (!path.startsWith('data.frames')) {
                return;
            }

            const parts = path.split('.');
            if (parts.length >= 3) {
                const key = parts[2];
                for (const assetId in firstFramePerSprite) {
                    if (firstFramePerSprite[assetId] === key) {
                        const p = spriteItems[assetId];
                        if (p) {
                            p.queueRender();
                        }
                    }
                }
            }
        }));

        // Delete frame event
        events.push(atlasAsset.on('*:unset', function (path) {
            if (!path.startsWith('data.frames')) {
                return;
            }

            const parts = path.split('.');
            if (parts.length >= 3) {
                const key = parts[2];
                for (const assetId in firstFramePerSprite) {
                    if (firstFramePerSprite[assetId] === key) {
                        const p = spriteItems[assetId];
                        if (p) {
                            p.queueRender();
                        }
                    }
                }
            }
        }));

        // Sprite selection event
        events.push(editor.on('picker:sprites:spriteSelected', function (sprite) {
            if (!sprite) {
                grid.selected = [];
            } else {
                const item = spriteItems[sprite.get('id')];
                if (item) {
                    grid.selected = [item];
                } else {
                    grid.selected = [];
                }
            }
        }));

        // Asset create event
        events.push(editor.on('assets:add', function (asset) {
            if (asset.get('type') !== 'sprite') return;

            const id = parseInt(asset.get('data.textureAtlasAsset'), 10);
            if (id !== parseInt(atlasAsset.get('id'), 10)) return;

            spriteAssets.push(asset);
            const item = createSpriteItem(asset);
            if (item) {
                item.flash();
            }
        }));

        // Sprite edit mode
        events.push(editor.on('picker:sprites:pickFrames:start', function () {
            rootPanel.enabled = false;
        }));

        events.push(editor.on('picker:sprites:pickFrames:end', function () {
            rootPanel.enabled = true;
        }));

        events.push(rootPanel.on('clear', function () {
            grid.destroy();
        }));

        grid.on('destroy', function () {
            menu.destroy();
            contextMenuAsset = null;

            for (let i = 0, len = events.length; i < len; i++) {
                events[i].unbind();
            }
            events.length = 0;
        });
    });
});
