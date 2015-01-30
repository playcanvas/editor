editor.once('load', function() {
    'use strict'

    var canvas = new ui.Canvas({
        id: 'canvas-3d'
    });
    canvas.style.width = '100%';

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

    var frameSelection = false;

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

    // update user camera transform
    editor.method('viewport:saveCamera', function (options) {
        // TODO
    });

    editor.method('viewport:frameSelectionStart', function () {
        frameSelection = true;
    });

    editor.method('viewport:frameSelectionEnd', function () {
        frameSelection = false;
    });

    // returns true if the viewport should continuously render
    editor.method('viewport:keepRendering', function () {
        // return true if we are in the middle of framing a selection
        if (frameSelection) {
            return true;
        }

        return false;
    });

    // Returns true if an entity with the specifid component is selected
    editor.method('selector:hasComponent', function (component) {
        var selection = editor.call('selector:items');
        if (selection.filter(function (item) {
            return  item.components &&
                    item.components[component] &&
                    item.components[component].enabled &&
                    item.enabled;
        }).length) {
            return true;
        }
    })

    editor.on('selector:add', function(entity, type) {
        if (type === 'entity') {
            framework.selectEntity(entity.resource_id);
        }
    });

    editor.on('selector:remove', function(entity, type) {
        if (type === 'entity') {
            framework.deselectEntity();
        }
    });

    // start framework
    framework.start();
});
