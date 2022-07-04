editor.once('load', function () {
    'use strict';

    var selected = null;
    var highlightedFrames = [];
    var newSpriteFrames = [];

    var atlasAsset = null;
    var spriteAsset = null;

    var spriteEditMode = false;

    var events = [];

    // Select frames by keys
    // options.history: Whether to add this action to the history
    // options.add: Whether to add the frames to the existing selection
    // options.clearSprite: Clear sprite selection if true
    var selectFrames = function (keys, options) {
        if (keys && !(keys instanceof Array))
            keys = [keys];

        // check if new selection differs from old
        var dirty = false;
        if (!keys && selected || !keys && options && options.clearSprite && spriteAsset) {
            dirty = true;
        } else if (keys && !selected) {
            dirty = true;
        } else if (selected && spriteAsset && (!options || !options.clearSprite)) {
            dirty = true;
        } else {
            var klen = keys ? keys.length : 0;
            var hlen = highlightedFrames.length;
            if (klen !== hlen) {
                dirty = true;
            } else {
                for (let i = 0; i < klen; i++) {
                    if (keys[i] !== highlightedFrames[i]) {
                        dirty = true;
                        break;
                    }
                }
            }
        }

        if (!dirty)
            return;

        var prevSelection = selected;
        var prevHighlighted = spriteEditMode ? newSpriteFrames.slice() : highlightedFrames.slice();
        var prevSprite = spriteAsset;

        // add to selection if necessary
        if (keys && options && options.add) {
            var temp = prevHighlighted.slice();
            for (let i = 0, len = keys.length; i < len; i++) {
                if (temp.indexOf(keys[i]) === -1) {
                    temp.push(keys[i]);
                }
            }
            keys = temp;
        }

        var select = function (newKeys, newSelection, oldKeys) {
            selected = null;

            if (oldKeys) {
                if (spriteEditMode) {
                    newSpriteFrames.length = 0;
                } else {
                    highlightedFrames.length = 0;
                }
            }

            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (asset) {
                var len = newKeys && newKeys.length;
                if (len) {
                    if (spriteEditMode) {
                        newSpriteFrames = newKeys.slice();
                    } else {
                        highlightedFrames = newKeys.slice();
                    }

                    if (!spriteAsset) {
                        selected = newSelection || newKeys[len - 1];

                    }
                }
            }

            editor.emit('picker:sprites:framesSelected', newKeys);
        };

        var redo = function () {
            if (options && options.clearSprite) {
                setSprite(null);
            }

            select(keys, null, prevHighlighted);
        };

        var undo = function () {
            if (options && options.clearSprite && prevSprite) {
                selectSprite(prevSprite);
            } else {
                select(prevHighlighted, prevSelection, keys);
            }
        };

        if (options && options.history) {
            editor.call('history:add', {
                name: 'select frame',
                undo: undo,
                redo: redo
            });

        }

        redo();

        return selected;
    };

    // Sets the selected sprite and hooks event listeners
    var setSprite = function (asset) {
        if (spriteAsset) {
            spriteAsset.unbind('data.frameKeys:remove', selectSpriteFrames);
            spriteAsset.unbind('data.frameKeys:insert', selectSpriteFrames);
            spriteAsset.unbind('data.frameKeys:set', selectSpriteFrames);
        }

        spriteAsset = asset;
        editor.emit('picker:sprites:spriteSelected', asset);

        if (!spriteAsset) return;

        spriteAsset.on('data.frameKeys:remove', selectSpriteFrames);
        spriteAsset.on('data.frameKeys:insert', selectSpriteFrames);
        spriteAsset.on('data.frameKeys:set', selectSpriteFrames);
    };

    var selectSpriteFrames = function () {
        if (spriteAsset) {
            selectFrames(spriteAsset.getRaw('data.frameKeys'));
        }
    };

    // Select specified sprite asset
    // Options are:
    // - history: If true make action undoable
    var selectSprite = function (asset, options) {
        if (options && options.history) {
            var prevSprite = spriteAsset;
            var newSprite = asset;
            var selectedFrames = selected && !prevSprite ? highlightedFrames : null;

            var redo = function () {
                setSprite(asset);
                if (spriteAsset) {
                    selectFrames(spriteAsset.getRaw('data.frameKeys'));
                } else {
                    selectFrames(null);
                }
            };

            var undo = function () {
                setSprite(prevSprite);
                if (spriteAsset) {
                    selectFrames(spriteAsset.getRaw('data.frameKeys'));
                } else {
                    selectFrames(selectedFrames);
                }
            };

            editor.call('history:add', {
                name: 'select sprite',
                undo: undo,
                redo: redo
            });

            redo();
        } else {
            setSprite(asset);
            if (spriteAsset) {
                selectFrames(spriteAsset.getRaw('data.frameKeys'));
            } else {
                selectFrames(null);
            }
        }
    };

    // Methods

    editor.method('picker:sprites:selectSprite', selectSprite);

    editor.method('picker:sprites:selectFrames', selectFrames);

    // Create sprite asset from selected frames
    editor.method('picker:sprites:spriteFromSelection', function (args) {
        if (!highlightedFrames.length )
            return;

        // rendermode: 1 - sliced, 0 - simple
        var renderMode = args && args.sliced ? 1 : 0;
        // default ppu to 1 if we're using sliced mode and we have just one frame
        // as that's likely going to be used for Image Elements otherwise default to 100
        // which is better for world-space sprites
        var ppu = args && args.sliced && highlightedFrames.length === 1 ? 1 : 100;

        // get the atlas name without the extension
        var atlasNameWithoutExt = atlasAsset.get('name');
        var lastDot = atlasNameWithoutExt.lastIndexOf('.');
        if (lastDot > 0) {
            atlasNameWithoutExt = atlasNameWithoutExt.substring(0, lastDot);
        }

        var name;

        // if we just have one frame in the atlas use the atlas name for the sprite name
        // without the extension, otherwise if it's only 1 frame selected use the frame name,
        // otherwise use a generic name
        if (highlightedFrames.length === 1) {
            if (Object.keys(atlasAsset.get('data.frames')).length === 1) {
                name = atlasNameWithoutExt;
            } else {
                name = atlasAsset.get('data.frames.' + highlightedFrames[0] + '.name');
            }
        }

        if (!name) {
            name = 'New Sprite';
        }

        const folder = editor.call('assets:panel:currentFolder');

        editor.assets.createSprite({
            name: name,
            pixelsPerUnit: ppu,
            renderMode: renderMode,
            frameKeys: highlightedFrames,
            textureAtlas: atlasAsset.apiAsset,
            folder: folder && folder.apiAsset
        })
        .then(sprite => {
            selectSprite(sprite._observer);
            if (args && args.callback) {
                args.callback(sprite._observer);
            }

        })
        .catch(err => {
            editor.call('status:error', err);
        });
    });

    // Create sprite assets for each selected frame
    editor.method('picker:sprites:spritesFromFrames', function (args) {
        const folder = editor.call('assets:panel:currentFolder');

        var frameCounter = 0;
        highlightedFrames.forEach((frame, i) => {
            let name = atlasAsset.get(`data.frames.${frame}.name`);
            if (!name) {
                name = 'New Sprite ' + i;
            }
            // rendermode: 0 - simple
            editor.assets.createSprite({
                name: name,
                pixelsPerUnit: 100,
                renderMode: 0,
                frameKeys: [frame],
                textureAtlas: atlasAsset.apiAsset,
                folder: folder && folder.apiAsset
            })
            .then(sprite => {
                frameCounter++;
                if (frameCounter === highlightedFrames.length) {
                    setTimeout(() => {
                        selectSprite(sprite._observer);
                        if (args && args.callback) {
                            args.callback(sprite._observer);
                        }
                    });
                }
            })
            .catch(err => {
                editor.call('status:error', err);
            });
        });
    });

    var startSpriteEditMode = function () {
        spriteEditMode = true;
        editor.emit('picker:sprites:pickFrames:start');

        // Enter key to add frames and end sprite edit mode
        editor.call('hotkey:register', 'sprite-editor-add-frames', {
            key: 'enter',
            callback: function () {
                // do this in a timeout because this will terminate sprite edit mode
                // which will unregister the hotkey which will cause an error because
                // we are still in the hotkey execution loop
                setTimeout(function () {
                    editor.call('picker:sprites:pickFrames:add');
                });
            }
        });


    };

    var endSpriteEditMode = function () {
        spriteEditMode = false;
        newSpriteFrames.length = 0;

        editor.call('hotkey:unregister', 'sprite-editor-add-frames');
        editor.emit('picker:sprites:pickFrames:end');

        selectSpriteFrames();
    };

    // Start sprite edit mode
    editor.method('picker:sprites:pickFrames', function () {
        if (spriteEditMode) return;

        editor.call('history:add', {
            name: 'add frames',
            undo: endSpriteEditMode,
            redo: startSpriteEditMode
        });

        startSpriteEditMode();
    });

    // Adds picked frames to sprite asset and exits sprite edit mode
    editor.method('picker:sprites:pickFrames:add', function () {
        if (!spriteAsset) return;

        var length = newSpriteFrames.length;
        if (length) {
            var keys = spriteAsset.get('data.frameKeys');
            keys = keys.concat(newSpriteFrames);
            spriteAsset.set('data.frameKeys', keys);
        }

        endSpriteEditMode();
    });

    // Exits sprite edit mode
    editor.method('picker:sprites:pickFrames:cancel', function () {
        endSpriteEditMode();
    });

    // Return selected frame
    editor.method('picker:sprites:selectedFrame', function () {
        return selected;
    });

    // Return highlighted frames
    editor.method('picker:sprites:highlightedFrames', function () {
        return highlightedFrames;
    });

    // Return sprite edit mode picked frames
    editor.method('picker:sprites:newSpriteFrames', function () {
        return newSpriteFrames;
    });

    // Return selected sprite
    editor.method('picker:sprites:selectedSprite', function () {
        return spriteAsset;
    });

    // if the selected sprite is deleted then deselect it
    events.push(editor.on('assets:remove', function (asset) {
        if (spriteAsset && spriteAsset.get('id') === asset.get('id')) {
            selectSprite(null);
        }
    }));

    editor.on('picker:sprites:open', function () {
        atlasAsset = editor.call('picker:sprites:atlasAsset');

        // Delete hotkey to delete selected frames
        editor.call('hotkey:register', 'sprite-editor-delete', {
            key: 'delete',
            callback: function () {
                if (!spriteAsset && highlightedFrames.length) {
                    editor.call('picker:sprites:deleteFrames', highlightedFrames, {
                        history: true
                    });
                }
            }
        });
    });

    editor.on('picker:sprites:close', function () {
        atlasAsset = null;
        selected = null;
        highlightedFrames.length = 0;
        newSpriteFrames.length = 0;
        setSprite(null);

        for (let i = 0; i < events.length; i++) {
            events[i].unbind();
        }
        events.length = 0;

        editor.call('hotkey:unregister', 'sprite-editor-delete');
    });


});
