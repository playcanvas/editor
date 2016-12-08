editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var device = app.graphicsDevice;
    var renderer = app.renderer;
    var scene = editor.call('preview:scene');

    var pitch = 0;
    var yaw = 0;


    // material
    var material = new pc.StandardMaterial();
    material._scene = scene;

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
    var sphereNode = new pc.GraphNode();

    var currentModel = 'sphere';

    var meshBox = pc.createBox(device, {
        halfExtents: new pc.Vec3(0.3, 0.3, 0.3)
    });
    var meshSphere = pc.createSphere(device, {
        radius: 0.5,
        latitudeBands: 64,
        longitudeBands: 64
    });

    var model = new pc.Model();
    model.node = sphereNode;
    model.meshInstances = [ new pc.MeshInstance(sphereNode, meshSphere, material ) ];


    // light
    var lightNode = new pc.GraphNode();
    lightNode.setLocalEulerAngles(45, 45, 0);

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
    camera.nearClip = 0.1;
    camera.farClip = 32;
    camera.clearColor = [ 41 / 255, 53 / 255, 56 / 255, 0.0 ];
    camera.frustumCulling = false;


    editor.method('preview:material:render', function(asset, target, args) {
        args = args || { };

        camera.aspectRatio = target.height / target.width;
        camera.renderTarget = target;

        var data = asset.get('data');
        if (! data) return;

        scene.addModel(model);
        scene.addLight(light);

        setModel(args.model || 'sphere');
        pitch = args.hasOwnProperty('rotation') ? args.rotation[0] : 0;
        yaw = args.hasOwnProperty('rotation') ? args.rotation[1] : 0;

        cameraOrigin.setLocalEulerAngles(pitch, yaw, 0);
        cameraOrigin.syncHierarchy();

        light.intensity = 1.0 / (Math.min(1.0, scene.exposure) || 0.01);

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

        renderer.render(scene, camera);

        scene.removeModel(model);
        scene.removeLight(light);
    });

    var setModel = function(value) {
        if (currentModel === value)
            return;

        if (value === 'box') {
            currentModel = 'box';
            model.meshInstances[0].mesh = meshBox;
        } else {
            currentModel = 'sphere';
            model.meshInstances[0].mesh = meshSphere;
        }
    };
});
