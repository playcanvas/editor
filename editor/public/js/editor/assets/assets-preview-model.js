editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var device = app.graphicsDevice;
    var renderer = app.renderer;
    var scene = editor.call('preview:scene');

    var pitch = -15;
    var yaw = 45;


    // material
    var material = new pc.StandardMaterial();
    material.useSkybox = false;
    material._scene = scene;

    var aabb = new pc.BoundingBox();

    // model
    var modelNode = new pc.GraphNode();

    var meshSphere = pc.createSphere(device, {
        radius: 0,
        latitudeBands: 2,
        longitudeBands: 2
    });

    var modelPlaceholder = new pc.Model();
    modelPlaceholder.node = modelNode;
    modelPlaceholder.meshInstances = [ new pc.MeshInstance(modelNode, meshSphere, material) ];


    // light
    var lightNode = new pc.GraphNode();
    lightNode.setLocalEulerAngles(45, 135, 0);

    var light = new pc.Light();
    light.enabled = true;
    light.type = pc.LIGHTTYPE_DIRECTIONAL;
    light._node = lightNode;


    // camera
    var cameraOrigin = new pc.GraphNode();

    var cameraNode = new pc.GraphNode();
    cameraNode.setLocalPosition(0, 0, 1.35);
    cameraOrigin.addChild(cameraNode);

    var camera = new pc.Camera();
    camera._node = cameraNode;
    camera.nearClip = 0.01;
    camera.farClip = 32;
    camera.clearColor = [ 41 / 255, 53 / 255, 56 / 255, 0.0 ];
    camera.frustumCulling = false;


    editor.method('preview:model:render', function(asset, canvasWidth, canvasHeight, canvas, args) {
        args = args || { };

        var width = canvasWidth;
        var height = canvasHeight;

        if (width > canvasHeight)
            width = canvasHeight;
        else
            height = canvasWidth;

        var target = editor.call('preview:getTexture', width, height);

        camera.aspectRatio = height / width;
        camera.renderTarget = target;

        var data = asset.get('data');
        if (! data) return;

        var modelAsset = app.assets.get(asset.get('id'));
        if (! modelAsset) return;

        var model = modelPlaceholder;

        if (modelAsset._editorPreviewModel)
            model = modelAsset._editorPreviewModel.clone();

        model.lights = [ light ];

        var first = true;

        var i;

        // generate aabb for model
        for(i = 0; i < model.meshInstances.length; i++) {
            // initialize any skin instance
            if (model.meshInstances[i].skinInstance) {
                model.meshInstances[i].skinInstance.updateMatrices(model.meshInstances[i].node);
            }

            model.meshInstances[i].material = material;

            if (first) {
                first = false;
                aabb.copy(model.meshInstances[i].aabb);
            } else {
                aabb.add(model.meshInstances[i].aabb);
            }
        }

        if (first) {
            aabb.center.set(0, 0, 0);
            aabb.halfExtents.set(0.1, 0.1, 0.1);
        }

        material.update();

        scene.addModel(model);

        pitch = args.hasOwnProperty('rotation') ? args.rotation[0] : -15;
        yaw = args.hasOwnProperty('rotation') ? args.rotation[1] : 45;

        var max = aabb.halfExtents.length();
        cameraNode.setLocalPosition(0, 0, max * 2.5);

        cameraOrigin.setLocalPosition(aabb.center);
        cameraOrigin.setLocalEulerAngles(pitch, yaw, 0);
        cameraOrigin.syncHierarchy();

        lightNode.setLocalRotation(cameraOrigin.getLocalRotation());
        lightNode.rotateLocal(90, 0, 0);

        camera.farClip = max * 5.0;

        light.intensity = 1.0 / (Math.min(1.0, scene.exposure) || 0.01);

        renderer.render(scene, camera);

        scene.removeModel(model);

        if (model !== modelPlaceholder)
            model.destroy();

        // read pixels from texture
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, target._glFrameBuffer);
        device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, target.pixels);

        // render to canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.getContext('2d').putImageData(new ImageData(target.pixelsClamped, width, height), (canvasWidth - width) / 2, (canvasHeight - height) / 2);
    });
});
