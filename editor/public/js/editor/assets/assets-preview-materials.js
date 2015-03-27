editor.once('load', function () {

    var data = editor.call('preview:prepare');

    var canvas = data.canvas;
    var assets = data.assets;
    var scene = data.scene;
    var renderer = data.renderer;
    var device = data.device;

    // set up sphere
    var node = new pc.GraphNode();
    var mesh = pc.createSphere(device);
    var meshInstance = new pc.MeshInstance(node, mesh, new pc.PhongMaterial());
    var model = new pc.Model();
    model.graph = node;
    model.meshInstances = [ meshInstance ];

    // set up light
    var light = new pc.Light();
    light.setEnabled(true);
    light.setColor(1, 1, 1);
    var lightNode = new pc.GraphNode();
    lightNode.setPosition(5, 5, 5);
    lightNode.rotate(45, 45, 0);
    light._node = lightNode;

    // set up camera
    var camera = new pc.Camera();
    var clearOptions = camera.getClearOptions();
    clearOptions.color[0] = 0;
    clearOptions.color[1] = 0;
    clearOptions.color[2] = 0;
    clearOptions.color[3] = 0;

    var cameraNode = new pc.GraphNode();
    cameraNode.setPosition(0, 0, 1.34);
    camera._node = cameraNode;

    // set up scene
    scene.ambientLight.set(0.2, 0.2, 0.2);
    scene.addLight(light);
    scene.addModel(model);

    var sceneSettingsLoaded = false;

    var settings = editor.call('sceneSettings');

    var updateSettings = function () {
        var ambient = settings.get('render.global_ambient');
        var gammaCorrection = settings.get('render.gamma_correction');
        var tonemapping = settings.get('render.tonemapping');
        var exposure = settings.get('render.exposure');

        scene.ambientLight.set(ambient[0], ambient[1], ambient[2]);
        scene.gammaCorrection = gammaCorrection;
        scene.toneMapping = tonemapping;
        scene.exposure = exposure;

        // regenerate all material thumbnails
        editor.call('assets:map', function (asset) {
            if (asset.get('type') !== 'material') return;

            editor.emit('preview:material:changed', asset.get('id'));
        });
    };


    // when scene settings load render all materials
    editor.on('sceneSettings:load', function () {
        sceneSettingsLoaded = true;

        updateSettings();

        settings.on('render.global_ambient:set', updateSettings);
        settings.on('render.gamma_correction:set', updateSettings);
        settings.on('render.tonemapping:set', updateSettings);
        settings.on('render.exposure:set', updateSettings);
    });


    // Instantly renders a preview for the specified material and passes
    // the canvas in the callback
    editor.method('preview:render:material', function (asset, size, callback) {
        if (!sceneSettingsLoaded) return;

        var material = assets.getAssetById(asset.get('id'));
        if (!material) return;

        material = material.resource;
        if (!material) return;

        // multiply-blend won't work properly so make it normal
        if (material.blendType === pc.BLEND_MULTIPLICATIVE)
            material.blendType = pc.BLEND_NORMAL;

        model.meshInstances[0].material = material.clone();

        // use the same size for all thumbs for optimization
        if (canvas.width !== size)
            device.resizeCanvas(size, size);

        camera.setAspectRatio(1);

        renderer.render(scene, camera);

        callback(canvas);
    });

    // when materials are changed render their thumbs
    editor.on('preview:material:changed', function (materialId) {
        var asset = editor.call('assets:get', materialId);
        if (asset)
            editor.call('preview:delayedRender', asset);
    });

    // loads real-time material for the specified asset and
    // generates thumbnails for it
    var generatePreview = function (asset) {
        var materialId = asset.get('id');
        var material;

        var realtimeAsset = assets.getAssetById(materialId);
        if (!realtimeAsset)
            return;

        // called when material resource is loaded
        function onLoaded () {
            // remember old update
            if (!material.oldUpdate) {
                material.oldUpdate = material.update;

                // patch update function of material
                // to re-render on the canvas whenever the
                // material is updated
                material.update = function () {
                    material.oldUpdate.call(material);

                    var cubeMap = material.cubeMap;
                    if (cubeMap) {
                        // patch cubemap setSource method to give us
                        // updates when it's called so we can re-render materials
                         if (!cubeMap.oldSetSource) {
                            cubeMap.oldSetSource = cubeMap.setSource;
                            cubeMap.setSource = function (source) {
                                cubeMap.oldSetSource.call(cubeMap, source);

                                if (cubeMap === material.cubeMap)
                                    editor.emit('preview:material:changed', materialId);
                             };
                         }
                    }

                    editor.emit('preview:material:changed', materialId);
                };
            }

            editor.call('preview:render', asset);
        }

        // load material
        var material = realtimeAsset.resource;
        if (!material) {
            assets.load(realtimeAsset).then(function (resources) {
                material = resources[0];
                onLoaded();
            }.bind(this));
        } else {
            onLoaded();
        }
    };

    editor.on('assets:add', function (asset) {
        if (asset.get('type') === 'material')
            generatePreview(asset);
    });

    editor.on('assets:remove', function (asset) {
        if (asset.get('type') !== 'material') return;

        var id = asset.get('id');
        var material = assets.getAssetById(id);
        if (!material || !material.resource || !material.resource.oldUpdate) return;

        material.resource.update = material.resource.oldUpdate;
    });

});
