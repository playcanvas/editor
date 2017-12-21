editor.once('load', function() {
    'use strict';

    // overlay
    var panel = new ui.Panel();
    panel.class.add('sprite-canvas');

    // Canvas
    var canvas = new ui.Canvas();
    canvas.class.add('canvas');
    panel.append(canvas);

    var resizeCanvas = function() {
        const width = canvas.element.clientWidth;
        const height = canvas.element.clientHeight;

        // If it's resolution does not match change it
        if (canvas.element.width !== width || canvas.element.height !== height) {
            canvas.element.width = width;
            canvas.element.height = height;
        }
    };

    // Canvas Context
    var ctx = canvas.element.getContext("2d");

    // Canvas Control Observer (for zoom/brightness).
    var canvasControlObserver = new Observer();

    // Canvas control
    var canvasControl = new ui.Panel();
    canvasControl.flex = true;
    canvasControl.flexDirection = 'row';
    canvasControl.class.add('canvas-control');

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
        min: 0,
        max: 100,
        precision: 1,
        placeholder: '%',
    });
    zoomField.link(canvasControlObserver, 'zoom');
    zoomControl.append(zoomField);
    var zoomSlider = new ui.Slider({
        min: 0,
        max: 100,
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

    canvasControlObserver.set('zoom', 50);
    canvasControlObserver.set('brightness', 100);

    var windowToCanvas = function(windowX, windowY) {
        var rect = canvas.element.getBoundingClientRect();
        return {
            x: Math.round(windowX - rect.left),
            y: Math.round(windowY - rect.top),
        }
    };

    var knobWidth = 5;
    // In this order: top left, top, top right, left, right, bottom left, bottom, bottom right
    var widthWeights = [0, 0.5, 1, 0, 1, 0, 0.5, 1];
    var heightWeights = [0, 0, 0, 0.5, 0.5, 1, 1, 1];
    var leftOffsets = [-1, -0.5, 0, -1, 0, -1, -0.5, 0];
    var topOffsets = [-1, -1, -1, -0.5, -0.5, 0, 0, 0];

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
            ctx.strokeStyle = '#B1B8BA';
            ctx.lineWidth = 1;
            ctx.strokeRect(frame.left - 0.5, frame.top - 0.5, frame.width, frame.height);
        }
    };

    // Canvas Mouse Events
    canvas.element.addEventListener('mousedown', function (e) {
        panel.emit('mousedown', windowToCanvas(e.clientX, e.clientY));
    });
    canvas.element.addEventListener('mouseup', function (e) {
        panel.emit('mouseup', windowToCanvas(e.clientX, e.clientY));
    });
    canvas.element.addEventListener('mousemove', function (e) {
        panel.emit('mousemove', windowToCanvas(e.clientX, e.clientY));
    });

    editor.method('picker:sprites:canvas:root', function() {
        return panel;
    });

    editor.method('picker:sprites:canvas:control', function() {
        return canvasControl;
    });

    editor.method('picker:sprites:canvas:reset', function() {
        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    editor.method('picker:sprites:canvas:draw', function(spriteImage, frames) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(spriteImage, 0, 0);

        frames.forEach(renderFrame);
    });
});
