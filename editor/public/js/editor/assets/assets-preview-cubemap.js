editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var layerComposition = new pc.LayerComposition();

    var layer = new pc.Layer({
        id: LAYERID_SKYBOX,
        enabled: true,
        opaqueSortMode: 0
    });

    layerComposition.push(layer);

    var scene = new pc.Scene();
    scene.layers = layerComposition;

    var pitch = 0;
    var yaw = 0;

    var cubemapPrefiltered = [
        'prefilteredCubeMap128',
        'prefilteredCubeMap64',
        'prefilteredCubeMap32',
        'prefilteredCubeMap16',
        'prefilteredCubeMap8',
        'prefilteredCubeMap4'
    ];


    // camera
    var cameraEntity = new pc.Entity();
    cameraEntity.setLocalPosition(0, 0, 0);
    cameraEntity.addComponent('camera', {
        nearClip: 1,
        farClip: 32,
        clearColor: [0, 0, 0, 1],
        fov: 75,
        frustumCulling: false,
        layers: []
    });

    var lightEntity = new pc.Entity();
    lightEntity.addComponent('light', {
        type: 'directional'
    });

    // All preview objects live under this root
    var previewRoot = new pc.Entity();
    previewRoot._enabledInHierarchy = true;
    previewRoot.enabled = true;
    previewRoot.addChild(cameraEntity);
    previewRoot.addChild(lightEntity);
    previewRoot.syncHierarchy();
    previewRoot.enabled = false;

    var sceneSettings = null;
    editor.on('sceneSettings:load', function (settings) {
        sceneSettings = settings;
    });

    editor.method('preview:cubemap:render', function(asset, canvasWidth, canvasHeight, canvas, args) {
        args = args || { };

        var width = canvasWidth;
        var height = canvasHeight;

        if (width > height)
            width = height;
        else
            height = width;

        var target = editor.call('preview:getTexture', width, height);

        previewRoot.enabled = true;

        cameraEntity.camera.aspectRatio = height / width;
        layer.renderTarget = target;

        pitch = args.hasOwnProperty('rotation') ? args.rotation[0] : 0;
        yaw = args.hasOwnProperty('rotation') ? args.rotation[1] : 0;

        cameraEntity.setLocalEulerAngles(pitch, yaw, 0);

        var engineAsset = app.assets.get(asset.get('id'));

        if (engineAsset && engineAsset.resources) {
            if (scene.skybox !== engineAsset.resources[0]) {
                scene.setSkybox(engineAsset.resources);

                if (engineAsset.file) {
                    scene.skyboxMip = args.hasOwnProperty('mipLevel') ? args.mipLevel : 0;
                } else {
                    scene.skyboxMip = 0;
                }
            }

        } else {
            scene.setSkybox(null);
        }

        if (sceneSettings) {
            var settings = sceneSettings.json();
            scene.ambientLight.set(settings.render.global_ambient[0], settings.render.global_ambient[1], settings.render.global_ambient[2]);
            scene.gammaCorrection = settings.render.gamma_correction;
            scene.toneMapping = settings.render.tonemapping;
            scene.exposure = settings.render.exposure;
            scene.skyboxIntensity = settings.render.skyboxIntensity === undefined ? 1 : settings.render.skyboxIntensity;
        }

        scene._updateSkybox(app.graphicsDevice);

        layer.addCamera(cameraEntity.camera);
        layer.addLight(lightEntity.light);
        app.renderer.renderComposition(layerComposition);

        // read pixels from texture
        var device = app.graphicsDevice;
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, target._glFrameBuffer);
        device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, target.pixels);

        // render to canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.getContext('2d').putImageData(new ImageData(target.pixelsClamped, width, height), (canvasWidth - width) / 2, (canvasHeight - height) / 2);

        layer.removeLight(lightEntity.light);
        layer.removeCamera(cameraEntity.camera);
        layer.renderTarget = null;
        previewRoot.enabled = false;
    });
});
