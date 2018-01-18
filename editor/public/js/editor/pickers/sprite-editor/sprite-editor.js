editor.once('load', function() {
    'use strict';

    // In this order: top left, top, top right, left, right, bottom left, bottom, bottom right
    var widthWeights = [0, 0.5, 1, 0, 1, 0, 0.5, 1];
    var heightWeights = [0, 0, 0, 0.5, 0.5, 1, 1, 1];
    var leftOffsets = [-1, -0.5, 0, -1, 0, -1, -0.5, 0];
    var topOffsets = [-1, -1, -1, -0.5, -0.5, 0, 0, 0];
    var knobWidth = 5;

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

    // left panel
    var leftPanel = new ui.Panel();
    leftPanel.class.add('left-panel');
    leftPanel.flex = true;
    leftPanel.flexGrow = true;
    leftPanel.flexDirection = 'column';
    panel.append(leftPanel);

    // Right panel
    var rightPanel = null;

    // Canvas
    var canvasPanel = new ui.Panel();
    canvasPanel.flexGrow = true;
    canvasPanel.class.add('canvas-panel');
    leftPanel.append(canvasPanel);

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
    leftPanel.append(canvasControl);

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

    var selectFrame = function (key, skipHistory) {
        if (selected && selected.key === key) return;
        if (! key && ! selected) return;

        var prevSelection = selected && selected.key;

        var select = function (newKey, oldKey) {
            selected = null;
            if (oldKey)
                delete highlightedFrames[oldKey];

            if (newKey) {
                var asset = editor.call('assets:get', atlasAsset.get('id'));
                if (! asset) return;

                var frame = null;
                // if key is 'new' then make a new frame
                if (newKey === 'new') {
                    frame = {
                        rect: [0,0,0,0],
                        pivot: [0.5, 0.5]
                    };
                } else {
                    frame = asset.get('data.frames.' + newKey);
                }

                selected = {
                    key: newKey,
                    frame: frame,
                    dirty: false
                };
                highlightedFrames[newKey] = true;
            }

            queueRender();

            updateRightPanel();
        };

        var redo = function () {
            select(key, prevSelection);
        };

        var undo = function () {
            select(prevSelection, key);
        };

        if (! skipHistory) {
            editor.call('history:add', {
                name: 'select frame',
                undo: undo,
                redo: redo
            });

        }

        redo();
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
    };

    var onKeyDown = function (e) {
        if (e.shiftKey) {
            shiftDown = true;
            canvasPanel.class.add('grab');
        }
    };

    var onKeyUp = function (e) {
        if (! e.shiftKey) {
            shiftDown = false;
            canvasPanel.class.remove('grab');
            if (panning) {
                stopPanning();
            }
        }
    };

    var onMouseDown = function (e) {
        if (e.button === 0) {
            leftButtonDown = true;
        } else if (e.button === 2) {
            rightButtonDown = true;
        }

        // start panning with left button and shift
        if (! panning && leftButtonDown && shiftDown) {
            startPanning(e.clientX, e.clientY);
            return;
        }

        var p = windowToCanvas(e.clientX, e.clientY);

        // if a frame is already selected try to select one of its knobs
        if (selected) {
            selected.knob = knobsHitTest(p);
            if (selected.knob) {
                canvasPanel.class.add('grab');
                queueRender();
            }
        }

        // if no knob selected try to select the frame under the cursor
        if (! selected || ! selected.knob) {
            selectFrame(framesHitTest(p));
        }

        // if no frame selected then start a new frame
        if (! selected) {
            selectFrame('new', true);

            // set coords for new frame
            selected.frame.rect[0] = (p.x - imageLeft()) / imageWidth();
            selected.frame.rect[1] = 1 - (p.y - imageTop()) / imageHeight();
            selected.knob = KNOB.BOTTOM_RIGHT;
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
        if (selected && selected.knob) {
            var frame = selected.frame;

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

            switch (selected.knob) {
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

            selected.dirty = true;
            queueRender();
        }
        // if no knob is selected then change cursor if the user hovers over a knob
        else if (selected) {
            var hovered = knobsHitTest(p);
            if (hovered) {
                canvasPanel.class.add('grab');
            } else {
                canvasPanel.class.remove('grab');
            }
        }

    };

    var onMouseUp = function (e) {
        if (e.button === 0) {
            leftButtonDown = false;
        } else if (e.button === 1) {
            rightButtonDown = false;
        }

        // stop panning
        if (panning && ! leftButtonDown) {
            stopPanning();
        }

        // if we have edited the selected frame then commit the changes
        if (selected) {
            // clear selected knob
            if (selected.knob) {
                selected.knob = null;
                queueRender();
            }

            if (selected.dirty) {
                commitFrameChanges();
                selected.dirty = false;
            } else {
                if (selected.key === 'new') {
                    selectFrame(null, true);
                }
            }
        }

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
        canvasPanel.class.add('grabbing');
    };

    var stopPanning = function () {
        panning = false;
        pivotX += pivotOffsetX;
        pivotY += pivotOffsetY;
        pivotOffsetX = 0;
        pivotOffsetY = 0;
        canvasPanel.class.remove('grabbing');
    };

    var commitFrameChanges = function () {
        var key = selected.key;

        // if key is 'new' then turn it into a real frame key
        // by picking the largest available frame number
        if (key === 'new') {

            // make sure width / height are positive
            if (selected.frame.rect[2] < 0) {
                selected.frame.rect[2] = Math.max(1 / atlasImage.width, -selected.frame.rect[2]);
                selected.frame.rect[0] -= selected.frame.rect[2];
            }

            if (selected.frame.rect[3] < 0) {
                selected.frame.rect[3] = Math.max( 1 / atlasImage.height, -selected.frame.rect[3]);
                selected.frame.rect[1] -= selected.frame.rect[3];
            }

            var max = 0;
            for (var existingKey in atlasAsset.get('data.frames')) {
                max = Math.max(parseInt(existingKey, 10), max);
            }
            key = (max + 1).toString();

            // update key on selected frame and highlightedFrames
            selected.key = key;
            delete highlightedFrames['new'];
            highlightedFrames[key] = true;
        }

        var oldValue = atlasAsset.get('data.frames.' + key);
        var newValue = {
            rect: selected.frame.rect.slice(),
            pivot: selected.frame.pivot.slice()
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
            if (oldValue) {
                asset.set('data.frames.' + key, oldValue);
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
        for (var key in frames) {
            if (highlightedFrames[key]) continue;

            renderFrame(frames[key], left, top, width, height, false);
        }

        // draw highlighted frames
        for (var key in highlightedFrames) {
            if (selected && selected.key === key) continue;

            renderFrame(frames[key], left, top, width, height, true);
        }

        // draw newFrame or selected frame
        if (newFrame) {
            renderFrame(newFrame, left, top, width, height, true);
        } else if (selected) {
            renderFrame(selected.frame, left, top, width, height, true);
        }
    };

    var renderFrame = function (frame, left, top, width, height, highlighted) {
        var w = frameWidth(frame, width);
        var h = frameHeight(frame, height);

        if (! w && ! h) return;

        var x = frameLeft(frame, left, width);
        var y = frameTop(frame, top, height);

        if (highlighted) {
            ctx.fillStyle = '#2C393C';
            for (var i = 0; i < 8; i++) {
                ctx.fillRect(x + knobWidth * leftOffsets[i] + w * widthWeights[i],
                             y + knobWidth * topOffsets[i] + h * heightWeights[i],
                             knobWidth,
                             knobWidth);
            }
            ctx.strokeStyle = '#2C393C';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        } else {
            ctx.strokeStyle = '#B1B8BA';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 0.5, y - 0.5, w, h);
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


        if (selected) {
            editor.call('picker:sprites:attributes:frame', selected.frame);
        } else {
            editor.call('picker:sprites:attributes:atlas', atlasAsset);
            editor.call('picker:sprites:attributes:slice');
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
            renderCanvas();
        };
        atlasImage.src = atlasAsset.get('file.url') + '?t=' + atlasAsset.get('file.hash');

        selected = null;

        // listen to atlas changes and render
        events.push(atlasAsset.on('*:set', function (path, value, oldValue, remote) {
            if (! /^data\.frames.*/.test(path)) return;

            var parts = path.split('.');

            // update selected frame coords
            if (selected && parts.length >= 2 && parts[2] === selected.key) {
                selected.frame = atlasAsset.get('data.frames.' + selected.key);
            }

            // make sure new frame is selected
            if (! remote)
                selectFrame(parts[2], true);

            queueRender();
        }));

        events.push(atlasAsset.on('*:unset', function (path) {
            if (! /^data\.frames\.\d+$/.test(path)) return;

            // if the selected frame was deleted then reset the selected frame
            if (selected) {
                var parts = path.split('.');
                if (selected.key === parts[2]) {
                    selectFrame(null, true);
                }
            }

            queueRender();
        }));

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

        selected = null;
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

    // Return right panel
    editor.method('picker:sprites:editor:attributesPanel', function() {
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
