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

    var queueSettings = false;
    var sceneSettings;

    var skyboxOnLoad = function(asset) {
        if (asset.resources) {
            scene.setSkybox(asset.resources);
            scene.skybox = null;
            editor.emit('preview:scene:changed');
        }
    };
    var skyboxAsset;

    editor.method('preview:skybox', function() {
        return skyboxAsset;
    });

    app._onSkyboxChangeOld = app._onSkyboxChange;
    app._onSkyboxChange = function(asset) {
        skyboxOnLoad(asset);
        app._onSkyboxChangeOld(asset);
    };

    app._skyboxLoadOld = app._skyboxLoad;
    app._skyboxLoad = function(asset) {
        app._skyboxLoadOld.call(this, asset);

        if (skyboxAsset)
            app.off('load:' + skyboxAsset.id, skyboxOnLoad);

        skyboxAsset = asset;
        app.on('load:' + skyboxAsset.id, skyboxOnLoad);

        skyboxOnLoad(asset);
    };

    app._skyboxRemoveOld = app._skyboxRemove;
    app._skyboxRemove = function(asset) {
        app._skyboxRemoveOld.call(this, asset);

        if (skyboxAsset && skyboxAsset.id === asset.id) {
            app.off('load:' + skyboxAsset.id, skyboxOnLoad);
            skyboxAsset = null;
            scene.setSkybox(null);
            editor.emit('preview:scene:changed');
        }
    };

    var applySettings = function() {
        queueSettings = false;
        var settings = sceneSettings.json();

        scene.ambientLight.set(settings.render.global_ambient[0], settings.render.global_ambient[1], settings.render.global_ambient[2]);
        scene.gammaCorrection = settings.render.gamma_correction;
        scene.toneMapping = settings.render.tonemapping;
        scene.exposure = settings.render.exposure;
        scene.skyboxIntensity = settings.render.skyboxIntensity === undefined ? 1 : settings.render.skyboxIntensity;

        editor.emit('preview:scene:changed');
    };

    var queueApplySettings = function() {
        if (queueSettings)
            return;

        queueSettings = true;
        requestAnimationFrame(applySettings);
    };

    editor.on('sceneSettings:load', function(settings) {
        sceneSettings = settings;
        sceneSettings.on('*:set', applySettings);
        queueApplySettings();
    });


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

        return target;
    });

    editor.method('preview:render', function(asset, width, height, args, blob) {
        var gl = app.graphicsDevice.gl;

        // choose closest POT resolution
        width = nextPow2(width || 128);
        height = nextPow2(height || width);

        // get render target
        var target = editor.call('preview:getTexture', width, height);

        // render
        editor.call('preview:' + asset.get('type') + ':render', asset, target, args);

        canvas.width = width;
        canvas.height = height;

        // read pixels from texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, target._glFrameBuffer);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, target.pixels);

        // mage image data
        var imageData = new ImageData(target.pixelsClamped, width, height);

        if (blob) {
            // upload to canvas
            ctx.putImageData(imageData, 0, 0);
            return canvas.toDataURL();
        } else {
            return imageData;
        }
    });
});
