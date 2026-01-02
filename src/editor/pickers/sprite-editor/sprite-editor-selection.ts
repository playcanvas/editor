import type { EventHandle } from '@playcanvas/observer';

editor.once('load', () => {
    let selected = null;
    let highlightedFrames = [];
    let newSpriteFrames = [];

    let atlasAsset = null;
    let spriteAsset = null;

    let spriteEditMode = false;

    const events: EventHandle[] = [];

    // Select frames by keys
    // options.history: Whether to add this action to the history
    // options.add: Whether to add the frames to the existing selection
    // options.clearSprite: Clear sprite selection if true
    const selectFrames = (keys, options?) => {
        if (keys && !(keys instanceof Array)) {
            keys = [keys];
        }

        // check if new selection differs from old
        let dirty = false;
        if (!keys && selected || !keys && options && options.clearSprite && spriteAsset) {
            dirty = true;
        } else if (keys && !selected) {
            dirty = true;
        } else if (selected && spriteAsset && (!options || !options.clearSprite)) {
            dirty = true;
        } else {
            const klen = keys ? keys.length : 0;
            const hlen = highlightedFrames.length;
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

        if (!dirty) {
            return;
        }

        const prevSelection = selected;
        const prevHighlighted = spriteEditMode ? newSpriteFrames.slice() : highlightedFrames.slice();
        const prevSprite = spriteAsset;

        // add to selection if necessary
        if (keys && options && options.add) {
            const temp = prevHighlighted.slice();
            for (let i = 0, len = keys.length; i < len; i++) {
                if (temp.indexOf(keys[i]) === -1) {
                    temp.push(keys[i]);
                }
            }
            keys = temp;
        }

        const select = (newKeys, newSelection, oldKeys) => {
            selected = null;

            if (oldKeys) {
                if (spriteEditMode) {
                    newSpriteFrames.length = 0;
                } else {
                    highlightedFrames.length = 0;
                }
            }

            const asset = editor.call('assets:get', atlasAsset.get('id'));
            if (asset) {
                const len = newKeys && newKeys.length;
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

        const redo = (): void => {
            if (options && options.clearSprite) {
                setSprite(null);
            }

            select(keys, null, prevHighlighted);
        };

        const undo = (): void => {
            if (options && options.clearSprite && prevSprite) {
                selectSprite(prevSprite);
            } else {
                select(prevHighlighted, prevSelection, keys);
            }
        };

        if (options && options.history) {
            editor.api.globals.history.add({
                name: 'select frame',
                combine: false,
                undo,
                redo
            });

        }

        redo();

        return selected;
    };

    // Sets the selected sprite and hooks event listeners
    const setSprite = (asset) => {
        if (spriteAsset) {
            spriteAsset.unbind('data.frameKeys:remove', selectSpriteFrames);
            spriteAsset.unbind('data.frameKeys:insert', selectSpriteFrames);
            spriteAsset.unbind('data.frameKeys:set', selectSpriteFrames);
        }

        spriteAsset = asset;
        editor.emit('picker:sprites:spriteSelected', asset);

        if (!spriteAsset) {
            return;
        }

        spriteAsset.on('data.frameKeys:remove', selectSpriteFrames);
        spriteAsset.on('data.frameKeys:insert', selectSpriteFrames);
        spriteAsset.on('data.frameKeys:set', selectSpriteFrames);
    };

    const selectSpriteFrames = (): void => {
        if (spriteAsset) {
            selectFrames(spriteAsset.getRaw('data.frameKeys'));
        }
    };

    // Select specified sprite asset
    // Options are:
    // - history: If true make action undoable
    const selectSprite = (asset, options?) => {
        if (options && options.history) {
            const prevSprite = spriteAsset;
            const selectedFrames = selected && !prevSprite ? highlightedFrames : null;

            const redo = (): void => {
                setSprite(asset);
                if (spriteAsset) {
                    selectFrames(spriteAsset.getRaw('data.frameKeys'));
                } else {
                    selectFrames(null);
                }
            };

            const undo = (): void => {
                setSprite(prevSprite);
                if (spriteAsset) {
                    selectFrames(spriteAsset.getRaw('data.frameKeys'));
                } else {
                    selectFrames(selectedFrames);
                }
            };

            editor.api.globals.history.add({
                name: 'select sprite',
                combine: false,
                undo,
                redo
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

    const getFilename = (name: string): string => {
        // Get the filename from a filepath if there's a '/'
        // https://github.com/playcanvas/editor/issues/784
        const lastSlash = name.lastIndexOf('/');
        if (lastSlash > 0) {
            if (lastSlash < name.length - 1) {
                return name.substring(lastSlash + 1);
            }

            // If for some reason the '/' is the last character, return a default name
            return 'New Sprite';
        }

        return name;
    };

    // Methods

    editor.method('picker:sprites:selectSprite', selectSprite);

    editor.method('picker:sprites:selectFrames', selectFrames);

    // Create sprite asset from selected frames
    editor.method('picker:sprites:spriteFromSelection', (args) => {
        if (!highlightedFrames.length) {
            return;
        }

        // rendermode: 1 - sliced, 0 - simple
        const renderMode = args && args.sliced ? 1 : 0;
        // default ppu to 1 if we're using sliced mode and we have just one frame
        // as that's likely going to be used for Image Elements otherwise default to 100
        // which is better for world-space sprites
        const ppu = args && args.sliced && highlightedFrames.length === 1 ? 1 : 100;

        // get the atlas name without the extension
        let atlasNameWithoutExt = atlasAsset.get('name');
        const lastDot = atlasNameWithoutExt.lastIndexOf('.');
        if (lastDot > 0) {
            atlasNameWithoutExt = atlasNameWithoutExt.substring(0, lastDot);
        }

        let name;

        // if we just have one frame in the atlas use the atlas name for the sprite name
        // without the extension, otherwise if it's only 1 frame selected use the frame name,
        // otherwise use a generic name
        if (highlightedFrames.length === 1) {
            if (Object.keys(atlasAsset.get('data.frames')).length === 1) {
                name = atlasNameWithoutExt;
            } else {
                name = atlasAsset.get(`data.frames.${highlightedFrames[0]}.name`);
            }
        }

        if (!name) {
            name = 'New Sprite';
        }

        name = getFilename(name);

        const folder = editor.call('assets:panel:currentFolder');

        editor.api.globals.assets.createSprite({
            name: name,
            pixelsPerUnit: ppu,
            renderMode: renderMode,
            frameKeys: highlightedFrames,
            textureAtlas: atlasAsset.apiAsset,
            folder: folder && folder.apiAsset
        })
        .then((sprite) => {
            selectSprite(sprite.observer);
            if (args && args.callback) {
                args.callback(sprite.observer);
            }

        })
        .catch((err) => {
            editor.call('status:error', err);
        });
    });

    // Create sprite assets for each selected frame
    editor.method('picker:sprites:spritesFromFrames', (args) => {
        const folder = editor.call('assets:panel:currentFolder');

        let frameCounter = 0;
        highlightedFrames.forEach((frame, i) => {
            let name = atlasAsset.get(`data.frames.${frame}.name`);
            if (!name) {
                name = `New Sprite ${i}`;
            }

            name = getFilename(name);

            // rendermode: 0 - simple
            editor.api.globals.assets.createSprite({
                name: name,
                pixelsPerUnit: 100,
                renderMode: 0,
                frameKeys: [frame],
                textureAtlas: atlasAsset.apiAsset,
                folder: folder && folder.apiAsset
            })
            .then((sprite) => {
                frameCounter++;
                if (frameCounter === highlightedFrames.length) {
                    setTimeout(() => {
                        selectSprite(sprite.observer);
                        if (args && args.callback) {
                            args.callback(sprite.observer);
                        }
                    });
                }
            })
            .catch((err) => {
                editor.call('status:error', err);
            });
        });
    });

    const startSpriteEditMode = (): void => {
        spriteEditMode = true;
        editor.emit('picker:sprites:pickFrames:start');

        // Enter key to add frames and end sprite edit mode
        editor.call('hotkey:register', 'sprite-editor-add-frames', {
            key: 'Enter',
            callback: () => {
                // do this in a timeout because this will terminate sprite edit mode
                // which will unregister the hotkey which will cause an error because
                // we are still in the hotkey execution loop
                setTimeout(() => {
                    editor.call('picker:sprites:pickFrames:add');
                });
            }
        });
    };

    const endSpriteEditMode = (): void => {
        spriteEditMode = false;
        newSpriteFrames.length = 0;

        editor.call('hotkey:unregister', 'sprite-editor-add-frames');
        editor.emit('picker:sprites:pickFrames:end');

        selectSpriteFrames();
    };

    // Start sprite edit mode
    editor.method('picker:sprites:pickFrames', () => {
        if (spriteEditMode) {
            return;
        }

        editor.api.globals.history.add({
            name: 'add frames',
            combine: false,
            undo: endSpriteEditMode,
            redo: startSpriteEditMode
        });

        startSpriteEditMode();
    });

    // Adds picked frames to sprite asset and exits sprite edit mode
    editor.method('picker:sprites:pickFrames:add', () => {
        if (!spriteAsset) {
            return;
        }

        const length = newSpriteFrames.length;
        if (length) {
            let keys = spriteAsset.get('data.frameKeys');
            keys = keys.concat(newSpriteFrames);
            spriteAsset.set('data.frameKeys', keys);
        }

        endSpriteEditMode();
    });

    // Exits sprite edit mode
    editor.method('picker:sprites:pickFrames:cancel', () => {
        endSpriteEditMode();
    });

    // Return selected frame
    editor.method('picker:sprites:selectedFrame', () => {
        return selected;
    });

    // Return highlighted frames
    editor.method('picker:sprites:highlightedFrames', () => {
        return highlightedFrames;
    });

    // Return sprite edit mode picked frames
    editor.method('picker:sprites:newSpriteFrames', () => {
        return newSpriteFrames;
    });

    // Return selected sprite
    editor.method('picker:sprites:selectedSprite', () => {
        return spriteAsset;
    });

    // if the selected sprite is deleted then deselect it
    events.push(editor.on('assets:remove', (asset) => {
        if (spriteAsset && spriteAsset.get('id') === asset.get('id')) {
            selectSprite(null);
        }
    }));

    editor.on('picker:sprites:open', () => {
        atlasAsset = editor.call('picker:sprites:atlasAsset');

        // Delete hotkey to delete selected frames
        editor.call('hotkey:register', 'sprite-editor-delete', {
            key: 'Delete',
            callback: () => {
                if (!spriteAsset && highlightedFrames.length) {
                    editor.call('picker:sprites:deleteFrames', highlightedFrames, {
                        history: true
                    });
                }
            }
        });
    });

    editor.on('picker:sprites:close', () => {
        atlasAsset = null;
        selected = null;
        highlightedFrames.length = 0;
        newSpriteFrames.length = 0;
        setSprite(null);

        events.forEach(event => event.unbind());
        events.length = 0;

        editor.call('hotkey:unregister', 'sprite-editor-delete');
    });
});
