editor.once('load', function() {
    'use strict';

    // In this order: top left, top, top right, left, right, bottom left, bottom, bottom right
    // var widthWeights = [0, 0.5, 1, 0, 1, 0, 0.5, 1];
    // var heightWeights = [0, 0, 0, 0.5, 0.5, 1, 1, 1];
    // var leftOffsets = [-1, -0.5, 0, -1, 0, -1, -0.5, 0];
    // var topOffsets = [-1, -1, -1, -0.5, -0.5, 0, 0, 0];

    // In this order: top left, top right, bottom left, bottom right
    var leftOffsets = [-0.5, -0.5, -0.5, -0.5];
    var topOffsets = [-0.5, -0.5, -0.5, -0.5];
    var widthWeights = [0, 1, 0, 1];
    var heightWeights = [0, 0, 1, 1];

    var handleWidth = 10;
    var pivotWidth = 7;

    var COLOR_FRAME = '#B1B8BA';
    var COLOR_FRAME_HIGHLIGHTED = '#2C393C';
    var COLOR_FRAME_SELECTED = '#2C393C';
    var COLOR_HANDLE = '#0f0';
    var COLOR_PIVOT_SELECTED = '#0f0';
    var COLOR_PIVOT_BORDER = '#2C393C';

    var atlasAsset = null;
    var spriteAsset = null;
    var atlasImage = new Image();
    var atlasImageLoaded = false;

    var shiftDown = false;
    var ctrlDown = false;
    var leftButtonDown = false;
    var rightButtonDown = false;

    var panning = false;
    var selected = null;
    var newFrame = null;
    var hovering = false;
    var highlightedFrames = [];
    var newSpriteFrames = [];
    var spriteEditMode = false;

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

    var HANDLE = {
        TOP_LEFT: 1,
        TOP_RIGHT: 2,
        BOTTOM_LEFT: 3,
        BOTTOM_RIGHT: 4
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

    var overlayPickFrames = new ui.Overlay();
    overlayPickFrames.class.add('overlay-frames');
    overlayPickFrames.hidden = true;
    panel.append(overlayPickFrames);

    var leftPanel = new ui.Panel();
    leftPanel.class.add('left-panel');
    // leftPanel.class.add('attributes');
    leftPanel.flexShrink = false;
    leftPanel.style.width = '320px';
    leftPanel.innerElement.style.width = '320px';
    leftPanel.horizontal = true;
    leftPanel.foldable = true;
    // leftPanel.scroll = true;
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

        // Delete hotkey to delete selected frames
        editor.call('hotkey:register', 'sprite-editor-delete', {
            key: 'delete',
            callback: function () {
                if (selected && ! spriteAsset) {
                    editor.call('picker:sprites:editor:deleteFrames', highlightedFrames);
                }
            }
        });


        // Esc to deselect and if no selection close the window
        editor.call('hotkey:register', 'sprite-editor-esc', {
            key: 'esc',
            callback: function () {
                if (spriteAsset) {
                    if (!overlayPickFrames.hidden) {
                        overlayPickFrames.hidden = true;
                    } else {
                        selectSprite(null, {
                            history: true
                        });
                    }
                } else if (selected) {
                    selectFrames(null, {
                        history: true
                    });
                } else {
                    overlay.hidden = true;
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

        ctrlDown = e.ctrlKey || e.metaKey;
    };

    var onKeyUp = function (e) {
        if (! e.shiftKey) {
            shiftDown = false;
            if (panning) {
                stopPanning();
            }

            updateCursor();
        }

        ctrlDown = e.ctrlKey || e.metaKey;
    };

    var onMouseDown = function (e) {
        if (e.button === 0) {
            leftButtonDown = true;
        } else if (e.button === 2) {
            rightButtonDown = true;
        }

        ctrlDown = e.ctrlKey || e.metaKey;

        if (e.button !== 0) return;

        // start panning with left button and shift
        if (! panning && leftButtonDown && shiftDown) {
            startPanning(e.clientX, e.clientY);
            return;
        }

        var p = windowToCanvas(e.clientX, e.clientY);

        // if a frame is already selected try to select one of its handles
        if (selected && ! ctrlDown) {
            selected.oldFrame = atlasAsset.get('data.frames.' + selected.key);
            if (selected.oldFrame) {
                selected.handle = handlesHitTest(p, selected.oldFrame);

                if (selected.handle) {
                    updateCursor();
                    queueRender();
                }

            }
        }

        // if no handle selected try to select the frame under the cursor
        if (! selected || ! selected.handle) {
            var frameUnderCursor = framesHitTest(p);
            if (! frameUnderCursor) {
                // clear selection
                selectFrames(null, {history: true, clearSprite: !spriteEditMode});
            } else {
                var keys = spriteEditMode ? newSpriteFrames : highlightedFrames;
                var idx = keys.indexOf(frameUnderCursor);
                // deselect already highlighted frame if ctrl is pressed
                if (idx !== -1 && ctrlDown) {
                    keys = keys.slice();
                    keys.splice(idx, 1);
                    selectFrames(keys, {
                        history: true,
                        clearSprite: !spriteEditMode
                    });
                } else {
                    // select new frame
                    selectFrames(frameUnderCursor, {
                        history: true,
                        clearSprite: !spriteEditMode,
                        add: ctrlDown
                    });
                }
            }
        }

        // if no frame selected then start a new frame
        if (! selected && ! spriteEditMode) {
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

        // if a handle is selected then modify the selected frame
        if (newFrame) {
            modifyFrame(HANDLE.BOTTOM_RIGHT, newFrame, p);
            queueRender();
        } else if (selected && selected.handle) {
            var frame = modifyFrame(selected.handle, atlasAsset.get('data.frames.' + selected.key), p);

            // set asset so that other users can see changes too
            var history = atlasAsset.history.enabled;
            atlasAsset.history.enabled = false;
            atlasAsset.set('data.frames.' + selected.key + '.rect', frame.rect);
            atlasAsset.history.enabled = history;

            queueRender();
        }
        // if no handle is selected then change cursor if the user hovers over a handle
        else if (selected) {
            var selectedFrame = atlasAsset.get('data.frames.' + selected.key);
            if (selectedFrame) {
                hovering = !!handlesHitTest(p, selectedFrame);
                updateCursor();
            }
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
                var key = 1;
                for (var existingKey in atlasAsset.get('data.frames')) {
                    key = Math.max(parseInt(existingKey, 10) + 1, key);
                }

                newFrame.name = 'Frame ' + key;

                commitFrameChanges(key.toString(), newFrame);
                selectFrames(key.toString(), {
                    clearSprite: true
                });
            }

            newFrame = null;
            updateCursor();
            queueRender();
        }
        // if we have edited the selected frame then commit the changes
        else if (selected) {
            // clear selected handle
            if (selected.handle) {
                selected.handle = null;
                queueRender();
            }

            if (selected.oldFrame) {
                var frame = atlasAsset.get('data.frames.' + selected.key);
                var dirty = false;
                for (var i = 0; i < 4; i++) {
                    if (selected.oldFrame.rect[i] !== frame.rect[i]) {
                        dirty = true;
                        break;
                    }
                }

                if(! dirty) {
                    for (var i = 0; i < 2; i++) {
                        if (selected.oldFrame.pivot[i] !== frame.pivot[i]) {
                            dirty = true;
                            break;
                        }
                    }
                }

                if (dirty) {
                    commitFrameChanges(selected.key, frame, selected.oldFrame);
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
    // options.clearSprite: Clear sprite selection if true
    var selectFrames = function (keys, options) {
        if (! keys && ! selected && ! highlightedFrames.length) return;

        if (keys && ! (keys instanceof Array))
            keys = [keys];

        // check if new selection differs from old
        var dirty = false;
        if (! keys && selected) {
            dirty = true;
        } else if (keys && ! selected) {
            dirty = true;
        } else if (selected && spriteAsset && (! options || ! options.clearSprite)) {
            dirty = true;
        } else {
            var klen = keys ? keys.length : 0;
            var hlen = highlightedFrames.length;
            if (klen !== hlen) {
                dirty = true;
            } else {
                for (var i = 0; i < klen; i++) {
                    if (keys[i] !== highlightedFrames[i]) {
                        dirty = true;
                        break;
                    }
                }
            }
        }

        if (! dirty)
            return;

        var prevSelection = selected && selected.key;
        var prevHighlighted = spriteEditMode ? newSpriteFrames.slice() : highlightedFrames.slice();
        var prevSprite = spriteAsset;

        // add to selection if necessary
        if (keys && options && options.add) {
            var temp = prevHighlighted.slice();
            for (var i = 0, len = keys.length; i<len; i++) {
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

                    if (! spriteAsset) {
                        selected = {
                            key: newSelection || newKeys[len-1],
                            frame: asset.get('data.frames.' + (newSelection || newKeys[len-1]))
                        };

                    }
                }
            }

            queueRender();

            // do not re-create the right panel
            // while we are selecting frames to add
            // to the sprite asset
            if (! spriteEditMode) {
                updateRightPanel();
            }

            editor.emit('picker:sprites:editor:framesSelected', newKeys);
        };

        var redo = function () {
            if (options && options.clearSprite) {
                spriteAsset = null;
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
    };

    // Modify a frame using the specified handle
    var modifyFrame = function (handle, frame, mousePoint) {
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

        switch (handle) {
            case HANDLE.TOP_LEFT: {
                dx = (p.x - left) / imgWidth;
                dy = (p.y - top) / imgHeight;
                frame.rect[0] += dx;
                frame.rect[2] -= dx;
                frame.rect[3] -= dy;
                break;
            }
            case HANDLE.TOP: {
                dy = (p.y - top) / imgHeight;
                frame.rect[3] -= dy;
                break;
            }
            case HANDLE.TOP_RIGHT: {
                dx = (p.x - left - width) / imgWidth;
                dy = (p.y - top) / imgHeight;
                frame.rect[2] += dx;
                frame.rect[3] -= dy;
                break;
            }
            case HANDLE.LEFT: {
                dx = (p.x - left) / imgWidth;
                frame.rect[0] += dx;
                frame.rect[2] -= dx;
                break;
            }
            case HANDLE.RIGHT: {
                dx = (p.x - left - width) / imgWidth;
                frame.rect[2] += dx;
                break;
            }
            case HANDLE.BOTTOM_LEFT: {
                dx = (p.x - left) / imgWidth;
                dy = (p.y - top - height) / imgHeight;
                frame.rect[0] += dx;
                frame.rect[1] -= dy;
                frame.rect[2] -= dx;
                frame.rect[3] += dy;
                break;
            }
            case HANDLE.BOTTOM: {
                dy = (p.y - top - height) / imgHeight;
                frame.rect[1] -= dy;
                frame.rect[3] += dy;
                break;
            }
            case HANDLE.BOTTOM_RIGHT: {
                dx = (p.x - left - width) / imgWidth;
                dy = (p.y - top - height) / imgHeight;
                frame.rect[2] += dx;
                frame.rect[3] += dy;
                frame.rect[1] -= dy;
                break;
            }
        }

        return frame;
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
                deleteFrames([key]);
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
        var frames = atlasAsset.getRaw('data.frames')._data;
        ctx.beginPath();
        ctx.strokeStyle = COLOR_FRAME;
        ctx.lineWidth = 1;
        for (var key in frames) {
            if (highlightedFrames.indexOf(key) !== -1 || newSpriteFrames.indexOf(key) !== -1) continue;

            renderFrame(frames[key]._data, left, top, width, height);
        }
        ctx.stroke();

        // draw highlighted frames
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLOR_FRAME_HIGHLIGHTED;
        for (var i = 0, len = highlightedFrames.length; i<len; i++) {
            var key = highlightedFrames[i];
            if (selected && selected.key === key) continue;

            // check if frame no longer exists
            if (! frames[key]) {
                highlightedFrames.splice(i, 1);
                len--;
                i--;
            } else {
                renderFrame(frames[key]._data, left, top, width, height, 0, !spriteEditMode);
            }
        }
        ctx.stroke();

        // draw sprite edit mode frames
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = COLOR_HANDLE;
        for (var i = 0, len = newSpriteFrames.length; i<len; i++) {
            var key = newSpriteFrames[i];

            // check if frame no longer exists
            if (! frames[key]) {
                newSpriteFrames.splice(i, 1);
                len--;
                i--;
            } else {
                renderFrame(frames[key]._data, left, top, width, height, 1, !spriteEditMode);
            }
        }
        ctx.stroke();

        var frame = newFrame || (selected ? atlasAsset.get('data.frames.' + selected.key) : null);

        if (frame) {
            ctx.beginPath();
            ctx.strokeStyle = COLOR_FRAME_SELECTED;

            // draw newFrame or selected frame
            if (frame !== newFrame || newFrame.rect[2] !== 0 && newFrame.rect[3] !== 0) {
                renderFrame(frame, left, top, width, height);
            }

            ctx.stroke();

            // draw handles
            if (frame !== newFrame)
                renderHandles(frame, left, top, width, height);
        }
    };

    var renderFrame = function (frame, left, top, width, height, offset, renderPivot) {
        var x = frameLeft(frame, left, width);
        var y = frameTop(frame, top, height);
        var w = frameWidth(frame, width);
        var h = frameHeight(frame, height);

        offset = offset || 0;

        // render rect
        ctx.moveTo(x - offset, y - offset);
        ctx.lineTo(x - offset, y + offset + h);
        ctx.lineTo(x + offset + w, y + offset + h);
        ctx.lineTo(x + offset + w, y - offset);
        ctx.lineTo(x - offset, y - offset);

        if (renderPivot) {
            var px = x + frame.pivot[0] * w;
            var py = y + (1 - frame.pivot[1]) * h;
            ctx.moveTo(px + pivotWidth, py);
            ctx.arc(px, py, pivotWidth, 0, 2 * Math.PI);
        }
    };

    var renderHandles = function (frame, left, top, width, height) {
        var x = frameLeft(frame, left, width);
        var y = frameTop(frame, top, height);
        var w = frameWidth(frame, width);
        var h = frameHeight(frame, height);
        var px = x + frame.pivot[0] * w;
        var py = y + (1 - frame.pivot[1]) * h;
        ctx.strokeStyle = COLOR_FRAME_SELECTED;
        ctx.fillStyle = COLOR_HANDLE;
        ctx.lineWidth = 1;

        // corners
        for (var i = 0; i < 4; i++) {
            ctx.fillRect(x + handleWidth * leftOffsets[i] + w * widthWeights[i],
                         y + handleWidth * topOffsets[i] + h * heightWeights[i],
                         handleWidth,
                         handleWidth);

            ctx.strokeRect(x + handleWidth * leftOffsets[i] + w * widthWeights[i],
                         y + handleWidth * topOffsets[i] + h * heightWeights[i],
                         handleWidth,
                         handleWidth);
        }

        // pivot
        ctx.beginPath();

        // border
        ctx.lineWidth = 5;
        ctx.strokeStyle = COLOR_PIVOT_BORDER;
        ctx.moveTo(px + pivotWidth, py);
        ctx.arc(px, py, pivotWidth, 0, 2 * Math.PI);
        ctx.stroke();
        // inside border
        ctx.lineWidth = 3;
        ctx.strokeStyle = COLOR_PIVOT_SELECTED;
        ctx.stroke();
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

        if (spriteAsset) {
            editor.call('picker:sprites:attributes:sprite', {atlasAsset: atlasAsset, atlasImage: atlasImage, spriteAsset: spriteAsset});
        } else {
            if (selected) {
                editor.call('picker:sprites:attributes:frames', {atlasAsset: atlasAsset, atlasImage: atlasImage, frames: highlightedFrames});
            } else {
                editor.call('picker:sprites:attributes:atlas', atlasAsset);
                editor.call('picker:sprites:attributes:slice', {atlasAsset: atlasAsset, atlasImage: atlasImage});
                editor.call('picker:sprites:attributes:spriteassets', {atlasAsset: atlasAsset});
            }
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

    var handlesHitTest = function(p, frame) {
        var imgWidth = imageWidth();
        var imgHeight = imageHeight();
        var imgLeft = imageLeft();
        var imgTop = imageTop();

        var left = frameLeft(frame, imgLeft, imgWidth);
        var top = frameTop(frame, imgTop, imgHeight);
        var width = frameWidth(frame, imgWidth);
        var height = frameHeight(frame, imgHeight);

        for (var key in HANDLE) {
            var handle = HANDLE[key];
            var x = left + handleWidth * leftOffsets[handle-1] + width * widthWeights[handle-1];
            var y = top + handleWidth * topOffsets[handle-1] + height * heightWeights[handle-1];
            if (rectContainsPoint(p, x, y, handleWidth, handleWidth)) {
                return handle;
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

            editor.call('picker:sprites:frames', {
                atlasAsset: atlasAsset,
                atlasImage: atlasImage
            });

            renderCanvas();
        };
        atlasImage.src = atlasAsset.get('file.url') + '?t=' + atlasAsset.get('file.hash');

        selected = null;

        // listen to atlas changes and render
        events.push(atlasAsset.on('*:set', queueRender));
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
        grabbing = newFrame || selected && selected.handle || panning;

        if (grab)
            canvasPanel.class.add('grab');
        else
            canvasPanel.class.remove('grab');

        if (grabbing)
            canvasPanel.class.add('grabbing');
        else
            canvasPanel.class.remove('grabbing');
    };

    // if the selected sprite is deleted then deselect it
    events.push(editor.on('assets:remove', function (asset) {
        if (spriteAsset && spriteAsset.get('id') === asset.get('id')) {
            selectSprite(null);
        }
    }));

    // Delete frames with specified keys from atlas and also
    // remove these frames from any sprite assets that are referencing them
    var deleteFrames = function (keys, history) {
        if (history) {
            // make copy of array to make sure undo / redo works
            keys = keys.slice();
        }

        var numKeys = keys.length;

        if (history) {
            var oldFrames = {};
            for (var i = 0; i < numKeys; i++) {
                oldFrames[keys[i]] = atlasAsset.get('data.frames.' + keys[i]);
            }
        }

        var redo = function () {
            var asset = editor.call('assets:get', atlasAsset.get('id'));
            if (! asset) return;
            var history = asset.history.enabled;
            asset.history.enabled = false;

            for (var i = 0; i < numKeys; i++) {
                asset.unset('data.frames.' + keys[i]);
            }

            selectFrames(null, {
                clearSprite: true
            });

            asset.history.enabled = history;
        };

        if (history) {
            var undo = function () {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;
                var history = asset.history.enabled;
                asset.history.enabled = false;

                for (var i = 0; i < numKeys; i++) {
                    asset.set('data.frames.' + keys[i], oldFrames[keys[i]]);
                }

                selectFrames(keys, {
                    clearSprite: true
                });

                asset.history.enabled = history;

            };

            editor.call('history:add', {
                name: 'delete frames',
                undo: undo,
                redo: redo
            });
        }

        redo();
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
            rightPanel.emit('clear');
            rightPanel.destroy();
            rightPanel = null;
        }

        leftPanel.emit('clear');

        selected = null;
        newFrame = null;
        hovering = false;
        highlightedFrames.length = 0;
        newSpriteFrames.length = 0;

        leftButtonDown = false;
        rightButtonDown = false;
        shiftDown = false;

        overlayPickFrames.hidden = true;

        canvasPanel.class.remove('grab');
        canvasPanel.class.remove('grabbing');

        for (var i = 0; i < events.length; i++) {
            events[i].unbind();
        }
        events.length = 0;

        unregisterInputListeners();
    };

    editor.method('picker:sprites:editor:selectFrames', function (keys, options) {
        if (!overlay.hidden) {
            selectFrames(keys, options);
        }
    });

    editor.method('picker:sprites:editor:deleteFrames', function (keys) {
        deleteFrames(keys, true);
    });

    // Return left panel
    editor.method('picker:sprites:editor:leftPanel', function() {
        return leftPanel;
    });

    // Return right panel
    editor.method('picker:sprites:editor:rightPanel', function() {
        return rightPanel;
    });

    // Return main panel
    editor.method('picker:sprites:editor:mainPanel', function () {
        return panel;
    });

    editor.method('picker:sprites:editor:renderFramePreview', function (frame, canvas, allFrames) {
        if (! frame.pivot || ! frame.rect) return; // this might happen while we are deleting stuff

        var x = frame.rect[0] * atlasImage.width;
        // convert bottom left WebGL coord to top left pixel coord
        var y = (1 - frame.rect[1] - frame.rect[3]) * atlasImage.height;
        var w = frame.rect[2] * atlasImage.width;
        var h = frame.rect[3] * atlasImage.height;

        var aspectRatio = w / h;

        // choose targetWidth and targetHeight keeping the aspect ratio
        var width = canvas.width;
        var height = canvas.height;
        var targetWidth = width;
        var targetHeight = height;
        var offsetX = 0;
        var offsetY = 0;

        if (allFrames) {
            var maxHeight = 0;
            var maxWidth = 0;
            var maxAspectRatio = 0;
            for (var i = 0, len = allFrames.length; i<len; i++) {
                var f = allFrames[i];
                if (f._data)
                    f = f._data;

                maxWidth = Math.max(maxWidth, f.rect[2]);
                maxHeight = Math.max(maxHeight, f.rect[3]);
                maxAspectRatio = Math.max(maxAspectRatio, f.rect[2] * atlasImage.width / (f.rect[3] * atlasImage.height));
            }

            maxWidth *= atlasImage.width;
            maxHeight *= atlasImage.height;

            var previewMaxWidth, previewMaxHeight;

            if (width / maxAspectRatio > height || maxWidth < maxHeight) {
                targetHeight = height * h / maxHeight;
                targetWidth = targetHeight * aspectRatio;

                previewMaxHeight = height;
                previewMaxWidth = Math.min(height * maxWidth / maxHeight, width);
            } else {
                targetWidth = width * w / maxWidth;
                targetHeight = targetWidth / aspectRatio;

                previewMaxWidth = width;
                previewMaxHeight = Math.min(width / (maxWidth / maxHeight), height);
            }

            offsetX = (width - previewMaxWidth) / 2 + (previewMaxWidth - targetWidth) * frame.pivot[0];
            offsetY = (height - previewMaxHeight) / 2 + (previewMaxHeight - targetHeight) * (1 - frame.pivot[1]);

        } else {
            if (w >= h) {
                targetHeight = width / aspectRatio;
            } else {
                targetWidth = height * aspectRatio;
            }

            offsetX = (width - targetWidth) / 2;
            offsetY = (height - targetHeight) / 2;
        }


        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(atlasImage, x, y, w, h, offsetX, offsetY, targetWidth, targetHeight);
    });

    var selectSprite = function (asset, options) {
        if (options && options.history) {
            var prevSprite = spriteAsset;
            var newSprite = asset;
            var selectedFrames = selected && ! prevSprite ? highlightedFrames : null;

            var redo = function () {
                spriteAsset = asset;
                if (spriteAsset) {
                    selectFrames(spriteAsset.getRaw('data.frameKeys'));
                } else {
                    selectFrames(null);
                }
            };

            var undo = function () {
                spriteAsset = prevSprite;
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
            spriteAsset = asset;
            if (spriteAsset) {
                selectFrames(spriteAsset.getRaw('data.frameKeys'));
            } else {
                selectFrames(null);
            }
        }
    };

    editor.method('picker:sprites:editor:selectSprite', function (asset, options) {
        if (overlay.hidden) return;

        selectSprite(asset, options);
    });

    // Create sprite asset from selected frames
    editor.method('picker:sprites:editor:spriteFromSelection', function (fn) {
        if (overlay.hidden) return;

        if (! highlightedFrames.length )
            return;

        editor.call('assets:create:sprite', {
            pixelsPerUnit: 100,
            frameKeys: highlightedFrames,
            textureAtlasAsset: atlasAsset.get('id'),
            noSelect: true,
            fn: function (err, id) {
                var asset = editor.call('assets:get', id);
                if (asset) {
                    selectSprite(asset);
                    if (fn) {
                        fn(asset);
                    }
                } else {
                    editor.once('assets:add[' + id + ']', function (asset) {
                        selectSprite(asset);
                        if (fn) {
                            fn(asset);
                        }
                    });
                }
            }
        });
    });

    editor.method('picker:sprites:editor:pickFrames', function () {
        if (spriteEditMode) return;

        var redo = function () {
            overlayPickFrames.hidden = false;
        };

        var undo = function () {
            overlayPickFrames.hidden = true;
        };

        editor.call('history:add', {
            name: 'add frames',
            undo: undo,
            redo: redo
        });

        redo();
    });

    // Adds picked frames to sprite asset and exits sprite edit mode
    editor.method('picker:sprites:editor:pickFrames:add', function () {
        if (! spriteAsset) return;

        var length = newSpriteFrames.length;
        if (length) {
            var keys = spriteAsset.get('data.frameKeys');
            keys = keys.concat(newSpriteFrames);
            spriteAsset.set('data.frameKeys', keys);
        }

        overlayPickFrames.hidden = true;
    });

    // Exits sprite edit mode
    editor.method('picker:sprites:editor:pickFrames:cancel', function () {
        overlayPickFrames.hidden = true;
    });

    overlayPickFrames.on('show', function () {
        spriteEditMode = true;
        panel.class.add('select-frames-mode');
        editor.emit('picker:sprites:editor:pickFrames:start');
    });

    overlayPickFrames.on('hide', function () {
        panel.class.remove('select-frames-mode');

        spriteEditMode = false;
        newSpriteFrames.length = 0;
        queueRender();

        editor.emit('picker:sprites:editor:pickFrames:end');
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
