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

    // Canvas control
    var canvasControl = new ui.Panel();
    canvasControl.class.add('canvas-control');

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
