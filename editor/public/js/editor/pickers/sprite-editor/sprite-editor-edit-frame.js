editor.once('load', function () {
    'use strict';

    // Modify frame and make the action undoable
    editor.method('picker:sprites:commitFrameChanges', function (key, frame, oldFrame) {
        if (! editor.call('permissions:write')) return;

        var atlasAsset = editor.call('picker:sprites:atlasAsset');
        if (! atlasAsset) return;

        var newValue = {
            name: frame.name,
            rect: frame.rect.slice(),
            pivot: frame.pivot.slice(),
            border: frame.border.slice()
        };

        // make sure width / height are positive
        if (newValue.rect[2] < 0) {
            newValue.rect[2] = Math.max(1, -newValue.rect[2]);
            newValue.rect[0] -= newValue.rect[2];
        }

        if (newValue.rect[3] < 0) {
            newValue.rect[3] = Math.max(1, -newValue.rect[3]);
            newValue.rect[1] -= newValue.rect[3];
        }

        var redo = function () {
            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (! asset) return;
            var history = asset.history.enabled;
            asset.history.enabled = false;
            asset.set('data.frames.' + key, newValue);
            asset.history.enabled = history;
        };

        var undo = function () {
            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (! asset) return;
            var history = asset.history.enabled;
            asset.history.enabled = false;
            if (oldFrame) {
                asset.set('data.frames.' + key, oldFrame);
            } else {
                editor.call('picker:sprites:deleteFrames', [key]);
            }
            asset.history.enabled = history;
        };

        editor.call('history:add', {
            name: 'data.frames.' + key,
            undo: undo,
            redo: redo
        });

        redo();
    });
});
