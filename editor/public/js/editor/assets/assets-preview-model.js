editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var layerComposition = editor.call('preview:layerComposition');
    var layer = editor.call('preview:layer');

    var pitch = -15;
    var yaw = 45;

    // material
    var material = new pc.StandardMaterial();
    material.useSkybox = false;

    var aabb = new pc.BoundingBox();

    // model
    var modelNode = new pc.GraphNode();

    var meshSphere = pc.createSphere(app.graphicsDevice, {
        radius: 0,
        latitudeBands: 2,
        longitudeBands: 2
    });

    var modelPlaceholder = new pc.Model();
    modelPlaceholder.node = modelNode;
    modelPlaceholder.meshInstances = [ new pc.MeshInstance(modelNode, meshSphere, material) ];


    // light
    var lightEntity = new pc.Entity();
    lightEntity.addComponent('light', {
        type: 'directional'
    });
    lightEntity.setLocalEulerAngles(45, 135, 0);


    // camera
    var cameraOrigin = new pc.Entity();

    var cameraEntity = new pc.Entity();
    cameraEntity.addComponent('camera', {
        nearClip: 0.01,
        farClip: 32,
        clearColor: new pc.Color(41 / 255, 53 / 255, 56 / 255, 0.0),
        frustumCulling: false
    });
    cameraEntity.setLocalPosition(0, 0, 1.35);
    cameraOrigin.addChild(cameraEntity);

    // All preview objects live under this root
    var previewRoot = new pc.Entity();
    previewRoot._enabledInHierarchy = true;
    previewRoot.enabled = true;
    previewRoot.addChild(modelNode);
    previewRoot.addChild(lightEntity);
    previewRoot.addChild(cameraOrigin);
    previewRoot.syncHierarchy();
    previewRoot.enabled = false;

    editor.method('preview:model:render', function(asset, canvasWidth, canvasHeight, canvas, args) {
        args = args || { };

        var width = canvasWidth;
        var height = canvasHeight;

        if (width > canvasHeight)
            width = canvasHeight;
        else
            height = canvasWidth;

        var target = editor.call('preview:getTexture', width, height);

        previewRoot.enabled = true;

        cameraEntity.camera.aspectRatio = height / width;
        layer.renderTarget = target;

        var data = asset.get('data');
        if (! data) return;

        var modelAsset = app.assets.get(asset.get('id'));
        if (! modelAsset) return;

        var model = modelPlaceholder;

        if (modelAsset._editorPreviewModel)
            model = modelAsset._editorPreviewModel.clone();

        model.lights = [ lightEntity.light.light ];

        var first = true;

        var i;

        // initialize any skin instances
        for (i = 0; i < model.skinInstances.length; i++) {
            model.skinInstances[i].updateMatrices();
        }

        // generate aabb for model
        for(i = 0; i < model.meshInstances.length; i++) {
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

        pitch = args.hasOwnProperty('rotation') ? args.rotation[0] : -15;
        yaw = args.hasOwnProperty('rotation') ? args.rotation[1] : 45;

        var max = aabb.halfExtents.length();
        cameraEntity.setLocalPosition(0, 0, max * 2.5);

        cameraOrigin.setLocalPosition(aabb.center);
        cameraOrigin.setLocalEulerAngles(pitch, yaw, 0);
        cameraOrigin.syncHierarchy();

        lightEntity.setLocalRotation(cameraOrigin.getLocalRotation());
        lightEntity.rotateLocal(90, 0, 0);

        cameraEntity.camera.farClip = max * 5.0;

        lightEntity.light.intensity = 1.0 / (Math.min(1.0, app.scene.exposure) || 0.01);

        layer.addMeshInstances(model.meshInstances);
        layer.addLight(lightEntity.light.light);
        layer.addCamera(cameraEntity.camera);

        app.renderer.renderComposition(layerComposition);

        // read pixels from texture
        var device = app.graphicsDevice;
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, target._glFrameBuffer);
        device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, target.pixels);

        // render to canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.getContext('2d').putImageData(new ImageData(target.pixelsClamped, width, height), (canvasWidth - width) / 2, (canvasHeight - height) / 2);

        layer.removeLight(lightEntity.light.light);
        layer.removeCamera(cameraEntity.camera);
        layer.removeMeshInstances(model.meshInstances);
        layer.renderTarget = null;
        previewRoot.enabled = false;

        if (model !== modelPlaceholder)
            model.destroy();
    });
});
