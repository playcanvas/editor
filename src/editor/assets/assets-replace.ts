editor.once('load', () => {
    editor.method('assets:replace', (asset, replacement) => {
        asset.apiAsset.replace(replacement.apiAsset);
    });

    // Special-case where we want to replace textures with sprites
    // This will only work on Element components and will replace a texture asset with sprite asset
    // It is not available generally only behind a user flag
    editor.method('assets:replaceTextureToSprite', (asset, replacement) => {
        const srcType = asset.get('type');
        const dstType = replacement.get('type');

        if (srcType !== 'texture' || dstType !== 'sprite') {
            log.error('replaceTextureToSprite must take texture and replace with sprite');
        }

        const oldId = asset.get('id');
        const newId = replacement.get('id');
        const changed = [];

        const entities = editor.call('entities:list');

        for (let i = 0; i < entities.length; i++) {
            const obj = entities[i];

            const element = obj.get('components.element');
            if (element && element.textureAsset === oldId) {
                changed.push(obj);
                const history = obj.history.enabled;
                obj.history.enabled = false;
                obj.set('components.element.textureAsset', null);
                obj.set('components.element.spriteAsset', newId);
                obj.history.enabled = history;

                if (history) {
                    // set up undo
                    editor.api.globals.history.add({
                        name: 'asset texture to sprite',
                        combine: false,
                        undo: function () {
                            for (let i = 0; i < changed.length; i++) {
                                const obj = changed[i].latest();
                                if (!obj) {
                                    continue;
                                }
                                const history = obj.history.enabled;
                                obj.history.enabled = false;
                                obj.set('components.element.textureAsset', oldId);
                                obj.set('components.element.spriteAsset', null);
                                obj.history.enabled = history;
                            }
                        },

                        redo: function () {
                            for (let i = 0; i < changed.length; i++) {
                                const obj = changed[i].latest();
                                if (!obj) {
                                    continue;
                                }
                                const history = obj.history.enabled;
                                obj.history.enabled = false;
                                obj.set('components.element.textureAsset', null);
                                obj.set('components.element.spriteAsset', newId);
                                obj.history.enabled = history;
                            }
                        }
                    });
                }
            }
        }
    });
});
