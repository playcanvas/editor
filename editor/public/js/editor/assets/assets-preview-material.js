editor.once('load', function () {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var pitch = 0;
    var yaw = 0;

    var layerComposition = editor.call('preview:layerComposition');
    var layer = editor.call('preview:layer');

    // material parser
    var materialParser = new pc.JsonStandardMaterialParser();

    // material
    var material = new pc.StandardMaterial();

    var PREFILTERED_CUBEMAP_PROPERTIES = [
        'prefilteredCubeMap128',
        'prefilteredCubeMap64',
        'prefilteredCubeMap32',
        'prefilteredCubeMap16',
        'prefilteredCubeMap8',
        'prefilteredCubeMap4'
    ];

    // sphere
    var sphere = new pc.Entity();
    sphere.addComponent('model', {
        type: 'sphere',
        layers: []
    });
    sphere.model.material = material;

    // box
    var box = new pc.Entity();
    box.addComponent('model', {
        type: 'box',
        layers: []
    });
    box.setLocalScale(0.6, 0.6, 0.6);
    box.model.material = material;

    // light
    var lightEntity = new pc.Entity();
    lightEntity.addComponent('light', {
        type: 'directional',
        layers: []
    });
    lightEntity.setLocalEulerAngles(45, 45, 0);

    // camera
    var cameraOrigin = new pc.GraphNode();

    var cameraEntity = new pc.Entity();
    cameraEntity.addComponent('camera', {
        nearClip: 0.1,
        farClip: 32,
        clearColor: new pc.Color(41 / 255, 53 / 255, 56 / 255, 0.0),
        frustumCulling: false,
        layers: []
    });
    cameraEntity.setLocalPosition(0, 0, 1.35);
    cameraOrigin.addChild(cameraEntity);

    // All preview objects live under this root
    var previewRoot = new pc.Entity();
    previewRoot._enabledInHierarchy = true;
    previewRoot.enabled = true;
    previewRoot.addChild(box);
    previewRoot.addChild(sphere);
    previewRoot.addChild(lightEntity);
    previewRoot.addChild(cameraOrigin);
    previewRoot.syncHierarchy();
    previewRoot.enabled = false;

    editor.method('preview:material:render', function (asset, canvasWidth, canvasHeight, canvas, args) {
        var data = asset.get('data');
        if (! data) return;

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

        if (args.model === 'box') {
            sphere.enabled = false;
            box.enabled = true;
        } else {
            sphere.enabled = true;
            box.enabled = false;
        }

        pitch = args.hasOwnProperty('rotation') ? args.rotation[0] : 0;
        yaw = args.hasOwnProperty('rotation') ? args.rotation[1] : 0;

        cameraOrigin.setLocalEulerAngles(pitch, yaw, 0);

        lightEntity.light.intensity = 1.0 / (Math.min(1.0, app.scene.exposure) || 0.01);

        // migrate material data
        var migrated = materialParser.migrate(data);

        // convert asset references to engine resources
        var i, len, name, engineAsset;

        // handle texture assets
        for (i = 0, len = pc.StandardMaterial.TEXTURE_PARAMETERS.length; i < len; i++) {
            name = pc.StandardMaterial.TEXTURE_PARAMETERS[i];
            if (! migrated.hasOwnProperty(name) || ! migrated[name]) continue;

            engineAsset = app.assets.get(migrated[name]);
            if (! engineAsset || ! engineAsset.resource) {
                migrated[name] = null;
                if (engineAsset) {
                    app.assets.load(engineAsset);
                }
            } else {
                migrated[name] = engineAsset.resource;
            }
        }

        // handle cubemap assets
        for (i = 0, len = pc.StandardMaterial.CUBEMAP_PARAMETERS.length; i < len; i++) {
            name = pc.StandardMaterial.CUBEMAP_PARAMETERS[i];
            if (! migrated.hasOwnProperty(name) || ! migrated[name]) continue;

            engineAsset = app.assets.get(migrated[name]);
            if (! engineAsset) {
                migrated[name] = null;
            } else {
                if (engineAsset.resource) {
                    migrated[name] = engineAsset.resource;
                    if (engineAsset.file && engineAsset.resources && engineAsset.resources.length === 7) {
                        for (var j = 0; j < 6; j++) {
                            migrated[PREFILTERED_CUBEMAP_PROPERTIES[j]] = engineAsset.resources[i + 1];
                        }
                    }
                }

                if (migrated.shadingModel === pc.SPECULAR_PHONG) {
                    // phong based - so ensure we load individual faces
                    engineAsset.loadFaces = true;
                    app.assets.load(engineAsset);
                }
            }
        }

        // re-initialize material with migrated properties
        material.initialize(migrated);

        // set up layer
        layer.addCamera(cameraEntity.camera);
        layer.addLight(lightEntity.light);
        layer.addMeshInstances(sphere.enabled ? sphere.model.meshInstances : box.model.meshInstances);

        // render
        app.renderer.renderComposition(layerComposition);

        // read pixels from texture
        var device = app.graphicsDevice;
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, target._glFrameBuffer);
        device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, target.pixels);

        // render to canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.getContext('2d').putImageData(new ImageData(target.pixelsClamped, width, height), (canvasWidth - width) / 2, (canvasHeight - height) / 2);

        // clean up
        layer.renderTarget = null;
        layer.removeCamera(cameraEntity.camera);
        layer.removeLight(lightEntity.light);
        layer.removeMeshInstances(sphere.enabled ? sphere.model.meshInstances : box.model.meshInstances);
        previewRoot.enabled = false;

    });

});
