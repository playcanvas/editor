editor.once('load', function() {
    'use strict'

    var canvas = new ui.Canvas({
        id: 'canvas-3d'
    });

    var keepRendering = false;
    var editorSettings = editor.call('editorSettings');
    var Application = editor.call('viewport:application');

    // create playcanvas application
    var app = new Application(canvas.element, {
        mouse: new pc.input.Mouse(canvas.element),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas.element) : null,
        editorSettings: editorSettings.json(),
        graphicsDeviceOptions: {
            alpha: false
        }
    });

    editorSettings.on('*:set', function() {
        app.setEditorSettings(editorSettings.json());
    });


    // add canvas
    editor.call('layout.viewport').prepend(canvas);

    // get canvas
    editor.method('viewport:canvas', function() {
        return canvas;
    });

    // get app
    editor.method('viewport:app', function() {
        return app;
    });

    // re-render viewport
    editor.method('viewport:render', function () {
        app.redraw = true;
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

    app.start();
    editor.emit('viewport:load', app);
});
