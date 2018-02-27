editor.once('load', function () {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var renderTargets = { };

    var layerComposition = new pc.LayerComposition();

    var layer = new pc.Layer({
        id: -1,
        enabled: true,
        opaqueSortMode: 2,
        transparentSortMode: 3
    });

    layerComposition.push(layer);

    app.on('set:skybox', function () {
        editor.emit('preview:scene:changed');
    });

    var onSceneSettingsChange = function () {
        editor.emit('preview:scene:changed');
    };

    editor.on('sceneSettings:load', function(settings) {
        onSceneSettingsChange();
        settings.on('*:set', function () {
            onSceneSettingsChange();
            requestAnimationFrame(onSceneSettingsChange);
        });
    });

    editor.method('preview:layerComposition', function () {
        return layerComposition;
    });

    editor.method('preview:layer', function () {
        return layer;
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

        return target;
    });

    editor.method('preview:render', function(asset, width, height, canvas, args) {
        width = width || 1;
        height = height || 1;

        // render
        editor.call('preview:' + asset.get('type') + ':render', asset, width, height, canvas, args);
    });
});
