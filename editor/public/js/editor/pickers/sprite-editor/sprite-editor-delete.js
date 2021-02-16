editor.once('load', function () {
    'use strict';

    // Delete frames with specified keys from atlas and also
    // remove these frames from any sprite assets that are referencing them
    // Options can be:
    // - history: if true then make this undoable
    editor.method('picker:sprites:deleteFrames', function (keys, options) {
        if (! editor.call('permissions:write')) return;

        var atlasAsset = editor.call('picker:sprites:atlasAsset');
        if (! atlasAsset)
            return;

        var history = options && options.history;
        if (history) {
            // make copy of array to make sure undo / redo works
            keys = keys.slice();
        }

        var numKeys = keys.length;

        if (history) {
            var oldFrames = {};
            for (let i = 0; i < numKeys; i++) {
                oldFrames[keys[i]] = atlasAsset.get('data.frames.' + keys[i]);
            }
        }

        var redo = function () {
            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (! asset) return;
            var history = asset.history.enabled;
            asset.history.enabled = false;

            for (let i = 0; i < numKeys; i++) {
                asset.unset('data.frames.' + keys[i]);
            }

            editor.call('picker:sprites:selectFrames', null, {
                clearSprite: true
            });

            asset.history.enabled = history;
        };

        if (history) {
            var undo = function () {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;
                var history = asset.history.enabled;
                asset.history.enabled = false;

                for (let i = 0; i < numKeys; i++) {
                    asset.set('data.frames.' + keys[i], oldFrames[keys[i]]);
                }

                editor.call('picker:sprites:selectFrames', keys, {
                    clearSprite: true
                });

                asset.history.enabled = history;

            };

            editor.call('history:add', {
                name: 'delete frames',
                undo: undo,
                redo: redo
            });
        }

        redo();
    });
});
