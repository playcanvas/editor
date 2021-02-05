editor.once('load', function () {
    'use strict';

    editor.on('picker:sprites:open', function () {
        // Trim selected frames
        editor.call('hotkey:register', 'sprite-editor-trim', {
            key: 't',
            callback: function () {
                var spriteAsset = editor.call('picker:sprites:selectedSprite');
                if (spriteAsset) return;

                var highlightedFrames = editor.call('picker:sprites:highlightedFrames');
                if (highlightedFrames.length) {
                    editor.call('picker:sprites:trimFrames', highlightedFrames);
                }
            }
        });

    });

    editor.on('picker:sprites:close', function () {
        editor.call('hotkey:unregister', 'sprite-editor-trim');
    });

    // Trim transparent pixels from specified frames
    editor.method('picker:sprites:trimFrames', function (frames) {
        if (! editor.call('permissions:write')) return;

        var prev = {};

        var frames = frames.slice();
        var atlasAsset = editor.call('picker:sprites:atlasAsset');
        if (! atlasAsset) return;
        var imageData = editor.call('picker:sprites:atlasImageData');
        if (! imageData) return;

        var redo = function () {
            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (! asset) return;

            var history = asset.history.enabled;
            asset.history.enabled = false;

            var dirty = false;

            var width = atlasAsset.get('meta.width');
            var height = atlasAsset.get('meta.height');

            var frameData = atlasAsset.getRaw('data.frames')._data;
            for (var i = 0, len = frames.length; i < len; i++) {
                var frame = frameData[frames[i]];
                if (! frame) continue;
                frame = frame._data;

                var left = Math.max(0, frame.rect[0]);
                var right = Math.min(frame.rect[0] + frame.rect[2] - 1, width - 1);
                var top = Math.max(0, height - frame.rect[1] - frame.rect[3]);
                var bottom = Math.min(height - frame.rect[1] - 1, height - 1);

                // trim vertically from left to right
                for (var x = left; x <= right; x++) {
                    var foundPixel = false;
                    for (var y = top; y <= bottom; y++) {
                        left = x;
                        if (! isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // trim vertically from right to left
                for (var x = right; x >= left; x--) {
                    var foundPixel = false;
                    for (var y = top; y <= bottom; y++) {
                        right = x;
                        if (! isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // trim horizontally from top to bottom
                for (var y = top; y <= bottom; y++) {
                    var foundPixel = false;
                    for (var x = left; x <= right; x++) {
                        top = y;
                        if (! isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // trim horizontally from bottom to top
                for (var y = bottom; y >= top; y--) {
                    var foundPixel = false;
                    for (var x = left; x <= right; x++) {
                        bottom = y;
                        if (! isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // set new rect
                var l = left;
                var b = height - bottom - 1;
                var w = Math.max(1, right - left + 1); // don't make 0 width/height rects
                var h = Math.max(1, bottom - top + 1);

                if (l !== frame.rect[0] || b !== frame.rect[1] || w !== frame.rect[2] || h !== frame.rect[3]) {
                    dirty = true;
                    prev[frames[i]] = frame.rect.slice();
                    atlasAsset.set('data.frames.' + frames[i] + '.rect', [l, b, w, h]);
                }
            }

            asset.history.enabled = history;

            return dirty;
        };

        var undo = function () {
            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (! asset) return;

            var history = asset.history.enabled;
            asset.history.enabled = false;
            for (var key in prev) {
                atlasAsset.set('data.frames.' + key + '.rect', prev[key]);
            }
            asset.history.enabled = history;

            prev = {};
        };

        if (redo()) {
            editor.call('history:add', {
                name: 'trim frames',
                undo: undo,
                redo: redo
            });
        }
    });

    var isPixelEmpty = function (x, y, width, imageData) {
        var alpha = y * (width * 4) + x * 4 + 3;
        return imageData.data[alpha] === 0;
    };
});
