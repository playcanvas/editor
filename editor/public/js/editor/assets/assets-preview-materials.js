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

    var materialCache = {};
    var cubemapCache = {};

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

        model.meshInstances[0].material = material; //.clone();

        // resize canvas appropriately
        if (canvas.width !== size)
            device.resizeCanvas(size, size);

        camera.setAspectRatio(1);

        renderer.render(scene, camera);

        callback(canvas);
    });

    // when materials are changed render their thumbs
    editor.on('preview:material:changed', function (assetId) {
        var asset = editor.call('assets:get', assetId);
        if (asset)
            editor.call('preview:delayedRender', asset);
    });

    // loads real-time material for the specified asset and
    // generates thumbnails for it
    var generatePreview = function (asset) {
        var assetId = asset.get('id');
        var material;

        var realtimeAsset = assets.getAssetById(assetId);
        if (!realtimeAsset)
            return;

        // called when material resource is loaded
        function onLoaded () {
            materialCache[material.id] = assetId;
            editor.call('preview:render', asset);
        }

        // load material
        material = realtimeAsset.resource;
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
            // generate preview after a little while to wait
            // for all assets to be added to the registry first
            setTimeout(function () {
                generatePreview(asset);
            }, 100);
    });

    editor.on('assets:remove', function (asset) {
        if (asset.get('type') !== 'material') return;

        // clear caches
        var assetId = asset.get('id');
        for (var id in materialCache) {
            if (materialCache[id] === assetId) {
                delete cubemapCache[id];
                delete materialCache[id];
            }
        }
    });

    // patch update for materials to emit change event
    var update = pc.PhongMaterial.prototype.update;
    pc.PhongMaterial.prototype.update = function () {
        update.call(this);
        if (materialCache[this.id])
            editor.emit('preview:material:changed', materialCache[this.id]);

        // add referenced cubemap to cubemap cache
        if (this.cubeMap)
            cubemapCache[this.id] = this.cubeMap;
        else
            delete cubemapCache[this.id];
    };

    // patch cubemap setSource to emit a change event for
    // materials that reference it
    var setSource = pc.Texture.prototype.setSource;
    pc.Texture.prototype.setSource = function () {
        setSource.apply(this, arguments);

        for (var id in cubemapCache) {
            if (cubemapCache[id] === this && materialCache[id]) {
                editor.emit('preview:material:changed', materialCache[id]);
            }
        }
    };


});
