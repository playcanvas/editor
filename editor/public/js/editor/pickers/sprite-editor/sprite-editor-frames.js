editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:frames', function(args) {
        var events = [];

        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;

        var panels = {};
        var selectedPanels = {};
        var selectedKeys = [];
        var lastFrameSelected = null;

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
            editor.call('picker:sprites:editor:deleteFrames', Object.keys(selectedPanels));
        });

        var btnAddSelectedFrames = new ui.Button({
            text: 'ADD FRAMES TO SPRITE'
        });
        btnAddSelectedFrames.class.add('icon', 'wide', 'create');
        btnAddSelectedFrames.flexGrow = 1;
        btnAddSelectedFrames.disabled = true;
        btnAddSelectedFrames.hidden = true;
        panelButtons.append(btnAddSelectedFrames);

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
                atlasAsset.unset('data.frames.' + key);
            });

            panel.on('click', function () {
                scrollSelectionIntoView = false;

                if (shiftDown) {
                    // if another frame was selected then add range to selection
                    if (lastFrameSelected) {
                        var diff = parseInt(key, 10) - parseInt(lastFrameSelected, 10);
                        var rangeStart = diff >= 0 ? lastFrameSelected : key;
                        var rangeEnd = diff >= 0 ? key : lastFrameSelected;
                        diff = Math.abs(diff);

                        if (diff) {
                            var range = [];
                            var p = panels[rangeStart];

                            while (p && p.frameKey && diff >= 0) {
                                range.push(p.frameKey);

                                var next = p.element.nextSibling;
                                if (! next) break;

                                p = next.ui;
                                diff--;
                            }

                            editor.call('picker:sprites:editor:selectFrames', range, {
                                add: true,
                                history: true,
                                clearSprite: true
                            });
                        }

                    } else {
                        // otherwise just select single frame
                        editor.call('picker:sprites:editor:selectFrames', key, {
                            history: true,
                            clearSprite: true
                        });
                    }
                } else if (ctrlDown) {
                    // if not selected add frame to selection
                    if (! selectedPanels[key]) {
                        editor.call('picker:sprites:editor:selectFrames', key, {
                            add: true,
                            history: true,
                            clearSprite: true
                        });
                    } else {
                        // if selected remove from selection
                        var idx = selectedKeys.indexOf(key);
                        if (idx !== -1) {
                            selectedKeys.splice(idx, 1);
                            editor.call('picker:sprites:editor:selectFrames', selectedKeys, {
                                history: true,
                                clearSprite: true
                            });
                        }
                    }

                } else {
                    // select single frame
                    editor.call('picker:sprites:editor:selectFrames', key, {
                        history: true,
                        clearSprite: true
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

        var selectPanel = function (key) {
            if (selectedPanels[key]) return;
            selectedPanels[key] = true;
            panels[key].class.add('selected');

            btnNewSprite.disabled = false;
            btnDelete.disabled = false;
        };

        var deselectPanel = function (key) {
            if (! selectedPanels[key]) return;
            delete selectedPanels[key];
            panels[key].class.remove('selected');

            var hasSelected = false;
            for (var key in selectedPanels) {
                hasSelected = true;
                break;
            }

            if (! hasSelected) {
                btnNewSprite.disabled = true;
                btnDelete.disabled = true;
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
                selectedPanels = {};
                lastFrameSelected = null;

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
                delete selectedPanels[key];
                if (lastFrameSelected === key)
                    lastFrameSelected = null;
            }
        }));

        // Listen to framesSelected event to highlight panels
        events.push(editor.on('picker:sprites:editor:framesSelected', function (keys) {
            var index = {};
            var key;

            if (keys) {
                selectedKeys = keys.slice();
            } else {
                selectedKeys.length = 0;
            }

            // select new keys
            if (keys && keys.length) {
                for (var i = 0, len = keys.length; i < len; i++) {
                    key = keys[i];
                    index[key] = true;

                    if (! panels[key]) continue;

                    if (scrollSelectionIntoView) {
                        if (i === 0 && ! selectPanel[key]) {
                            panelFrames.innerElement.scrollTop = panels[key].element.offsetTop;
                        }
                    }

                    selectPanel(key);
                }

                lastFrameSelected = len ? keys[len-1] : null;
            }

            // deselect old keys
            for (key in selectedPanels) {
                if (! index[key]) {
                    deselectPanel(key);
                }
            }
        }));

        events.push(editor.on('picker:sprites:editor:pickFrames:start', function () {
            btnAddSelectedFrames.hidden = false;
            btnAddSelectedFrames.disabled = true;
            btnNewSprite.hidden = true;
            btnDelete.hidden = true;
        }));

        events.push(editor.on('picker:sprites:editor:pickFrames:end', function () {
            btnAddSelectedFrames.hidden = true;
            btnNewSprite.hidden = false;
            btnDelete.hidden = false;
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
            selectedPanels = {};
            lastFrameSelected = null;
            selectedKeys = [];
        });
    });
});
