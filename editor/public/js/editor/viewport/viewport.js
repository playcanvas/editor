editor.once('load', function() {
    'use strict'

    var canvas = new ui.Canvas({
        id: 'canvas-3d'
    });

    var settings = editor.call('designerSettings');

    // create designer framework
    var framework = new pc.editor.Designer(canvas.element, {
        mouse: new pc.input.Mouse(canvas.element),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas.element) : null,
        designerSettings: settings.json()
    });

    settings.on('*:set', function() {
        framework.setDesignerSettings(settings.json());
    });


    // add canvas
    editor.call('layout.viewport').prepend(canvas);

    var frameSelection = false;
    var flyMode = false;

    // methods

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

    editor.method('viewport:frameSelectionStart', function () {
        frameSelection = true;
    });

    editor.method('viewport:frameSelectionEnd', function () {
        frameSelection = false;
    });

    editor.method('viewport:flyModeStart', function () {
        flyMode = true;
    });

    editor.method('viewport:flyModeEnd', function () {
        flyMode = false;
    });

    // returns true if the viewport should continuously render
    editor.method('viewport:keepRendering', function () {
        return frameSelection || flyMode;
    });

    editor.method('viewport:flyMode', function () {
        return flyMode;
    });

    // start framework
    framework.start();

    editor.emit('viewport:load', framework);
});
