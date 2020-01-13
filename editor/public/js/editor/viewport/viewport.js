editor.once('load', function() {
    'use strict'

    var canvas = new ui.Canvas({
        id: 'canvas-3d'
    });

    var keepRendering = false;
    var editorSettings = editor.call('settings:projectUser');
    var Application = editor.call('viewport:application');

    var idleFlagTimeoutId = null;
    var idleFlagTimeoutDelay = 250;

    // Allow anti-aliasing to be forcibly disabled - this is useful for Selenium tests in
    // order to ensure that the generated screenshots are consistent across different GPUs.
    var disableAntiAliasing = /disableAntiAliasing=true/.test(location.search);

    // create playcanvas application
    try {
        var app = new Application(canvas.element, {
            mouse: new pc.input.Mouse(canvas.element),
            touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas.element) : null,
            editorSettings: editorSettings.json().editor,
            graphicsDeviceOptions: {
                antialias: !disableAntiAliasing,
                alpha: false
            }
        });

        app.enableBundles = false;
    } catch(ex) {
        editor.emit('viewport:error', ex);
        return;
    }

    editorSettings.on('*:set', function() {
        app.setEditorSettings(editorSettings.json().editor);
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

    function idleTimeout() {
        if (!canvas.class.contains('viewport-idle')) {
            canvas.class.add('viewport-idle');
        }
    }

    // re-render viewport
    editor.method('viewport:render', function () {
        canvas.class.remove('viewport-idle');

        app.redraw = true;

        clearTimeout(idleFlagTimeoutId);
        idleFlagTimeoutId = setTimeout(idleTimeout, idleFlagTimeoutDelay);
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
