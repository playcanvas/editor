editor.once('load', function() {
    'use strict';

    editor.method('picker:sprites:attributes:frames', function(args) {
        var events = [];

        var atlasAsset = args.atlasAsset;
        var atlasImage = args.atlasImage;

        var panels = {};
        var selectedPanels = {};
        var lastFrameSelected = null;

        var shiftDown = false;
        var ctrlDown = false;

        var rootPanel = editor.call('picker:sprites:editor:leftPanel');
        rootPanel.header = 'FRAMES';

        var panel = editor.call('attributes:addPanel', {
            parent: rootPanel
        });

        var panelFrames = new ui.Panel();
        panelFrames.class.add('frames');
        panel.append(panelFrames);

        var addFramePanel = function (key, frame) {
            var frameEvents = [];

            var panel = new ui.Panel();
            panel.flex = true;
            panel.flexGrow = 1;
            panel.class.add('frame');
            panel.frameKey = key;

            panels[key] = panel;

            // sprite preview
            var canvas = new ui.Canvas();
            var previewWidth = 26;
            var previewHeight = 26;
            canvas.class.add('preview');
            canvas.resize(previewWidth, previewHeight);
            panel.append(canvas);
            var ctx = canvas.element.getContext('2d');

            var renderQueued = false;

            var queueRender = function () {
                if (renderQueued) return;
                renderQueued = true;
                requestAnimationFrame(renderPreview);
            };

            var renderPreview = function () {
                var x = frame.rect[0] * atlasImage.width;
                // convert bottom left WebGL coord to top left pixel coord
                var y = (1 - frame.rect[1] - frame.rect[3]) * atlasImage.height;
                var w = frame.rect[2] * atlasImage.width;
                var h = frame.rect[3] * atlasImage.height;

                // choose targetWidth and targetHeight keeping the aspect ratio
                var aspectRatio = w / h;
                var targetWidth = previewWidth;
                var targetHeight = previewHeight;

                if (w >= h) {
                    targetHeight = previewWidth / aspectRatio;
                } else {
                    targetWidth = targetHeight * aspectRatio;
                }

                var offsetX = (previewWidth - targetWidth) / 2;
                var offsetY = (previewHeight - targetHeight) / 2;

                ctx.clearRect(0, 0, previewWidth, previewHeight);
                ctx.drawImage(atlasImage, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);
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

            panel.on('click', function () {
                if (shiftDown) {
                    // if another frame was selected then add range to selection
                    if (lastFrameSelected) {
                        var diff = parseInt(key, 10) - parseInt(lastFrameSelected, 10);
                        var rangeStart = diff >= 0 ? lastFrameSelected : key;
                        var rangeEnd = diff >= 0 ? key : lastFrameSelected;

                        if (diff) {
                            var range = [];
                            var p = panels[rangeStart];

                            while (p && p.frameKey) {
                                range.push(p.frameKey);

                                if (p.frameKey === rangeEnd)
                                    break;

                                var next = p.element.nextSibling;
                                if (! next) break;

                                p = next.ui;
                            }

                            editor.call('picker:sprites:editor:selectFrames', range, {
                                add: true,
                                history: true
                            });
                        }

                    } else {
                        // otherwise just select single frame
                        editor.call('picker:sprites:editor:selectFrames', key, {
                            history: true
                        });
                    }
                } else if (ctrlDown) {
                    // add frame to selection
                    editor.call('picker:sprites:editor:selectFrames', key, {
                        add: true,
                        history: true
                    });
                } else {
                    // select single frame
                    editor.call('picker:sprites:editor:selectFrames', key, {
                        history: true
                    });
                }

            });

            // clean up events
            panel.on('destroy', function () {
                for (var i = 0, len = frameEvents.length; i<len; i++) {
                    frameEvents[i].unbind();
                }
                frameEvents.length = 0;
            });

            panelFrames.append(panel);
        };

        var selectPanel = function (key) {
            if (selectedPanels[key]) return;
            selectedPanels[key] = true;
            panels[key].class.add('selected');
        };

        var deselectPanel = function (key) {
            if (! selectedPanels[key]) return;
            delete selectedPanels[key];
            panels[key].class.remove('selected');
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
                    addFramePanel(key, value);
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

            // select new keys
            if (keys && keys.length) {
                for (var i = 0, len = keys.length; i < len; i++) {
                    key = keys[i];
                    index[key] = true;

                    if (! panels[key]) continue;
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


        // clean up
        events.push(rootPanel.on('clear', function () {
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
        });
    });
});
