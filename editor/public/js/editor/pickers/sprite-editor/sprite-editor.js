editor.once('load', function() {
    'use strict';

    var knobWidth = 5;
    // In this order: top left, top, top right, left, right, bottom left, bottom, bottom right
    var widthWeights = [0, 0.5, 1, 0, 1, 0, 0.5, 1];
    var heightWeights = [0, 0, 0, 0.5, 0.5, 1, 1, 1];
    var leftOffsets = [-1, -0.5, 0, -1, 0, -1, -0.5, 0];
    var topOffsets = [-1, -1, -1, -0.5, -0.5, 0, 0, 0];

    var atlasAsset;
    var spriteAsset;
    var atlasImage = new Image();

    var editing = false;
    var panning = false;
    var newFrame;
    var selectedFrame;
    var selectedKnob;
    var frames = [];

    var resizeInterval = null;
    var pivotX = 0;
    var pivotY = 0;
    var pivotOffsetX = 0;
    var pivotOffsetY = 0;
    var zoomOffsetX = 0;
    var zoomOffsetY = 0;
    var zoomX = 0;
    var zoomY = 0;
    var prevMouseX = 0;
    var prevMouseY = 0;
    var mouseX = 0;
    var mouseY = 0;
    var aspectRatio = 1;
    var canvasRatio = 1;

    var queuedRender = false;

    var KNOB = {
        NONE: -1,
        TOP_LEFT: 0,
        TOP: 1,
        TOP_RIGHT: 2,
        LEFT: 3,
        RIGHT: 4,
        BOTTOM_LEFT: 5,
        BOTTOM: 6,
        BOTTOM_RIGHT: 7,
    };

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
        overlay.hidden = true;
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
    var rightPanel;

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

    // Canvas Control Observer (for zoom/brightness).
    var canvasControlObserver = new Observer({
        zoom: 100,
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
        precision: 1,
        placeholder: '%',
    });
    zoomField.link(canvasControlObserver, 'zoom');
    zoomControl.append(zoomField);
    var zoomSlider = new ui.Slider({
        min: 1,
        max: 400,
        precision: 1,
    });
    zoomSlider.link(canvasControlObserver, 'zoom');
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
    brightnessField.link(canvasControlObserver, 'brightness');
    brightnessControl.append(brightnessField);
    var brightnessSlider = new ui.Slider({
        min: 0,
        max: 100,
        precision: 1,
    });
    brightnessSlider.link(canvasControlObserver, 'brightness');
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

        aspectRatio = atlasImage.width / atlasImage.height;
        canvasRatio = canvas.width / canvas.height;

        return result;
    };

    var renderFrame = function(frame) {
        if (frame.highlighted) {
            ctx.fillStyle = '#2C393C';
            for (var i = 0; i < 8; i++) {
                ctx.fillRect(frame.left + knobWidth * leftOffsets[i] + frame.width * widthWeights[i],
                             frame.top + knobWidth * topOffsets[i] + frame.height * heightWeights[i],
                             knobWidth,
                             knobWidth);
            }
            ctx.strokeStyle = '#2C393C';
            ctx.lineWidth = 2;
            ctx.strokeRect(frame.left, frame.top, frame.width, frame.height);
        } else {
            ctx.strokeStyle = '#49585c';
            ctx.lineWidth = 1;
            ctx.strokeRect(frame.left - 0.5, frame.top - 0.5, frame.width, frame.height);
        }
    };

    var resetControls = function () {
        pivotX = 0;
        pivotY = 0;
        pivotOffsetX = 0;
        pivotOffsetY = 0;
        zoomOffsetX = 0;
        zoomOffsetY = 0;
        zoomX = 0;
        zoomY = 0;
        canvasControlObserver.set('zoom', 100);
    };

    window.addEventListener('keydown', function (e) {
        if (overlay.hidden) return;

        // on 'F' reset viewport
        if (e.keyCode === 70) {
            resetControls();
            queueRender();
        }
    });

    // Canvas Mouse Events
    canvas.element.addEventListener('mousedown', function (e) {
        if (e.button === 0 && ! panning) {
            panning = true;
            canvasPanel.class.add('panning');
            mouseX = e.clientX;
            mouseY = e.clientY;
            prevMouseX = mouseX;
            prevMouseY = mouseY;
        }

        if (! editing) return;

        var p = windowToCanvas(e.clientX, e.clientY);
        if (!newFrame) {
            if (selectedFrame) {
                var knob = knobsHitTest(selectedFrame, p);
                if (knob != KNOB.NONE) {
                    selectedKnob = knob;
                    return;
                }
                selectedFrame.highlighted = false;
                selectedFrame = null;
                selectedKnob = knob;
            }
            var frame = framesHitTest(frames, p);
            if (frame) {
                selectedFrame = frame;
                selectedFrame.highlighted = true;
            } else {
                newFrame = {};
                newFrame.highlighted = true;
                newFrame.firstPoint = p;
                newFrame.secondPoint = p;
                updateNewFrame(newFrame);
                frames.push(newFrame);
            }
        } else {
            newFrame.secondPoint = p;
            updateNewFrame(newFrame);
            delete newFrame.firstPoint;
            delete newFrame.secondPoint;
            selectedFrame = newFrame;
            newFrame = null;
        }
        queueRender();
        updateRightPanel();
    });
    window.addEventListener('mouseup', function (e) {
        if (overlay.hidden) return;

        if (panning) {
            if (e.button === 0) {
                pivotX += pivotOffsetX;
                pivotY += pivotOffsetY;
                pivotOffsetX = 0;
                pivotOffsetY = 0;
                panning = false;
                canvasPanel.class.remove('panning');
            }
        }

        if (editing) {
            var p = windowToCanvas(e.clientX, e.clientY);
            if (selectedKnob != KNOB.NONE) {
                selectedKnob = KNOB.NONE;
                if (selectedFrame.width < 0) {
                    selectedFrame.left += selectedFrame.width;
                    selectedFrame.width = -selectedFrame.width;
                }
                if (selectedFrame.height < 0) {
                    selectedFrame.top += selectedFrame.height;
                    selectedFrame.height = -selectedFrame.height;
                }
                queueRender();
            }
        }
    });
    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (editing) {
            var p = windowToCanvas(mouseX, mouseY);
            if (newFrame) {
                newFrame.secondPoint = p;
                updateNewFrame(newFrame);
                queueRender();
            } else if (selectedKnob != KNOB.NONE) {
                switch (selectedKnob) {
                    case KNOB.TOP_LEFT: {
                        selectedFrame.width -= p.x - selectedFrame.left;
                        selectedFrame.left = p.x;
                        selectedFrame.height -= p.y - selectedFrame.top;
                        selectedFrame.top = p.y;
                        break;
                    }
                    case KNOB.TOP: {
                        selectedFrame.height -= p.y - selectedFrame.top;
                        selectedFrame.top = p.y;
                        break;
                    }
                    case KNOB.TOP_RIGHT: {
                        selectedFrame.width = p.x - selectedFrame.left;
                        selectedFrame.height -= p.y - selectedFrame.top;
                        selectedFrame.top = p.y;
                        break;
                    }
                    case KNOB.LEFT: {
                        selectedFrame.width -= p.x - selectedFrame.left;
                        selectedFrame.left = p.x;
                        break;
                    }
                    case KNOB.RIGHT: {
                        selectedFrame.width = p.x - selectedFrame.left;
                        break;
                    }
                    case KNOB.BOTTOM_LEFT: {
                        selectedFrame.width -= p.x - selectedFrame.left;
                        selectedFrame.left = p.x;
                        selectedFrame.height = p.y - selectedFrame.top;
                        break;
                    }
                    case KNOB.BOTTOM: {
                        selectedFrame.height = p.y - selectedFrame.top;
                        break;
                    }
                    case KNOB.BOTTOM_RIGHT: {
                        selectedFrame.width = p.x - selectedFrame.left;
                        selectedFrame.height = p.y - selectedFrame.top;
                        break;
                    }
                }
                queueRender();
            }
        } else if (panning) {
            pivotOffsetX = (mouseX - prevMouseX) / canvas.width;
            pivotOffsetY = (mouseY - prevMouseY) / canvas.height;
            queueRender();
        }

    });

    var imageWidth = function () {
        return canvasRatio > aspectRatio ? canvas.height * aspectRatio : canvas.width;
    };

    var imageHeight = function () {
        return canvasRatio <= aspectRatio ? canvas.width / aspectRatio : canvas.height;
    };

    var imageLeft = function () {
        return (pivotX + pivotOffsetX + zoomX + zoomOffsetX) * canvas.width;
    };

    var imageTop = function () {
        return (pivotY + pivotOffsetY + zoomY + zoomOffsetY) * canvas.height;
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

        var zoom = canvasControlObserver.get('zoom');
        var sign = wheel < 0 ? -1 : 1;
        var newZoom = Math.max(1, zoom + wheel * wheel * sign);
        canvasControlObserver.set('zoom', newZoom);
    };

    canvas.element.addEventListener("mousewheel", onWheel); // WekKit
    canvas.element.addEventListener("DOMMouseScroll", onWheel); // Gecko

    // Create/Edit Frame Button
    var editFrameButton = new ui.Button({
        text: 'Create/Edit Frames',
    });
    editFrameButton.class.add('edit-frame-button');
    canvasPanel.append(editFrameButton);

    var startFrameEditingMode = function() {
        editing = true;
        editFrameButton.text = 'Done Editing';
        updateRightPanel();
    };

    var stopFrameEditingMode = function() {
        editing = false;
        if (selectedFrame) {
            selectedFrame.highlighted = false;
            selectedFrame = null;
            selectedKnob = KNOB.NONE;
        }
        editFrameButton.text = 'Create/Edit Frames';
        queueRender();
        updateRightPanel();
    };

    canvasControlObserver.on('zoom:set', function (value, oldValue) {
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
        if (queuedRender) return;
        queuedRender = true;
        requestAnimationFrame(renderCanvas);
    };

    var renderCanvas = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var zoom = canvasControlObserver.get('zoom') / 100;

        // draw image
        ctx.drawImage(
            atlasImage,
            0, 0,
            atlasImage.width, atlasImage.height,
            imageLeft(), imageTop(), zoom * imageWidth(), zoom * imageHeight()
        );

        // draw frames
        frames.forEach(renderFrame);

        queuedRender = false;
    };


    var updateRightPanel = function() {
        if (editing) {
            editor.call('picker:sprites:attributes:frameedit');

            if (selectedFrame) {
                editor.call('picker:sprites:attributes:frame', selectedFrame);
            }
        } else {
            editor.call('picker:sprites:attributes:atlas', atlasAsset);
            editor.call('picker:sprites:attributes:sprite-assets');
        }
    };

    var updateNewFrame = function(newFrame) {
        if (!newFrame || !newFrame.firstPoint || !newFrame.secondPoint) {
            return;
        }
        newFrame.left = Math.min(newFrame.firstPoint.x, newFrame.secondPoint.x);
        newFrame.top = Math.min(newFrame.firstPoint.y, newFrame.secondPoint.y);
        newFrame.width = Math.max(newFrame.firstPoint.x, newFrame.secondPoint.x) - newFrame.left;
        newFrame.height = Math.max(newFrame.firstPoint.y, newFrame.secondPoint.y) - newFrame.top;
    };

    var framesHitTest = function(frames, p) {
        var frameToReturn = null;
        frames.forEach(function(frame) {
            if (rectContainsPoint(p, frame.left, frame.top, frame.width, frame.height)) {
                frameToReturn = frame;
            }
        });
        return frameToReturn;
    };

    var rectContainsPoint = function(p, left, top, width, height) {
        return left <= p.x && left + width >= p.x && top <= p.y && top + height >= p.y;
    };


    var knobsHitTest = function(frame, p) {
        var knobWidth = 5;
        var widthWeights = [0, 0.5, 1, 0, 1, 0, 0.5, 1];
        var heightWeights = [0, 0, 0, 0.5, 0.5, 1, 1, 1];
        var leftOffsets = [-1, -0.5, 0, -1, 0, -1, -0.5, 0];
        var topOffsets = [-1, -1, -1, -0.5, -0.5, 0, 0, 0];

        for (var i in KNOB) {
            var knob = KNOB[i];
            if (knob < 0) {
                continue;
            }
            if (rectContainsPoint(p,
                                  frame.left + knobWidth * leftOffsets[knob] + frame.width * widthWeights[knob],
                                  frame.top + knobWidth * topOffsets[knob] + frame.height * heightWeights[knob],
                                  knobWidth,
                                  knobWidth)) {
                return knob;
            }
        }
        return KNOB.NONE;
    };

    editFrameButton.on('click', function () {
        if (editing) {
            stopFrameEditingMode();
        } else {
            startFrameEditingMode();
        }
    });

    // call picker
    editor.method('picker:sprites:editor', function (asset) {
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

        atlasImage.onload = function () {
            renderCanvas();
        };
        atlasImage.src = atlasAsset.get('file.url') + '?t=' + atlasAsset.get('file.hash');

        editing = false;
        newFrame = null;
        selectedFrame = null;
        selectedKnob = KNOB.NONE;

        frames.length = 0;

        // resize 20 times a second - if size is the same nothing will happen
        if (resizeInterval) {
            clearInterval(resizeInterval);
        }
        resizeInterval = setInterval(function() {
            if (resizeCanvas()) {
                queueRender();
            }
        }, 1000 / 60);

        updateRightPanel();

        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    editor.method('picker:sprites:editor:attributesPanel', function() {
        return rightPanel;
    });

    editor.method('picker:sprites:editor:addAttributesPanel', function(args) {
        if (rightPanel) {
            panel.remove(rightPanel);
        }
        rightPanel = new ui.Panel(args.title);
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
        return rightPanel;
    });

    // close picker
    editor.method('picker:sprites:editor:close', function() {
        overlay.hidden = true;
    });

    overlay.on('hide', function () {
        // reset controls
        canvasControlObserver.set('zoom', 100);
        canvasControlObserver.set('brightness', 100);

        resetControls();

        if (resizeInterval) {
            clearInterval(resizeInterval);
            resizeInterval = null;
        }
    });
});
