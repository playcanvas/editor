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

    scene.addModel(model);


    // light
    var lightNode = new pc.GraphNode();
    lightNode.setLocalEulerAngles(45, 45, 0);

    var light = new pc.Light();
    light.enabled = true;
    light.type = pc.LIGHTTYPE_DIRECTIONAL;
    light._node = lightNode;

    model.lights = [ light ];
    scene.addLight(light);


    // camera
    var cameraNode = new pc.GraphNode();
    cameraNode.setLocalPosition(0, 0, 1.35);

    var camera = new pc.Camera();
    camera._node = cameraNode;
    camera._nearClip = 0.1;
    camera._farClip = 32;
    camera._clearOptions.color = [ 41 / 255, 53 / 255, 56 / 255, 0.0 ];
    camera.frustumCulling = false;


    editor.method('preview:material:render', function(asset, target, args) {
        args = args || { };

        camera.setAspectRatio(target.height / target.width);
        camera.setRenderTarget(target);

        var data = asset.get('data');
        if (! data) return;

        setModel(args.model || 'sphere');
        pitch = args.rotation && args.rotation[0] || 0;
        yaw = args.rotation && args.rotation[1] || 0;

        sphereNode.setLocalEulerAngles(pitch, yaw, 0);
        sphereNode.syncHierarchy();

        // update material
        for(var key in mapping) {
            var value = data.hasOwnProperty(key) ? data[key] : mapping[key].default;

            switch(mapping[key].type) {
                case 'boolean':
                case 'string':
                case 'int':
                case 'float':
                    material[key] = value;
                    break;
                case 'vec2':
                    material[key].set(value[0], value[1]);
                    break;
                case 'rgb':
                case 'vec3':
                    material[key].set(value[0], value[1], value[2]);
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
                                material[key] = null;
                            }
                        } else {
                            material[key] = null;
                        }
                    } else {
                        material[key] = null;
                    }
                    break;
            }
        }

        material.shadingModel = mappingShading[data.shader];

        material.update();

        renderer.render(scene, camera);
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
