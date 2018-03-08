editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var pitch = 0;
    var yaw = 0;

    var layerComposition = editor.call('preview:layerComposition');
    var layer = editor.call('preview:layer');

    // material
    var material = new pc.StandardMaterial();

    var mapping = editor.call('assets:material:mapping');
    var mappingShading = {
        'phong': 0,
        'blinn': 1
    };
    var cubemapPrefiltered = [
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

    editor.method('preview:material:render', function(asset, canvasWidth, canvasHeight, canvas, args) {
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

        // update material
        for(var key in mapping) {
            var value = data.hasOwnProperty(key) ? data[key] : mapping[key].default;

            if (args.params && args.params.hasOwnProperty(key))
                value = args.params[key];

            switch(mapping[key].type) {
                case 'boolean':
                case 'string':
                case 'int':
                case 'float':
                case 'number':
                    material[key] = value;
                    break;
                case 'vec2':
                    material[key].set(value[0], value[1]);
                    break;
                case 'rgb':
                case 'vec3':
                    material[key].set(value[0], value[1], value[2]);
                    break;
                case 'cubemap':
                    if (value) {
                        // TODO
                        // handle async
                        var textureAsset = app.assets.get(value);
                        if (textureAsset) {
                            if (textureAsset.resource) {
                                material[key] = textureAsset.resource;
                            } else {
                                material[key] = null;
                            }

                            if (textureAsset.file && textureAsset.resources && textureAsset.resources.length === 7) {
                                for(var i = 0; i < 6; i++)
                                    material[cubemapPrefiltered[i]] = textureAsset.resources[i + 1];
                            } else {
                                for(var i = 0; i < 6; i++)
                                    material[cubemapPrefiltered[i]] = null;
                            }

                            textureAsset.loadFaces = true;
                            app.assets.load(textureAsset);
                        } else {
                            material[key] = null;
                            for(var i = 0; i < 6; i++)
                                material[cubemapPrefiltered[i]] = null;
                        }
                    } else {
                        material[key] = null;
                        for(var i = 0; i < 6; i++)
                            material[cubemapPrefiltered[i]] = null;
                    }
                    break;
                case 'texture':
                    if (value) {
                        // TODO
                        // handle async
                        var textureAsset = app.assets.get(value);
                        if (textureAsset) {
                            if (textureAsset.resource) {
                                material[key] = textureAsset.resource;
                            } else {
                                app.assets.load(textureAsset);
                                material[key] = null;
                            }
                        } else {
                            material[key] = null;
                        }
                    } else {
                        material[key] = null;
                    }
                    break;
                case 'object':
                    switch(key) {
                        case 'cubeMapProjectionBox':
                            if (value) {
                                if (material.cubeMapProjectionBox) {
                                    material.cubeMapProjectionBox.center.set(0, 0, 0);
                                    material.cubeMapProjectionBox.halfExtents.set(value.halfExtents[0], value.halfExtents[1], value.halfExtents[2]);
                                } else {
                                    material.cubeMapProjectionBox = new pc.BoundingBox(new pc.Vec3(0, 0, 0), new pc.Vec3(value.halfExtents[0], value.halfExtents[1], value.halfExtents[2]));
                                }
                            } else {
                                material.cubeMapProjectionBox = null;
                            }
                            break;
                    }
                    break;
            }
        }

        material.shadingModel = mappingShading[data.shader];

        material.update();

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
        layer.removeLight(lightEntity.light.light);
        layer.removeMeshInstances(sphere.enabled ? sphere.model.meshInstances : box.model.meshInstances);
        previewRoot.enabled = false;

    });

});
