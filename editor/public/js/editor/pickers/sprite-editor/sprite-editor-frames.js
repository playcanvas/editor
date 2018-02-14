editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:frames', function(args) {
        var events = [];

        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;

        var panels = {};
        var selectedKeys = [];
        var spriteEditModeKeys = [];
        var spriteEditMode = false;
        var selectedSprite = null;

        var shiftDown = false;
        var ctrlDown = false;

        var scrollSelectionIntoView = true;

        var leftPanel = editor.call('picker:sprites:editor:leftPanel');
        leftPanel.header = 'FRAMES';

        var panel = editor.call('attributes:addPanel', {
            parent: leftPanel
        });

        var panelTop = new ui.Panel();
        panelTop.class.add('top');
        panel.append(panelTop);

        // var fieldNumFrames = editor.call('attributes:addField', {
        //     parent: panelTop,
        //     name: 'No. of frames',
        //     value: 0
        // });

        var panelButtons = new ui.Panel();
        panelTop.append(panelButtons);
        panelButtons.flex = true;

        var btnNewSprite = new ui.Button({
            text: 'NEW SPRITE'
        });
        btnNewSprite.class.add('icon', 'create');
        btnNewSprite.disabled = true;
        panelButtons.append(btnNewSprite);

        btnNewSprite.on('click', function () {
            btnNewSprite.disabled = true;
            editor.call('picker:sprites:editor:spriteFromSelection', function () {
                btnNewSprite.disabled = false;
            });
        });

        var btnDelete = new ui.Button({
            text: 'DELETE'
        });
        btnDelete.class.add('icon', 'remove');
        btnDelete.disabled = true;
        panelButtons.append(btnDelete);

        btnDelete.on('click', function () {
            editor.call('picker:sprites:editor:deleteFrames', selectedKeys);
        });

        var btnAddSelectedFrames = new ui.Button({
            text: 'ADD FRAMES TO SPRITE'
        });
        btnAddSelectedFrames.class.add('icon', 'wide', 'create');
        btnAddSelectedFrames.flexGrow = 1;
        btnAddSelectedFrames.disabled = true;
        btnAddSelectedFrames.hidden = true;
        panelButtons.append(btnAddSelectedFrames);

        btnAddSelectedFrames.on('click', function () {
            editor.call('picker:sprites:editor:pickFrames:add');
        });

        var panelFrames = new ui.Panel();
        panelFrames.scroll = true;
        panelFrames.class.add('frames');
        panel.append(panelFrames);

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

            var queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            var renderPreview = function () {
                editor.call('picker:sprites:editor:renderFramePreview', frame, canvas.element);
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

            btnRemove.on('click', function (e) {
                e.stopPropagation();
                editor.call('picker:sprites:editor:deleteFrames', [key]);
            });

            panel.on('click', function () {
                scrollSelectionIntoView = false;

                if (shiftDown) {
                    // if another frame was selected then add range to selection
                    var keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
                    var len = keys.length;
                    if (len) {
                        var diff = parseInt(key, 10) - parseInt(keys[len-1], 10);
                        var dir = diff < 0 ? -1 : 1;
                        var p = panels[keys[len-1]];
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
                            editor.call('picker:sprites:editor:selectFrames', range, {
                                add: true,
                                history: true,
                                clearSprite: !spriteEditMode
                            });
                        }
                    } else {
                        // otherwise just select single frame
                        editor.call('picker:sprites:editor:selectFrames', key, {
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    }
                } else if (ctrlDown) {
                    // if not selected add frame to selection
                    var keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
                    var idx = keys.indexOf(key);
                    if (idx === -1) {
                        editor.call('picker:sprites:editor:selectFrames', key, {
                            add: true,
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    } else {
                        // if selected remove from selection
                        keys.splice(idx, 1);
                    editor.call('picker:sprites:editor:selectFrames', keys, {
                            history: true,
                            clearSprite: !spriteEditMode
                        });
                    }

                } else {
                    // select single frame
                    editor.call('picker:sprites:editor:selectFrames', key, {
                        history: true,
                        clearSprite: !spriteEditMode
                    });
                }

                scrollSelectionIntoView = true;

            });

            // clean up events
            panel.on('destroy', function () {
                for (var i = 0, len = frameEvents.length; i<len; i++) {
                    frameEvents[i].unbind();
                }
                frameEvents.length = 0;
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
        var frames = atlasAsset.get('data.frames');
        for (var key in frames) {
            addFramePanel(key, frames[key]);
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
            var match = path.match(checkPath);
            if (! match) return;

            // if a frame was set and it doesn't exist create it
            var key = match[2];
            if (key) {
                if (! panels[key]) {
                    var panelBefore = null;
                    var panelAfter = null;

                    var search = parseInt(key, 10);
                    for (var k in panels) {
                        if (search < parseInt(k, 10)) {
                            panelBefore = panels[k];
                            break;
                        } else {
                            panelAfter = panels[k];
                        }
                    }
                    addFramePanel(key, value, panelAfter, panelBefore);
                }
            } else {
                // if all frames are set then re-create all frame panels
                for (key in panels) {
                    panels[key].destroy();
                }

                panels = {};

                for (key in value) {
                    addFramePanel(key, value[key]);
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
        events.push(editor.on('picker:sprites:editor:framesSelected', function (keys) {
            var index = {};
            var key;

            if (spriteEditMode) {
                // unhighlight old keys
                var highlighted = panelFrames.innerElement.querySelectorAll('.frame.highlighted');
                for (var i = 0, len = highlighted.length; i<len; i++) {
                    if (! keys || keys.indexOf(highlighted[i].ui.frameKey) === -1) {
                        highlighted[i].ui.class.remove('highlighted');
                    }
                }

                if (keys) {
                    spriteEditModeKeys = keys.slice();
                    btnAddSelectedFrames.disabled = false;
                } else {
                    spriteEditModeKeys.length = 0;
                    btnAddSelectedFrames.disabled = true;
                }

            } else {
                var selected = panelFrames.innerElement.querySelectorAll('.frame.selected');
                for (var i = 0, len = selected.length; i<len; i++) {
                    if (! keys || keys.indexOf(selected[i].ui.frameKey) === -1) {
                        selected[i].ui.class.remove('selected');
                        selected[i].ui.class.remove('sprite-frame');
                    }
                }

                if (keys) {
                    selectedKeys = keys.slice();
                    btnNewSprite.disabled = false;
                    btnDelete.disabled = false;
                } else {
                    selectedKeys.length = 0;
                    btnNewSprite.disabled = true;
                    btnDelete.disabled = true;
                }
            }

            // select new keys
            if (keys && keys.length) {
                for (var i = 0, len = keys.length; i < len; i++) {
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

        events.push(editor.on('picker:sprites:editor:pickFrames:start', function () {
            spriteEditMode = true;
            btnAddSelectedFrames.hidden = false;
            btnAddSelectedFrames.disabled = true;
            btnNewSprite.hidden = true;
            btnDelete.hidden = true;
        }));

        events.push(editor.on('picker:sprites:editor:pickFrames:end', function () {
            spriteEditMode = false;
            btnAddSelectedFrames.hidden = true;
            btnNewSprite.hidden = false;
            btnDelete.hidden = false;

            for (var i = 0, len = spriteEditModeKeys.length; i<len; i++) {
                if (panels[spriteEditModeKeys[i]]) {
                    panels[spriteEditModeKeys[i]].class.remove('highlighted');
                }
            }

            spriteEditModeKeys.length = 0;
        }));

        events.push(editor.on('picker:sprites:editor:spriteSelected', function (spriteAsset) {
            selectedSprite = spriteAsset;
            var keys = spriteEditMode ? spriteEditModeKeys : selectedKeys;
            for (var i = 0, len = keys.length; i<len; i++) {
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
            panel.destroy();
        }));

        panel.on('destroy', function () {
            for (var i = 0; i < events.length; i++) {
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
