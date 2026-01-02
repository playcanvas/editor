import type { EventHandle, Observer } from '@playcanvas/observer';
import { Canvas, GridView, GridViewItem, Menu, Container, Panel } from '@playcanvas/pcui';

editor.once('load', () => {
    editor.method('picker:sprites:spriteassets', (args) => {
        const events: EventHandle[] = [];

        let contextMenuAsset: Observer = null;

        const atlasAsset: Observer = args.atlasAsset;

        const root: Container = editor.call('layout.root');

        const rootPanel: Panel = editor.call('picker:sprites:bottomPanel');

        // context menu
        const menu = new Menu({
            items: [
                {
                    text: 'Duplicate',
                    icon: 'E126',
                    onSelect: () => {
                        if (!contextMenuAsset) {
                            return;
                        }
                        editor.call('assets:duplicate', contextMenuAsset);
                    }
                }, {
                    text: 'Delete',
                    icon: 'E124',
                    onSelect: () => {
                        if (!contextMenuAsset) {
                            return;
                        }
                        editor.call('assets:delete:picker', [contextMenuAsset]);
                    }
                }
            ]
        });
        root.append(menu);

        // grid for sprite assets
        const grid = new GridView({
            allowDeselect: false,
            multiSelect: false
        });
        rootPanel.append(grid);

        // holds all sprite items indexed by asset id
        const spriteItems = {};
        // holds the key of the first frame for each sprite asset - used for rendering preview
        const firstFramePerSprite = {};

        const createSpriteItem = (asset: Observer) => {
            const spriteEvents: EventHandle[] = [];

            // sprite item
            const spriteItem = new GridViewItem({
                text: asset.get('name')
            });

            // sprite preview
            const canvas = new Canvas();
            canvas.resize(64, 64);
            spriteItem.prepend(canvas);

            spriteItems[asset.get('id')] = spriteItem;

            spriteItem.updateFirstFrame = function () {
                const frameKeys = asset.getRaw('data.frameKeys');
                firstFramePerSprite[asset.get('id')] = frameKeys[0];
            };

            spriteItem.updateFirstFrame();

            let renderQueued = false;

            spriteItem.queueRender = function () {
                if (renderQueued) {
                    return;
                }
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            const renderPreview = () => {
                renderQueued = false;

                const frameKeys = asset.getRaw('data.frameKeys');
                const frames = frameKeys.map((f) => {
                    if (f) {
                        const frame = atlasAsset.getRaw(`data.frames.${f}`);
                        return frame && frame._data;
                    }
                    return null;

                });

                editor.call('picker:sprites:renderFramePreview', frames[0], canvas.dom, frames);
            };

            renderPreview();

            spriteEvents.push(asset.on('name:set', (name: string) => {
                spriteItem.text = name;
            }));

            const onFrameKeysUpdate = (value, index) => {
                if (index === 0) {
                    spriteItem.updateFirstFrame();
                    spriteItem.queueRender();
                }
            };

            spriteEvents.push(asset.on('data.frameKeys:insert', onFrameKeysUpdate));
            spriteEvents.push(asset.on('data.frameKeys:remove', onFrameKeysUpdate));

            spriteEvents.push(asset.on('data.frameKeys:move', (value, indNew, indOld) => {
                if (indNew === 0 || indOld === 0) {
                    spriteItem.updateFirstFrame();
                    spriteItem.queueRender();
                }
            }));

            spriteEvents.push(asset.on('data.frameKeys:set', (value) => {
                spriteItem.updateFirstFrame();
                spriteItem.queueRender();
            }));

            // link to sprite asset
            spriteItem.on('select', () => {
                editor.call('picker:sprites:selectSprite', asset, {
                    history: true
                });
            });

            spriteEvents.push(editor.on(`assets:remove[${asset.get('id')}]`, () => {
                spriteItem.destroy();
                delete spriteItems[asset.get('id')];
                if (contextMenuAsset && contextMenuAsset.get('id') === asset.get('id')) {
                    contextMenuAsset = null;
                    if (!menu.hidden) {
                        menu.hidden = true;
                    }
                }
            }));

            // context menu
            const contextMenu = (e: MouseEvent) => {
                if (!editor.call('permissions:write')) {
                    return;
                }

                contextMenuAsset = asset;
                menu.hidden = false;
                menu.position(e.clientX + 1, e.clientY);
            };

            spriteItem.dom.addEventListener('contextmenu', contextMenu);

            // clean up events
            spriteItem.once('destroy', (dom: HTMLElement) => {
                spriteEvents.forEach(event => event.unbind());
                spriteEvents.length = 0;

                dom.removeEventListener('contextmenu', contextMenu);
            });

            grid.append(spriteItem);

            return spriteItem;
        };

        // find all sprite assets associated with this atlas
        const spriteAssets = editor.call('assets:find', (asset) => {
            const atlasId = parseInt(atlasAsset.get('id'), 10);
            return asset.get('type') === 'sprite' && parseInt(asset.get('data.textureAtlasAsset'), 10) === atlasId;
        });

        for (let i = 0; i < spriteAssets.length; i++) {
            createSpriteItem(spriteAssets[i][1]);
        }

        const onUpdateFrame = (path: string) => {
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
        };

        // Handle add/modify and remove frame events
        events.push(atlasAsset.on('*:set', onUpdateFrame));
        events.push(atlasAsset.on('*:unset', onUpdateFrame));

        // Sprite selection event
        events.push(editor.on('picker:sprites:spriteSelected', (sprite) => {
            // clear selection if no sprite selected
            if (!sprite) {
                if (grid.selected.length > 0) {
                    grid.deselect();
                }
                return;
            }

            const id = sprite.get('id');
            const item = spriteItems[id];

            // if something is selected and it's not the current item
            if (grid.selected.length > 0 && grid.selected[0] !== item) {
                grid.selected[0].selected = false;
                item.selected = true;
            } else if (grid.selected.length === 0) { // if nothing is selected
                item.selected = true;
            }
        }));

        // Asset create event
        events.push(editor.on('assets:add', (asset: Observer) => {
            if (asset.get('type') !== 'sprite') {
                return;
            }

            const id = parseInt(asset.get('data.textureAtlasAsset'), 10);
            if (id !== parseInt(atlasAsset.get('id'), 10)) {
                return;
            }

            // Skip if item already exists (can happen on reconnect)
            const assetId = asset.get('id');
            if (spriteItems[assetId]) {
                return;
            }

            spriteAssets.push(asset);
            const item = createSpriteItem(asset);
            if (item) {
                item.flash();
            }
        }));

        // Sprite edit mode
        events.push(editor.on('picker:sprites:pickFrames:start', () => {
            rootPanel.enabled = false;
        }));

        events.push(editor.on('picker:sprites:pickFrames:end', () => {
            rootPanel.enabled = true;
        }));

        events.push(rootPanel.on('clear', () => {
            grid.destroy();
        }));

        grid.once('destroy', () => {
            menu.destroy();
            contextMenuAsset = null;

            events.forEach(event => event.unbind());
            events.length = 0;
        });
    });
});
