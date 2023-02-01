editor.once('load', function () {
    'use strict';

    function isPixelEmpty(x, y, width, imageData) {
        const alpha = y * (width * 4) + x * 4 + 3;
        return imageData.data[alpha] === 0;
    }

    editor.on('picker:sprites:open', function () {
        // Trim selected frames
        editor.call('hotkey:register', 'sprite-editor-trim', {
            key: 't',
            callback: function () {
                const spriteAsset = editor.call('picker:sprites:selectedSprite');
                if (spriteAsset) return;

                const highlightedFrames = editor.call('picker:sprites:highlightedFrames');
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
    editor.method('picker:sprites:trimFrames', function (framesToTrim) {
        if (!editor.call('permissions:write')) return;

        let prev = {};

        const frames = framesToTrim.slice();
        const atlasAsset = editor.call('picker:sprites:atlasAsset');
        if (!atlasAsset) return;
        const imageData = editor.call('picker:sprites:atlasImageData');
        if (!imageData) return;

        const redo = function () {
            const asset = editor.call('assets:get', atlasAsset.get('id'));
            if (!asset) return;

            const history = asset.history.enabled;
            asset.history.enabled = false;

            let dirty = false;

            const width = atlasAsset.get('meta.width');
            const height = atlasAsset.get('meta.height');

            const frameData = atlasAsset.getRaw('data.frames')._data;
            for (let i = 0, len = frames.length; i < len; i++) {
                let frame = frameData[frames[i]];
                if (!frame) continue;
                frame = frame._data;

                let left = Math.max(0, frame.rect[0]);
                let right = Math.min(frame.rect[0] + frame.rect[2] - 1, width - 1);
                let top = Math.max(0, height - frame.rect[1] - frame.rect[3]);
                let bottom = Math.min(height - frame.rect[1] - 1, height - 1);

                // trim vertically from left to right
                for (let x = left; x <= right; x++) {
                    let foundPixel = false;
                    for (let y = top; y <= bottom; y++) {
                        left = x;
                        if (!isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // trim vertically from right to left
                for (let x = right; x >= left; x--) {
                    let foundPixel = false;
                    for (let y = top; y <= bottom; y++) {
                        right = x;
                        if (!isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // trim horizontally from top to bottom
                for (let y = top; y <= bottom; y++) {
                    let foundPixel = false;
                    for (let x = left; x <= right; x++) {
                        top = y;
                        if (!isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // trim horizontally from bottom to top
                for (let y = bottom; y >= top; y--) {
                    let foundPixel = false;
                    for (let x = left; x <= right; x++) {
                        bottom = y;
                        if (!isPixelEmpty(x, y, width, imageData)) {
                            foundPixel = true;
                            break;
                        }
                    }

                    if (foundPixel) {
                        break;
                    }
                }

                // set new rect
                const l = left;
                const b = height - bottom - 1;
                const w = Math.max(1, right - left + 1); // don't make 0 width/height rects
                const h = Math.max(1, bottom - top + 1);

                if (l !== frame.rect[0] || b !== frame.rect[1] || w !== frame.rect[2] || h !== frame.rect[3]) {
                    dirty = true;
                    prev[frames[i]] = frame.rect.slice();
                    atlasAsset.set('data.frames.' + frames[i] + '.rect', [l, b, w, h]);
                }
            }

            asset.history.enabled = history;

            return dirty;
        };

        const undo = function () {
            const asset = editor.call('assets:get', atlasAsset.get('id'));
            if (!asset) return;

            const history = asset.history.enabled;
            asset.history.enabled = false;
            for (const key in prev) {
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
});
