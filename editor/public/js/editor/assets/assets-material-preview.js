editor.once('load', function () {

    // canvas user to render the preview
    var canvas = document.createElement('canvas');

    // create resource loader and asset registry
    var loader = new pc.resources.ResourceLoader();
    var assets = new pc.asset.AssetRegistry(loader, '/api');

    // bind asset registry to editor
    editor.call('assets:registry:bind', assets);

    // set up graphics
    var device = new pc.GraphicsDevice(canvas);
    var scene = new pc.Scene();
    var renderer = new pc.ForwardRenderer(device);

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
    cameraNode.setPosition(0, 0, 1.3);
    camera._node = cameraNode;

    // set up scene
    scene.ambientLight.set(0.2, 0.2, 0.2);
    scene.addModel(model);
    scene.addLight(light);

    var resolutions = [{
        size: 64,
        path: 'thumbnails.s'
    }, {
        size: 128,
        path: 'thumbnails.m'
    }, {
        size: 256,
        path: 'thumbnails.l'
    }, {
        size: 512,
        path: 'thumbnails.xl'
    }];

    var sceneSettingsTimeout;

    var settings = editor.call('sceneSettings');

    function updateSettings () {
        var ambient = settings.get('render.global_ambient');
        scene.ambientLight.set(ambient[0], ambient[1], ambient[2]);

        scene.gammaCorrection = settings.get('render.gamma_correction');
        scene.toneMapping = settings.get('render.tonemapping');
        scene.exposure = settings.get('render.exposure');

        // regenerate all material thumbnails after a small delay
        if (sceneSettingsTimeout)
            clearTimeout(sceneSettingsTimeout);

        sceneSettingsTimeout = setTimeout(function () {
            editor.call('assets:map', function (asset) {
                if (asset.get('type') !== 'material') return;

                render(asset);
            });

            sceneSettingsTimeout = null;
        }, 100);
    }

    editor.on('sceneSettings:load', function () {
        updateSettings();

        settings.on('render.global_ambient:set', updateSettings);
        settings.on('render.gamma_correction:set', updateSettings);
        settings.on('render.tonemapping:set', updateSettings);
        settings.on('render.exposure:set', updateSettings);
    });

    // register resource handlers
    loader.registerHandler(pc.resources.TextureRequest, new pc.resources.TextureResourceHandler(device, assets));
    loader.registerHandler(pc.resources.CubemapRequest, new pc.resources.CubemapResourceHandler(device, assets));
    loader.registerHandler(pc.resources.MaterialRequest, new pc.resources.MaterialResourceHandler(device, assets));

    // renders preview in 4 resolutions for the specified material
    var render = function (asset) {
        var material = assets.getAssetById(asset.get('id'));
        if (!material) return;

        material = material.resource;
        if (!material) return;

        if (scene.updateShaders) {
            scene._updateShaders(device);
            scene.updateShaders = false;
        }

        model.meshInstances[0].material = material;

        asset.set('has_thumbnail', true);

        resolutions.forEach(function (res) {
            device.resizeCanvas(res.size, res.size);
            camera.setAspectRatio(1);

            renderer.render(scene, camera);
            asset.set(res.path, canvas.toDataURL());
        });
    }

    // loads real-time material for the specified asset and
    // generates thumbnails for it
    var generatePreview = function (asset) {
        var materialId = asset.get('id');
        var material;

        var realtimeAsset = assets.getAssetById(materialId);
        if (!realtimeAsset)
            return;

        var timeout;

        // called when material resource is loaded
        function onLoaded () {
            // remember old update
            if (!material.oldUpdate) {
                material.oldUpdate = material.update;
            }

            // change update function of material
            // to re-render on the canvas whenever the
            // material is updated
            material.update = function () {
                material.oldUpdate.call(material);

                if (timeout)
                    clearTimeout(timeout);

                timeout = setTimeout(function() {
                    render(asset);
                    timeout = null;
                }, 100);
            };

            render(asset);
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
