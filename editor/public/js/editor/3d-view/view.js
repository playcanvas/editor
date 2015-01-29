editor.once('load', function() {
    'use strict'

    var canvas = new ui.Canvas({
        id: 'canvas-3d'
    });
    canvas.style.width = '100%';

    // var container = editor.call('layout.viewport');
    var settings = editor.call('designerSettings');

    // create designer framework
    var framework = new pc.designer.Designer(canvas.element, {
        mouse: new pc.input.Mouse(canvas.element),
        touch: !!('ontouchstart' in window) ? new pc.input.TouchDevice(canvas.element) : null,
        designerSettings: settings
    });

    settings.on('*:set', function() {
        framework.setDesignerSettings(settings);
    });


    // add canvas
    editor.call('layout.viewport').append(canvas);

    // handle mouse / keyboard
    canvas.element.addEventListener('mousedown', framework.handleMouseDown.bind(framework));
    canvas.element.addEventListener('mouseup', framework.handleMouseUp.bind(framework));
    canvas.element.addEventListener('mousemove', framework.handleMouseMove.bind(framework));

    // methods

    // get canvas
    editor.method('3d:canvas', function() {
        return canvas;
    });

    // get framework
    editor.method('3d:framework', function() {
        return framework;
    });

    // re-render 3d view
    editor.method('3d:render', function () {
        framework.redraw = true;
    });

    // update user camera transform
    editor.method('3d:saveCamera', function (options) {
        // TODO
    });

    // start framework
    framework.start();

    editor.emit('3d:start');
});
