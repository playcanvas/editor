editor.once('load', function() {
    'use strict'

    var canvas = new ui.Canvas({
        id: 'canvas-3d'
    });

    canvas.style.width = "100%";

    var container = editor.call('layout.viewport');

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

    function resize () {
        setTimeout(function () {
            var w = container.element.offsetWidth;
            var h = container.element.offsetHeight;
            canvas.element.setAttribute('width', w);
            canvas.element.setAttribute('height', h);
            framework.resize(w, h);
            framework.redraw = true;
        }, 125);
    }


    // resize canvas if any of the side panels are resized...
    var sidePanels = ['layout.right', 'layout.left', 'layout.assets'];
    sidePanels.forEach(function (panel) {
        panel = editor.call(panel);
        if (panel) {
            panel.on('resize', resize);
            panel.on('fold', resize);
            panel.on('unfold', resize);
        }
    });

    // ... or the window is resized
    window.addEventListener('resize', resize);

    // add canvas
    container.append(canvas);

    // handle mouse / keyboard
    canvas.element.addEventListener('mousedown', framework.handleMouseDown.bind(framework));
    canvas.element.addEventListener('mouseup', framework.handleMouseUp.bind(framework));
    canvas.element.addEventListener('mousemove', framework.handleMouseMove.bind(framework));

    // methods

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

    resize();

    editor.on('entity:add', function (entity) {
        framework.loadEntity(entity);
        framework.redraw = true;
    });

    editor.on('entities:load', function () {
        var entities = editor.call('entities:list');
        framework.loadScene(entities);
        framework.redraw = true;
    });
});
