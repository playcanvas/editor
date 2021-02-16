editor.once('load', function () {
    'use strict';

    editor.method('picker:sprites:frames', function (args) {
        var events = [];

        var atlasAsset = args.atlasAsset;

        var panels = {};
        var selectedKeys = [];
        var spriteEditModeKeys = [];
        var spriteEditMode = false;
        var selectedSprite = null;

        var shiftDown = false;
        var ctrlDown = false;

        var scrollSelectionIntoView = true;

        var leftPanel = editor.call('picker:sprites:leftPanel');
        leftPanel.header = 'FRAMES IN TEXTURE ATLAS';

        var panelFrames = editor.call('attributes:addPanel', {
            parent: leftPanel
        });

        // var panelFrames = new ui.Panel();
        panelFrames.scroll = true;
        panelFrames.class.add('frames');
        // panel.append(panelFrames);

        var addFramePanel = function (key, frame, afterPanel, beforePanel) {
            var frameEvents = [];

            var panel = new ui.Panel();
            panel.class.add('frame');
            panel.frameKey = key;

            panels[key] = panel;

            // preview
            var canvas = new ui.Canvas();
            var previewWidth = 26;
            var previewHeight = 26;
            canvas.class.add('preview');
            canvas.resize(previewWidth, previewHeight);

            panel.append(canvas);

            var renderQueued = false;

            panel.queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            var renderPreview = function () {
                editor.call('picker:sprites:renderFramePreview', frame, canvas.element);
                renderQueued = false;
            };

            renderPreview();

            // sprite name
            var fieldName = new ui.Label();
            fieldName.class.add('name');
            fieldName.value = frame.name;
            panel.append(fieldName);

            frameEvents.push(atlasAsset.on('data.frames.' + key + '.name:set', function (value) {
                fieldName.value = value;
            }));

            // remove frame
            var btnRemove = new ui.Button();
            btnRemove.class.add('remove');
            panel.append(btnRemove);

            btnRemove.disabled = ! editor.call('permissions:write');

            frameEvents.push(editor.on('permissions:writeState', function (canWrite) {
                btnRemove.disabled = ! canWrite;
            }));

            btnRemove.on('click', function (e) {
                e.stopPropagation();
                editor.call('picker:sprites:deleteFrames', [key], {
                    history: true
                });
            });

            panel.on('click', function () {
                scrollSelectionIntoView = false;

                if (shiftDown) {
                    // if another frame was selected then add range to selection
                    var keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
                    var len = keys.length;
                    if (len) {
                        var diff = parseInt(key, 10) - parseInt(keys[len - 1], 10);
                        var dir = diff < 0 ? -1 : 1;
                        var p = panels[keys[len - 1]];
                        var range = [];
                        while (diff !== 0) {
                            p = dir > 0 ? p.element.nextSibling : p.element.previousSibling;
                            if (! p) break;
                            p = p.ui;

                            range.push(p.frameKey);

                            if (p.frameKey === key)
                                break;

                            diff -= dir;
                        }

                        if (range.length) {
                            editor.call('picker:sprites:selectFrames', range, {
                                add: true,
                                history: true,
                                clearSprite: !spriteEditMode
                            });
                        }
                    } else {
                        // otherwise just select single frame
                        editor.call('picker:sprites:selectFrames', key, {
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    }
                } else if (ctrlDown) {
                    // if not selected add frame to selection
                    var keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
                    var idx = keys.indexOf(key);
                    if (idx === -1) {
                        editor.call('picker:sprites:selectFrames', key, {
                            add: true,
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    } else {
                        // if selected remove from selection
                        keys.splice(idx, 1);
                        editor.call('picker:sprites:selectFrames', keys, {
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    }

                } else {
                    // select single frame
                    editor.call('picker:sprites:selectFrames', key, {
                        history: true,
                        clearSprite: !spriteEditMode
                    });
                }

                scrollSelectionIntoView = true;

            });

            var onMouseEnter = function () {
                editor.call('picker:sprites:hoverFrame', key);
            };

            var onMouseLeave = function () {
                editor.call('picker:sprites:hoverFrame', null);
            };

            panel.element.addEventListener('mouseenter', onMouseEnter);
            panel.element.addEventListener('mouseleave', onMouseLeave);

            // clean up events
            panel.on('destroy', function () {
                for (let i = 0, len = frameEvents.length; i < len; i++) {
                    frameEvents[i].unbind();
                }
                frameEvents.length = 0;


                panel.element.removeEventListener('mouseenter', onMouseEnter);
                panel.element.removeEventListener('mouseleave', onMouseLeave);
            });

            if (afterPanel) {
                panelFrames.appendAfter(panel, afterPanel);
            } else if (beforePanel) {
                panelFrames.appendBefore(panel, beforePanel);
            } else {
                panelFrames.append(panel);
            }
        };

        // create frames
        var frames = atlasAsset.getRaw('data.frames')._data;
        for (const key in frames) {
            addFramePanel(key, frames[key]._data);
        }

        // keydown
        var onKeyDown = function (e) {
            ctrlDown = e.ctrlKey || e.metaKey;
            shiftDown = e.shiftKey;
        };
        window.addEventListener('keydown', onKeyDown);

        // keyup
        var onKeyUp = function (e) {
            ctrlDown = e.ctrlKey || e.metaKey;
            shiftDown = e.shiftKey;
        };
        window.addEventListener('keyup', onKeyUp);

        // listen to atlas set event
        var checkPath = /^data\.frames(.(\d+))?$/;
        events.push(atlasAsset.on('*:set', function (path, value) {
            if (! path.startsWith('data.frames')) return;

            var parts = path.split('.');
            if (parts.length === 2) {
                // if all frames are set then re-create all frame panels
                for (key in panels) {
                    panels[key].destroy();
                    delete panels[key];
                }

                panels = {};

                var raw = atlasAsset.getRaw('data.frames')._data;

                for (key in value) {
                    addFramePanel(key, raw[key]._data);
                }
            } else if (parts.length === 3) {
                // if a frame was set and it doesn't exist create it
                var key = parts[2];
                if (key) {
                    if (! panels[key]) {
                        var panelBefore = null;
                        var panelAfter = null;

                        var search = parseInt(key, 10);
                        for (const k in panels) {
                            if (search < parseInt(k, 10)) {
                                panelBefore = panels[k];
                                break;
                            } else {
                                panelAfter = panels[k];
                            }
                        }


                        var raw = atlasAsset.getRaw('data.frames')._data;
                        addFramePanel(key, raw[key]._data, panelAfter, panelBefore);
                    }
                }
            } else {
                // if a field changed then re-render the preview for that frame
                var key = parts[2];
                if (panels[key]) {
                    panels[key].queueRender();
                }
            }
        }));

        // listen to atlas unset event
        var checkUnsetPath = /^data\.frames\.(\d+)$/;
        events.push(atlasAsset.on('*:unset', function (path) {
            var match = path.match(checkUnsetPath);
            if (! match) return;

            var key = match[1];
            if (panels[key]) {
                panels[key].destroy();
                delete panels[key];
            }
        }));

        // Listen to framesSelected event to highlight panels
        events.push(editor.on('picker:sprites:framesSelected', function (keys) {
            var index = {};
            var key;

            if (spriteEditMode) {
                // unhighlight old keys
                var highlighted = panelFrames.innerElement.querySelectorAll('.frame.highlighted');
                for (let i = 0, len = highlighted.length; i < len; i++) {
                    if (! keys || keys.indexOf(highlighted[i].ui.frameKey) === -1) {
                        highlighted[i].ui.class.remove('highlighted');
                    }
                }

                if (keys) {
                    spriteEditModeKeys = keys.slice();
                } else {
                    spriteEditModeKeys.length = 0;
                }

            } else {
                var selected = panelFrames.innerElement.querySelectorAll('.frame.selected');
                for (let i = 0, len = selected.length; i < len; i++) {
                    if (! keys || keys.indexOf(selected[i].ui.frameKey) === -1) {
                        selected[i].ui.class.remove('selected');
                        selected[i].ui.class.remove('sprite-frame');
                    }
                }

                if (keys) {
                    selectedKeys = keys.slice();
                } else {
                    selectedKeys.length = 0;
                }
            }

            // select new keys
            if (keys && keys.length) {
                for (let i = 0, len = keys.length; i < len; i++) {
                    key = keys[i];
                    index[key] = true;

                    if (! panels[key]) continue;

                    if (scrollSelectionIntoView) {
                        var scroll = false;
                        if (i === 0) {
                            scroll = spriteEditMode ? ! panels[key].class.contains('highlighted') : ! panels[key].class.contains('selected');
                            if (scroll) {
                                panelFrames.innerElement.scrollTop = panels[key].element.offsetTop;
                            }
                        }
                    }

                    panels[key].class.add(spriteEditMode ? 'highlighted' : 'selected');
                    if (selectedSprite && (keys === selectedKeys || selectedKeys.indexOf(key) !== -1)) {
                        panels[key].class.add('sprite-frame');
                    }
                }
            }
        }));

        events.push(editor.on('picker:sprites:pickFrames:start', function () {
            spriteEditMode = true;
        }));

        events.push(editor.on('picker:sprites:pickFrames:end', function () {
            spriteEditMode = false;

            for (let i = 0, len = spriteEditModeKeys.length; i < len; i++) {
                if (panels[spriteEditModeKeys[i]]) {
                    panels[spriteEditModeKeys[i]].class.remove('highlighted');
                }
            }

            spriteEditModeKeys.length = 0;
        }));

        events.push(editor.on('picker:sprites:spriteSelected', function (spriteAsset) {
            selectedSprite = spriteAsset;
            var keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
            for (let i = 0, len = keys.length; i < len; i++) {
                var panel = panels[keys[i]];
                if (! panel) continue;

                if (selectedSprite) {
                    panel.class.add('sprite-frame');
                } else {
                    panel.class.remove('sprite-frame');
                }
            }
        }));

        // clean up
        events.push(leftPanel.on('clear', function () {
            panelFrames.destroy();
        }));

        panelFrames.on('destroy', function () {
            for (let i = 0; i < events.length; i++) {
                events[i].unbind();
            }

            events.length = 0;

            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);

            panels = {};
            selectedKeys.length = 0;
            spriteEditModeKeys.length = 0;
        });
    });
});
