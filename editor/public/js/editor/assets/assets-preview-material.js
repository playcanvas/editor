editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var device = app.graphicsDevice;
    var renderer = app.renderer;
    var scene = editor.call('preview:scene');

    var pitch = 0;
    var yaw = 0;

    var slots = { 'aoMap': 1, 'diffuseMap': 1, 'specularMap': 1, 'metalnessMap': 1, 'glossMap': 1, 'emissiveMap': 1, 'opacityMap': 1, 'normalMap': 1, 'heightMap': 1, 'sphereMap': 1, 'cubeMap': 1, 'lightMap': 1 };


    // material
    var material = new pc.StandardMaterial();
    material._scene = scene;


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
    cameraNode.setLocalPosition(0, 0, 1.5);

    var camera = new pc.Camera();
    camera._node = cameraNode;
    camera._nearClip = 0.1;
    camera._farClip = 32;
    camera._clearOptions.color = [ 41 / 255, 53 / 255, 56 / 255, 1.0 ];
    camera.frustumCulling = false;


    editor.method('preview:material:render', function(asset, target) {
        camera.setAspectRatio(target.height / target.width);
        camera.setRenderTarget(target);

        var id = asset.get('id');
        var sourceMaterial = app.assets.get(id);
        if (! sourceMaterial) return;

        sphereNode.setLocalEulerAngles(pitch, yaw, 0);
        sphereNode.syncHierarchy();

        if (! sourceMaterial.resource)
            app.assets.load(sourceMaterial);

        sourceMaterial.resource.update();
        material.copyParameters(sourceMaterial.resource);
        material.update();

        renderer.render(scene, camera);
    });

    editor.method('preview:material:rotation', function(p, y) {
        if (p === undefined)
            return [ pitch, yaw ];

        pitch = p;
        yaw = y;
    });

    editor.method('preview:material:model', function(value) {
        if (value === undefined)
            return currentModel;

        if (currentModel === value)
            return;

        if (value === 'box') {
            currentModel = 'box';
            model.meshInstances[0].mesh = meshBox;
        } else {
            currentModel = 'sphere';
            model.meshInstances[0].mesh = meshSphere;
        }
    });
});
