editor.once('load', function() {
    'use strict'

    var canvas = new ui.Canvas({
        id: 'canvas-3d'
    });

    var keepRendering = false;
    var settings = editor.call('designerSettings');
    var Designer = editor.call('viewport:designer');

    // create designer famework
    var framework = new Designer(canvas.element, {
        mouse: new pc.input.Mouse(canvas.element),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas.element) : null,
        designerSettings: settings.json(),
        graphicsDeviceOptions: {
            alpha: false
        }
    });

    settings.on('*:set', function() {
        framework.setDesignerSettings(settings.json());
    });


    // add canvas
    editor.call('layout.viewport').prepend(canvas);

    // get canvas
    editor.method('viewport:canvas', function() {
        return canvas;
    });

    // get framework
    editor.method('viewport:framework', function() {
        return framework;
    });

    // re-render viewport
    editor.method('viewport:render', function () {
        framework.redraw = true;
    });

    // returns true if the viewport should continuously render
    editor.method('viewport:keepRendering', function (value) {
        if (typeof(value) === 'boolean')
            keepRendering = value;

        return keepRendering;
    });

    editor.method('viewport:flyMode', function () {
        return flyMode;
    });

    framework.start();
    editor.emit('viewport:load', framework);
});
