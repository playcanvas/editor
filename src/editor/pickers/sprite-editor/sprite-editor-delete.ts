editor.once('load', () => {
    // Delete frames with specified keys from atlas and also
    // remove these frames from any sprite assets that are referencing them
    // Options can be:
    // - history: if true then make this undoable
    editor.method('picker:sprites:deleteFrames', (keys, options) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const atlasAsset = editor.call('picker:sprites:atlasAsset');
        if (!atlasAsset) {
            return;
        }

        const history = options && options.history;
        if (history) {
            // make copy of array to make sure undo / redo works
            keys = keys.slice();
        }

        const numKeys = keys.length;

        const oldFrames = {};
        if (history) {
            for (let i = 0; i < numKeys; i++) {
                oldFrames[keys[i]] = atlasAsset.get(`data.frames.${keys[i]}`);
            }
        }

        const redo = (): void => {
            const asset = editor.call('assets:get', atlasAsset.get('id'));
            if (!asset) {
                return;
            }
            const history = asset.history.enabled;
            asset.history.enabled = false;

            for (let i = 0; i < numKeys; i++) {
                asset.unset(`data.frames.${keys[i]}`);
            }

            editor.call('picker:sprites:selectFrames', null, {
                clearSprite: true
            });

            asset.history.enabled = history;
        };

        if (history) {
            const undo = (): void => {
                const asset = editor.call('assets:get', atlasAsset.get('id'));
                if (!asset) {
                    return;
                }
                const history = asset.history.enabled;
                asset.history.enabled = false;

                for (let i = 0; i < numKeys; i++) {
                    asset.set(`data.frames.${keys[i]}`, oldFrames[keys[i]]);
                }

                editor.call('picker:sprites:selectFrames', keys, {
                    clearSprite: true
                });

                asset.history.enabled = history;

            };

            editor.api.globals.history.add({
                name: 'delete frames',
                combine: false,
                undo,
                redo
            });
        }

        redo();
    });
});
