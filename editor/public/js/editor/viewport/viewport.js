editor.once('load', function () {
    'use strict';

    const canvas = new ui.Canvas({
        id: 'canvas-3d',
        useDevicePixelRatio: true
    });

    let keepRendering = false;

    const editorSettings = editor.call('settings:projectUser');
    const Application = editor.call('viewport:application');

    // Allow anti-aliasing to be forcibly disabled - this is useful for Selenium tests in
    // order to ensure that the generated screenshots are consistent across different GPUs.
    const disableAntiAliasing = /disableAntiAliasing=true/.test(location.search);

    // create playcanvas application
    let app;
    try {
        app = new Application(canvas.element, {
            mouse: new pc.Mouse(canvas.element),
            touch: !!('ontouchstart' in window) ? new pc.TouchDevice(canvas.element) : null,
            editorSettings: editorSettings.json().editor,
            graphicsDeviceOptions: {
                antialias: !disableAntiAliasing,
                alpha: false
            }
        });

        app.enableBundles = false;
    } catch (ex) {
        editor.emit('viewport:error', ex);
        return;
    }

    editorSettings.on('*:set', function () {
        app.setEditorSettings(editorSettings.json().editor);
    });


    // add canvas
    editor.call('layout.viewport').prepend(canvas);

    // get canvas
    editor.method('viewport:canvas', function () {
        return canvas;
    });

    // get app
    editor.method('viewport:app', function () {
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
