editor.once('load', function() {
    'use strict';

    // In this order: top left, top, top right, left, right, bottom left, bottom, bottom right
    var widthWeights = [0, 0.5, 1, 0, 1, 0, 0.5, 1];
    var heightWeights = [0, 0, 0, 0.5, 0.5, 1, 1, 1];
    var leftOffsets = [-1, -0.5, 0, -1, 0, -1, -0.5, 0];
    var topOffsets = [-1, -1, -1, -0.5, -0.5, 0, 0, 0];
    var knobWidth = 5;

    var COLOR_FRAME = '#B1B8BA';
    var COLOR_FRAME_HIGHLIGHTED = '#2C393C';

    var atlasAsset = null;
    var spriteAsset = null;
    var atlasImage = new Image();
    var atlasImageLoaded = false;

    var shiftDown = false;
    var leftButtonDown = false;
    var rightButtonDown = false;

    var panning = false;
    var selected = null;
    var newFrame = null;
    var hovering = false;
    var highlightedFrames = {};

    var resizeInterval = null;
    var pivotX = 0;
    var pivotY = 0;
    var pivotOffsetX = 0;
    var pivotOffsetY = 0;
    var zoomOffsetX = 0;
    var zoomOffsetY = 0;
    var prevMouseX = 0;
    var prevMouseY = 0;
    var mouseX = 0;
    var mouseY = 0;
    var aspectRatio = 1;
    var canvasRatio = 1;

    var queuedRender = false;

    var suspendCloseUndo = false;

    var KNOB = {
        TOP_LEFT: 1,
        TOP: 2,
        TOP_RIGHT: 3,
        LEFT: 4,
        RIGHT: 5,
        BOTTOM_LEFT: 6,
        BOTTOM: 7,
        BOTTOM_RIGHT: 8
    };

    var events = [];

    // create UI
    var root = editor.call('layout.root');

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('sprites-editor');
    overlay.hidden = true;
    root.append(overlay);

    var panel = new ui.Panel();
    panel.class.add('root-panel');
    panel.flex = true;
    panel.flexDirection = 'row';
    panel.header = 'SPRITE EDITOR';
    overlay.append(panel);
    // close button
    var btnClose = new ui.Button({
        text: '&#57650;'
    });
    btnClose.class.add('close');
    btnClose.on('click', function () {
        editor.call('picker:sprites:editor:close');
    });
    panel.headerElement.appendChild(btnClose.element);

    var leftPanel = new ui.Panel();
    leftPanel.class.add('left-panel');
    // leftPanel.class.add('attributes');
    leftPanel.flexShrink = false;
    leftPanel.style.width = '320px';
    leftPanel.innerElement.style.width = '320px';
    leftPanel.horizontal = true;
    leftPanel.foldable = true;
    leftPanel.scroll = true;
    leftPanel.resizable = 'right';
    leftPanel.resizeMin = 256;
    leftPanel.resizeMax = 512;
    panel.append(leftPanel);

    // middle panel
    var middlePanel = new ui.Panel();
    middlePanel.class.add('middle-panel');
    middlePanel.flex = true;
    middlePanel.flexGrow = true;
    middlePanel.flexDirection = 'column';
    panel.append(middlePanel);

    // Right panel
    var rightPanel = null;

    // Canvas
    var canvasPanel = new ui.Panel();
    canvasPanel.flexGrow = true;
    canvasPanel.class.add('canvas-panel');
    middlePanel.append(canvasPanel);

    var canvas = new ui.Canvas();
    canvas.class.add('canvas');
    canvasPanel.append(canvas);

    // Canvas Context
    var ctx = canvas.element.getContext("2d");

    // controls observer (for zoom/brightness).
    var controls = new Observer({
        zoom: 1,
        brightness: 100
    });

    // Canvas control
    var canvasControl = new ui.Panel();
    canvasControl.flex = true;
    canvasControl.flexDirection = 'row';
    canvasControl.class.add('canvas-control');
    middlePanel.append(canvasControl);

    var alphaControl = new ui.Panel();
    alphaControl.class.add('alpha-control');
    alphaControl.flex = true;
    alphaControl.flexDirection = 'row';
    alphaControl.append(new ui.Label({
        text: 'Alpha'
    }));
    canvasControl.append(alphaControl);

    var zoomControl = new ui.Panel();
    zoomControl.class.add('slider-control');
    zoomControl.flex = true;
    zoomControl.flexDirection = 'row';
    zoomControl.append(new ui.Label({
        text: 'Zoom'
    }));

    var zoomField = new ui.NumberField({
        min: 1,
        precision: 2,
        placeholder: 'X',
    });
    zoomField.link(controls, 'zoom');
    zoomControl.append(zoomField);
    var zoomSlider = new ui.Slider({
        min: 1,
        max: 100,
        precision: 2,
    });
    zoomSlider.link(controls, 'zoom');
    zoomControl.append(zoomSlider);
    canvasControl.append(zoomControl);

    var brightnessControl = new ui.Panel();
    brightnessControl.class.add('slider-control');
    brightnessControl.flex = true;
    brightnessControl.flexDirection = 'row';
    brightnessControl.append(new ui.Label({
        text: 'Brightness'
    }));

    var brightnessField = new ui.NumberField({
        min: 0,
        max: 100,
        precision: 1,
        placeholder: '%',
    });
    brightnessField.link(controls, 'brightness');
    brightnessControl.append(brightnessField);
    var brightnessSlider = new ui.Slider({
        min: 0,
        max: 100,
        precision: 1,
    });
    brightnessSlider.link(controls, 'brightness');
    brightnessControl.append(brightnessSlider);
    canvasControl.append(brightnessControl);

    var imageWidth = function () {
        return controls.get('zoom') * (canvasRatio > aspectRatio ? canvas.height * aspectRatio : canvas.width);
    };

    var imageHeight = function (zoom) {
        return controls.get('zoom') * (canvasRatio <= aspectRatio ? canvas.width / aspectRatio : canvas.height);
    };

    var imageLeft = function () {
        return (pivotX + pivotOffsetX + zoomOffsetX) * canvas.width;
    };

    var imageTop = function () {
        return (pivotY + pivotOffsetY + zoomOffsetY) * canvas.height;
    };

    var frameLeft = function (frame, left, width) {
        return left + frame.rect[0] * width;
    };

    var frameTop = function (frame, top, height) {
        return top + (1 - frame.rect[1] - frame.rect[3]) * height;
    };

    var frameWidth = function (frame, width) {
        return frame.rect[2] * width;
    };

    var frameHeight = function (frame, height) {
        return frame.rect[3] * height;
    };

    var windowToCanvas = function(windowX, windowY) {
        var rect = canvas.element.getBoundingClientRect();
        return {
            x: Math.round(windowX - rect.left),
            y: Math.round(windowY - rect.top),
        };
    };

    var resizeCanvas = function() {
        var result = false;

        var width = canvasPanel.element.clientWidth;
        var height = canvasPanel.element.clientHeight;

        // If it's resolution does not match change it
        if (canvas.element.width !== width || canvas.element.height !== height) {
            canvas.element.width = width;
            canvas.element.height = height;
            result = true;
        }

        canvasRatio = canvas.width / canvas.height;

        return result;
    };

    var resetControls = function () {
        controls.set('zoom', 1);
        pivotX = 0;
        pivotY = 0;
        pivotOffsetX = 0;
        pivotOffsetY = 0;
        zoomOffsetX = 0;
        zoomOffsetY = 0;
    };

    var registerInputListeners = function () {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        canvas.element.addEventListener('mousedown', onMouseDown);
        canvas.element.addEventListener('mousewheel', onWheel); // WekKit
        canvas.element.addEventListener('DOMMouseScroll', onWheel); // Gecko

        // 'F' hotkey to focus canvas
        editor.call('hotkey:register', 'sprite-editor-focus', {
            key: 'f',
            callback: focus
        });

        // Delete hotkey to delete selected frame
        editor.call('hotkey:register', 'sprite-editor-delete', {
            key: 'delete',
            callback: deleteSelectedFrame
        });


        // Esc to deselect and if no selection close the window
        editor.call('hotkey:register', 'sprite-editor-esc', {
            key: 'esc',
            callback: function () {
                if (! selected) {
                    overlay.hidden = true;
                } else {
                    selectFrames(null, {
                        history: true
                    });
                }
            }
        });
    };

    var unregisterInputListeners = function () {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
        canvas.element.removeEventListener('mousedown', onMouseDown);
        canvas.element.removeEventListener("mousewheel", onWheel);
        canvas.element.removeEventListener("DOMMouseScroll", onWheel);

        editor.call('hotkey:unregister', 'sprite-editor-focus');
        editor.call('hotkey:unregister', 'sprite-editor-delete');
        editor.call('hotkey:unregister', 'sprite-editor-esc');
    };

    var onKeyDown = function (e) {
        if (e.shiftKey) {
            shiftDown = true;
            updateCursor();
        }
    };

    var onKeyUp = function (e) {
        if (! e.shiftKey) {
            shiftDown = false;
            if (panning) {
                stopPanning();
            }

            updateCursor();
        }
    };

    var onMouseDown = function (e) {
        if (e.button === 0) {
            leftButtonDown = true;
        } else if (e.button === 2) {
            rightButtonDown = true;
        }

        if (e.button !== 0) return;

        // start panning with left button and shift
        if (! panning && leftButtonDown && shiftDown) {
            startPanning(e.clientX, e.clientY);
            return;
        }

        var p = windowToCanvas(e.clientX, e.clientY);

        // if a frame is already selected try to select one of its knobs
        if (selected) {
            selected.knob = knobsHitTest(p);
            selected.oldFrame = {
                rect: selected.frame.rect.slice(),
                pivot: selected.frame.pivot.slice()
            };

            if (selected.knob) {
                updateCursor();
                queueRender();
            }
        }

        // if no knob selected try to select the frame under the cursor
        if (! selected || ! selected.knob) {
            selectFrames(framesHitTest(p), {
                history: true
            });
        }

        // if no frame selected then start a new frame
        if (! selected) {
            newFrame =  {
                rect: [(p.x - imageLeft()) / imageWidth(), 1 - (p.y - imageTop()) / imageHeight(), 0, 0],
                pivot: [0.5, 0.5]
            };

            updateCursor();
        }
    };

    var onMouseMove = function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // keep panning
        if (panning) {
            pivotOffsetX = (mouseX - prevMouseX) / canvas.width;
            pivotOffsetY = (mouseY - prevMouseY) / canvas.height;
            queueRender();
            return;
        }

        var p = windowToCanvas(mouseX, mouseY);

        // if a knob is selected then modify the selected frame
        if (newFrame) {
            modifyFrame(KNOB.BOTTOM_RIGHT, newFrame, p);
            queueRender();
        } else if (selected && selected.knob) {
            modifyFrame(selected.knob, selected.frame, p);

            // set asset so that other users can see changes too
            var history = atlasAsset.history.enabled;
            atlasAsset.history.enabled = false;
            atlasAsset.set('data.frames.' + selected.key + '.rect', selected.frame.rect);
            atlasAsset.history.enabled = history;

            queueRender();
        }
        // if no knob is selected then change cursor if the user hovers over a knob
        else if (selected) {
            hovering = !!knobsHitTest(p);
            updateCursor();
        }

    };

    var onMouseUp = function (e) {
        if (e.button === 0) {
            leftButtonDown = false;
        } else if (e.button === 1) {
            rightButtonDown = false;
        }

        if (e.button !== 0) return;

        // stop panning
        if (panning && ! leftButtonDown) {
            stopPanning();
        }

        // if we've been editing a new frame then create it
        if (newFrame) {

            // don't generate it if it's too small
            if (newFrame.rect[2] !== 0 && newFrame.rect[3] !== 0) {
                // generate key name for new frame
                var max = 1;
                for (var existingKey in atlasAsset.get('data.frames')) {
                    max = Math.max(parseInt(existingKey, 10) + 1, max);
                }

                newFrame.name = 'Frame ' + max;

                commitFrameChanges(max.toString(), newFrame);
            }

            newFrame = null;
            updateCursor();
            queueRender();
        }
        // if we have edited the selected frame then commit the changes
        else if (selected) {
            // clear selected knob
            if (selected.knob) {
                selected.knob = null;
                queueRender();
            }

            if (selected.oldFrame) {
                var dirty = false;
                for (var i = 0; i < 4; i++) {
                    if (selected.oldFrame.rect[i] !== selected.frame.rect[i]) {
                        dirty = true;
                        break;
                    }
                }

                if(! dirty) {
                    for (var i = 0; i < 2; i++) {
                        if (selected.oldFrame.pivot[i] !== selected.frame.pivot[i]) {
                            dirty = true;
                            break;
                        }
                    }
                }

                if (dirty) {
                    commitFrameChanges(selected.key, selected.frame, selected.oldFrame);
                    selected.oldFrame = null;
                }
            }
        }
    };

    var onWheel = function (e) {
        e.preventDefault();

        var wheel = 0;

        // FF uses 'detail' and returns a value in 'no. of lines' to scroll
        // WebKit and Opera use 'wheelDelta', WebKit goes in multiples of 120 per wheel notch
        if (e.detail) {
            wheel = -1 * e.detail;
        } else if (e.wheelDelta) {
            wheel = e.wheelDelta / 120;
        } else {
            wheel = 0;
        }

        var zoom = controls.get('zoom');
        controls.set('zoom', Math.max(1, zoom + wheel * 0.1));
    };

    // Select frames by keys
    // options.history: Whether to add this action to the history
    // options.add: Whether to add the frames to the existing selection
    var selectFrames = function (keys, options) {
        if (! keys && ! selected) return;

        if (keys && ! (keys instanceof Array))
            keys = [keys];

        var prevSelection = selected && selected.key;
        var prevHighlighted = Object.keys(highlightedFrames);

        // add to selection if necessary
        if (keys && options && options.add) {
            keys = prevHighlighted.concat(prevHighlighted, keys);
        }

        // TODO: check if same selection

        var select = function (newKeys, newSelection, oldKeys) {
            var i, len;
            selected = null;

            if (oldKeys) {
                for (i = 0, len = oldKeys.length; i < len; i++) {
                    delete highlightedFrames[oldKeys[i]];
                }
            }

            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (asset) {
                if (newKeys && newKeys.length) {
                    for (i = 0, len = newKeys.length; i < len; i++) {
                        highlightedFrames[newKeys[i]] = true;
                    }

                    selected = {
                        key: newSelection || newKeys[len-1],
                        frame: asset.get('data.frames.' + (newSelection || newKeys[len-1]))
                    };
                }
            }

            queueRender();
            updateRightPanel();

            editor.emit('picker:sprites:editor:framesSelected', newKeys);
        };

        var redo = function () {
            select(keys, null, prevHighlighted);
        };

        var undo = function () {
            select(prevHighlighted, prevSelection, keys);
        };

        if (options && options.history) {
            editor.call('history:add', {
                name: 'select frame',
                undo: undo,
                redo: redo
            });

        }

        redo();
    };

    editor.method('picker:sprites:editor:selectFrames', function (keys, options) {
        if (!overlay.hidden) {
            selectFrames(keys, options);
        }
    });

    // Modify a frame using the specified knob
    var modifyFrame = function (knob, frame, mousePoint) {
        var imgWidth = imageWidth();
        var imgHeight = imageHeight();
        var imgLeft = imageLeft();
        var imgTop = imageTop();

        var left = frameLeft(frame, imgLeft, imgWidth);
        var top = frameTop(frame, imgTop, imgHeight);
        var width = frameWidth(frame, imgWidth);
        var height = frameHeight(frame, imgHeight);

        var dx = 0;
        var dy = 0;

        var p = mousePoint;

        switch (knob) {
            case KNOB.TOP_LEFT: {
                dx = (p.x - left) / imgWidth;
                dy = (p.y - top) / imgHeight;
                frame.rect[0] += dx;
                frame.rect[2] -= dx;
                frame.rect[3] -= dy;
                break;
            }
            case KNOB.TOP: {
                dy = (p.y - top) / imgHeight;
                frame.rect[3] -= dy;
                break;
            }
            case KNOB.TOP_RIGHT: {
                dx = (p.x - left - width) / imgWidth;
                dy = (p.y - top) / imgHeight;
                frame.rect[2] += dx;
                frame.rect[3] -= dy;
                break;
            }
            case KNOB.LEFT: {
                dx = (p.x - left) / imgWidth;
                frame.rect[0] += dx;
                frame.rect[2] -= dx;
                break;
            }
            case KNOB.RIGHT: {
                dx = (p.x - left - width) / imgWidth;
                frame.rect[2] += dx;
                break;
            }
            case KNOB.BOTTOM_LEFT: {
                dx = (p.x - left) / imgWidth;
                dy = (p.y - top - height) / imgHeight;
                frame.rect[0] += dx;
                frame.rect[1] -= dy;
                frame.rect[2] -= dx;
                frame.rect[3] += dy;
                break;
            }
            case KNOB.BOTTOM: {
                dy = (p.y - top - height) / imgHeight;
                frame.rect[1] -= dy;
                frame.rect[3] += dy;
                break;
            }
            case KNOB.BOTTOM_RIGHT: {
                dx = (p.x - left - width) / imgWidth;
                dy = (p.y - top - height) / imgHeight;
                frame.rect[2] += dx;
                frame.rect[3] += dy;
                frame.rect[1] -= dy;
                break;
            }
        }
    };

    var commitFrameChanges = function (key, frame, oldFrame) {
        // make sure width / height are positive
        if (frame.rect[2] < 0) {
            frame.rect[2] = Math.max(1 / atlasImage.width, -frame.rect[2]);
            frame.rect[0] -= frame.rect[2];
        }

        if (frame.rect[3] < 0) {
            frame.rect[3] = Math.max( 1 / atlasImage.height, -frame.rect[3]);
            frame.rect[1] -= frame.rect[3];
        }

        var newValue = {
            name: frame.name,
            rect: frame.rect.slice(),
            pivot: frame.pivot.slice()
        };

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
                asset.unset('data.frames.' + key);
            }
            asset.history.enabled = history;
        };

        editor.call('history:add', {
            name: 'data.frames.' + key,
            undo: undo,
            redo: redo
        });

        redo();
    };

    var focus = function () {
        resetControls();
        queueRender();
    };

    var deleteSelectedFrame = function () {
        if (selected) {
            atlasAsset.unset('data.frames.' + selected.key);
        }
    };

    var startPanning = function (x, y) {
        panning = true;
        mouseX = x;
        mouseY = y;
        prevMouseX = x;
        prevMouseY = y;
        updateCursor();
    };

    var stopPanning = function () {
        panning = false;
        pivotX += pivotOffsetX;
        pivotY += pivotOffsetY;
        pivotOffsetX = 0;
        pivotOffsetY = 0;
        updateCursor();
    };

    controls.on('zoom:set', function (value, oldValue) {
        if (overlay.hidden) return;

        // store current zoom offset
        pivotX += zoomOffsetX;
        pivotY += zoomOffsetY;
        // reset current zoom offset
        zoomOffsetX = 0;
        zoomOffsetY = 0;

        var x = 0;
        var y = 0;

        // if the mouse cursor is not on the canvas
        // then use canvas center point as zoom pivot
        var canvasRect = canvas.element.getBoundingClientRect();
        if (mouseX < canvasRect.left || mouseX > canvasRect.right ||
            mouseY < canvasRect.top || mouseY > canvasRect.bottom) {
            x = canvas.width / 2;
            y = canvas.height / 2;
        } else {
            x = mouseX - canvasRect.left;
            y = mouseY - canvasRect.top;
        }

        // calculate zoom difference percentage
        var zoomDiff = (value - oldValue);
        var z = zoomDiff / oldValue;

        // calculate zoom offset based on the current zoom pivot
        zoomOffsetX = -z * (x - imageLeft()) / canvas.width;
        zoomOffsetY = -z * (y - imageTop()) / canvas.height;

        // re-render
        queueRender();
    });

    var queueRender = function () {
        if (queuedRender || overlay.hidden) return;
        queuedRender = true;
        requestAnimationFrame(renderCanvas);
    };

    var renderCanvas = function() {
        queuedRender = false;
        if (overlay.hidden) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (! atlasImageLoaded) return;

        // clear selection if no longer exists
        if (selected && ! atlasAsset.has('data.frames.' + selected.key)) {
            selectFrames(null);
        }

        var left = imageLeft();
        var top = imageTop();
        var width = imageWidth();
        var height = imageHeight();

        // draw image
        ctx.drawImage(
            atlasImage,
            0, 0,
            atlasImage.width, atlasImage.height,
            left, top, width, height
        );

        // scroll checkerboard pattern
        var checkLeft = left;
        var checkTop = top;
        canvas.style.backgroundPosition = checkLeft + 'px ' + checkTop + 'px, ' + (checkLeft + 12) + 'px ' + (checkTop + 12) + 'px';

        // draw frames
        var frames = atlasAsset.get('data.frames');
        ctx.beginPath();
        ctx.strokeStyle = COLOR_FRAME;
        ctx.lineWidth = 1;
        for (var key in frames) {
            if (highlightedFrames[key]) continue;

            renderFrame(frames[key], left, top, width, height, false);
        }
        ctx.stroke();

        // draw highlighted frames
        ctx.beginPath();
        ctx.strokeStyle = COLOR_FRAME_HIGHLIGHTED;
        ctx.lineWidth = 2;
        for (var key in highlightedFrames) {
            if (selected && selected.key === key) continue;

            renderFrame(frames[key], left, top, width, height, true);
        }

        // draw newFrame or selected frame
        if (newFrame) {
            if (newFrame.rect[2] !== 0 && newFrame.rect[3] !== 0) {
                renderFrame(newFrame, left, top, width, height, true);
            }
        } else if (selected) {
            renderFrame(selected.frame, left, top, width, height, true);
        }

        ctx.stroke();

        // draw knobs
        if (newFrame || selected) {
            renderKnobs(newFrame || selected.frame, left, top, width, height);
        }
    };

    var renderFrame = function (frame, left, top, width, height, highlighted) {
        var w = frameWidth(frame, width);
        var h = frameHeight(frame, height);
        var x = frameLeft(frame, left, width) - 0.5;
        var y = frameTop(frame, top, height) - 0.5;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y);
    };

    var renderKnobs = function (frame, left, top, width, height) {
        var w = frameWidth(frame, width);
        var h = frameHeight(frame, height);
        var x = frameLeft(frame, left, width);
        var y = frameTop(frame, top, height);
        ctx.fillStyle = '#2C393C';
        for (var i = 0; i < 8; i++) {
            ctx.fillRect(x + knobWidth * leftOffsets[i] + w * widthWeights[i],
                         y + knobWidth * topOffsets[i] + h * heightWeights[i],
                         knobWidth,
                         knobWidth);
        }
    };

    var updateRightPanel = function() {
        if (! rightPanel) {
            rightPanel = new ui.Panel();
            rightPanel.class.add('right-panel');
            rightPanel.class.add('attributes');
            rightPanel.flexShrink = false;
            rightPanel.style.width = '320px';
            rightPanel.innerElement.style.width = '320px';
            rightPanel.horizontal = true;
            rightPanel.foldable = true;
            rightPanel.scroll = true;
            rightPanel.resizable = 'left';
            rightPanel.resizeMin = 256;
            rightPanel.resizeMax = 512;
            panel.append(rightPanel);
        } else {
            // emit 'clear' event to clear existing children of right panel
            rightPanel.emit('clear');
        }

        if (! atlasImageLoaded) return;

        if (selected) {
            editor.call('picker:sprites:attributes:frame', {atlasAsset: atlasAsset, frameKey: selected.key});
        } else {
            editor.call('picker:sprites:attributes:atlas', atlasAsset);
            editor.call('picker:sprites:attributes:slice', {atlasAsset: atlasAsset, atlasImage: atlasImage});
            editor.call('picker:sprites:attributes:spriteassets', {atlasAsset: atlasAsset});
        }
    };

    var rectContainsPoint = function(p, left, top, width, height) {
        return left <= p.x && left + width >= p.x && top <= p.y && top + height >= p.y;
    };

    var framesHitTest = function(p) {
        var frameToReturn = null;

        var imgWidth = imageWidth();
        var imgHeight = imageHeight();
        var imgLeft = imageLeft();
        var imgTop = imageTop();

        var frames = atlasAsset.get('data.frames');
        for (var key in frames) {
            var frame = frames[key];
            var left = frameLeft(frame, imgLeft, imgWidth);
            var top = frameTop(frame, imgTop, imgHeight);
            var width = frameWidth(frame, imgWidth);
            var height = frameHeight(frame, imgHeight);

            if (rectContainsPoint(p, left, top, width, height)) {
                return key;
            }
        }

        return null;
    };

    var knobsHitTest = function(p) {
        var imgWidth = imageWidth();
        var imgHeight = imageHeight();
        var imgLeft = imageLeft();
        var imgTop = imageTop();

        var frame = selected.frame;
        var left = frameLeft(frame, imgLeft, imgWidth);
        var top = frameTop(frame, imgTop, imgHeight);
        var width = frameWidth(frame, imgWidth);
        var height = frameHeight(frame, imgHeight);

        for (var key in KNOB) {
            var knob = KNOB[key];
            var x = left + knobWidth * leftOffsets[knob-1] + width * widthWeights[knob-1];
            var y = top + knobWidth * topOffsets[knob-1] + height * heightWeights[knob-1];
            if (rectContainsPoint(p, x, y, knobWidth, knobWidth)) {
                return knob;
            }
        }

        return null;
    };


    var showEditor = function (asset) {
        if (! editor.call('users:isSpriteTester')) return;

        if (asset.get('type') === 'textureatlas') {
            atlasAsset = asset;
            spriteAsset = null;
        } else if (asset.get('type') === 'sprite') {
            atlasAsset = editor.call('assets:get', asset.get('data.textureAtlasAsset'));
            spriteAsset = asset;
        } else {
            atlasAsset = null;
            spriteAsset = null;
        }

        if (! atlasAsset)
            return;

        // show overlay
        overlay.hidden = false;

        atlasImageLoaded = false;
        atlasImage.onload = function () {
            atlasImageLoaded = true;
            aspectRatio = atlasImage.width / atlasImage.height;
            updateRightPanel();

            editor.call('picker:sprites:attributes:frames', {
                atlasAsset: atlasAsset,
                atlasImage: atlasImage
            });

            renderCanvas();
        };
        atlasImage.src = atlasAsset.get('file.url') + '?t=' + atlasAsset.get('file.hash');

        selected = null;

        var updateSelectedFrameTimeout = null;
        var lastFrameUpdated = null;
        var isLastFrameChangeLocal = false;
        var updateSelectedFrame = function () {
            if (! lastFrameUpdated) return;

            if (selected && selected.key === lastFrameUpdated) {
                selected.frame = atlasAsset.get('data.frames.' + selected.key);
            } else if (isLastFrameChangeLocal) {
                selectFrames(lastFrameUpdated);
            }

            lastFrameUpdated = null;
            updateSelectedFrameTimeout = null;

            queueRender();
        };

        // listen to atlas changes and render
        var checkPath = /^data\.frames(\.(\d+))?\b/;
        events.push(atlasAsset.on('*:set', function (path, value, oldValue, remote) {
            var match = path.match(checkPath);
            if (! match) return;

            if (match[2]) {
                lastFrameUpdated = match[2];
                isLastFrameChangeLocal = !remote;

                // update selected frame in a timeout to avoid multiple updates
                if (! updateSelectedFrameTimeout) {
                    updateSelectedFrameTimeout = setTimeout(updateSelectedFrame);
                }
            } else if (selected) {
                selectFrames(null);
            }

            queueRender();
        }));
        events.push(atlasAsset.on('*:unset', queueRender));

        // resize 20 times a second - if size is the same nothing will happen
        if (resizeInterval) {
            clearInterval(resizeInterval);
        }
        resizeInterval = setInterval(function() {
            if (resizeCanvas()) {
                queueRender();
            }
        }, 1000 / 60);

        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updateRightPanel();

        registerInputListeners();
    };

    var updateCursor = function () {
        var grab = false;
        var grabbing = false;

        grab = hovering || shiftDown;
        grabbing = newFrame || selected && selected.knob || panning;

        if (grab)
            canvasPanel.class.add('grab');
        else
            canvasPanel.class.remove('grab');

        if (grabbing)
            canvasPanel.class.add('grabbing');
        else
            canvasPanel.class.remove('grabbing');
    };

    var cleanUp = function () {
        // reset controls
        controls.set('zoom', 1);
        controls.set('brightness', 100);

        resetControls();

        if (resizeInterval) {
            clearInterval(resizeInterval);
            resizeInterval = null;
        }

        // destroy right panel
        if (rightPanel) {
            rightPanel.destroy();
            rightPanel = null;
        }

        leftPanel.emit('clear');

        selected = null;
        newFrame = null;
        hovering = false;
        highlightedFrames = {};

        leftButtonDown = false;
        rightButtonDown = false;
        shiftDown = false;

        canvasPanel.class.remove('grab');
        canvasPanel.class.remove('grabbing');

        for (var i = 0; i < events.length; i++) {
            events[i].unbind();
        }
        events.length = 0;

        unregisterInputListeners();
    };

    // Return left panel
    editor.method('picker:sprites:editor:leftPanel', function() {
        return leftPanel;
    });

    // Return right panel
    editor.method('picker:sprites:editor:rightPanel', function() {
        return rightPanel;
    });

    // open Sprite Editor (undoable)
    editor.method('picker:sprites:editor', function (asset) {
        editor.call('history:add', {
            name: 'open sprite editor',
            undo: function () {
                overlay.hidden = true;
            },
            redo: function () {
                var currentAsset = editor.call('assets:get', asset.get('id'));
                if (! currentAsset) return;

                showEditor(currentAsset);
            }
        });

        showEditor(asset);
    });

    // Close Sprite Editor (undoable)
    editor.method('picker:sprites:editor:close', function () {
        overlay.hidden = true;
    });


    // Clean up
    overlay.on('hide', function () {
        if (! suspendCloseUndo) {
            var currentAsset = atlasAsset;

            editor.call('history:add', {
                name: 'close sprite editor',
                undo: function () {
                    var asset = editor.call('assets:get', currentAsset.get('id'));
                    if (! asset) return;

                    showEditor(asset);
                },
                redo: function () {
                    suspendCloseUndo = true;
                    overlay.hidden = true;
                    suspendCloseUndo = false;
                }
            });
        }

        cleanUp();
    });
});
