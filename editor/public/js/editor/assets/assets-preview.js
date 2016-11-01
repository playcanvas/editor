editor.once('load', function () {
    'use strict';

    var app = editor.call('viewport:app');
    var renderTargets = { };
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var scene = new pc.Scene();
    scene.root = new pc.Entity();
    scene.root.name = 'root';
    scene.root._enabledInHierarchy = true;

    var light = new pc.Entity();
    light.name = 'light';
    light.addComponent('light', {
        type: 'directional'
    });
    light.setEulerAngles(45, 45, 0);
    scene.root.addChild(light);


    var nextPow2 = function(size) {
        return Math.pow(2, Math.ceil(Math.log(size) / Math.log(2)));
    };

    editor.method('preview:scene', function() {
        return scene;
    });

    editor.method('preview:getTexture', function(width, height) {
        var target = renderTargets[width + '-' + height];
        if (target) return target;

        var texture = new pc.Texture(app.graphicsDevice, {
            width: width,
            height: height,
            format: pc.PIXELFORMAT_R8_G8_B8_A8
        });

        target = new pc.RenderTarget(app.graphicsDevice, texture);
        renderTargets[width + '-' + height] = target;

        target.buffer = new ArrayBuffer(width * height * 4);
        target.pixels = new Uint8Array(target.buffer);
        target.pixelsClamped = new Uint8ClampedArray(target.buffer);

        console.log('created render target', width, height);

        return target;
    });

    editor.method('preview:render', function(asset, width, height) {
        // choose closest POT resolution
        width = nextPow2(width || 128);
        height = nextPow2(height || width);

        // get render target
        var target = editor.call('preview:getTexture', width, height);

        // render
        editor.call('preview:render:' + asset.get('type'), asset, target);

        canvas.width = width;
        canvas.height = height;

        // read pixels from texture
        var gl = app.graphicsDevice.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, target._glFrameBuffer);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, target.pixels);

        // mage image data
        var imageData = new ImageData(target.pixelsClamped, width, height);

        // upload to canvas
        ctx.putImageData(imageData, 0, 0);

        return canvas.toDataURL();
    });
});
