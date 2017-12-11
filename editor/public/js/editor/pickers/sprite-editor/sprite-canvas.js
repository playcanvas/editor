editor.once('load', function() {
    'use strict';

    // overlay
    var root = new ui.Panel();
    root.class.add('sprite-canvas-root');

    // Canvas
    var canvas = new ui.Canvas();
    canvas.class.add('canvas');
    root.append(canvas);

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

    editor.method('picker:sprites:canvas:root', function() {
        return root;
    });

    editor.method('picker:sprites:canvas:control', function() {
        return canvasControl;
    });

    editor.method('picker:sprites:canvas:reset', function() {
        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    editor.method('picker:sprites:canvas:draw', function(spriteImage) {
        ctx.drawImage(spriteImage, 0, 0);
    });
});
