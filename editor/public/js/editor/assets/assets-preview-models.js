editor.once('load', function () {

    var data = editor.call('preview:prepare');
    if (! data) return;

    var canvas = data.canvas;
    var assets = data.assets;
    var scene = data.scene;
    var renderer = data.renderer;
    var device = data.device;

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
    camera.setNearClip(0.0001);
    camera.setFarClip(100000);

    var clearOptions = camera.getClearOptions();
    clearOptions.color[0] = 0;
    clearOptions.color[1] = 0;
    clearOptions.color[2] = 0;
    clearOptions.color[3] = 0;

    var material = new pc.PhongMaterial();

    var cameraNode = new pc.GraphNode();
    cameraNode.setPosition(0, 0, 1.34);
    camera._node = cameraNode;

    // set up scene
    scene.ambientLight.set(0.2, 0.2, 0.2);
    scene.addLight(light);

    var setBestCameraPositionForModel = function (model) {
        var aabb = new pc.shape.Aabb();
        var meshInstances = model.meshInstances;
        if (meshInstances.length > 0) {
            meshInstances[0].syncAabb();
            aabb.copy(meshInstances[0].aabb);
            for (var i = 1; i < meshInstances.length; i++) {
                meshInstances[i].syncAabb();
                aabb.add(meshInstances[i].aabb);
            }
        }

        var bestPosition = aabb.center;
        var halfWidth = aabb.halfExtents.x;
        var halfHeight = aabb.halfExtents.y;
        var halfDepth = aabb.halfExtents.z;
        var max = Math.max(halfWidth, halfDepth);
        max = Math.max(max, halfHeight);
        bestPosition.z += max / Math.tan(0.5 * camera.getFov() * Math.PI / 180.0) + halfDepth;

        cameraNode.setPosition(bestPosition);
    };

    // Instantly renders a preview for the specified model and passes
    // the result in the callback
    editor.method('preview:render:model', function (asset, size, callback) {
        var model = assets.get(asset.get('id'));
        if (!model) return;

        model = model.resource;
        if (!model) return;

        var models = scene.getModels();
        var i = models.length;
        while (i--) {
            scene.removeModel(models[i]);
        }

        // update skinned mesh instance aabb's and materials
        var meshInstances = model.meshInstances;
        var material = new pc.PhongMaterial();
        for (var i = 0; i < meshInstances.length; i++) {
            meshInstances[i].material = material;

            if (meshInstances[i].skinInstance) {
                meshInstances[i].skinInstance.updateMatrixPalette();
            }
        }

        scene.addModel(model);

        setBestCameraPositionForModel(model);

        // resize canvas appropriately
        device.resizeCanvas(size, size);
        camera.setAspectRatio(1);

        renderer.render(scene, camera);

        if (callback)
            callback(canvas);
    });

    // loads real-time material for the specified asset and
    // generates thumbnails for it
    var generatePreview = function (asset) {
        var timeout;
        var model = assets.get(asset.get('id'));
        if (!model) return;

        var onLoaded = function () {
            editor.call('preview:render', asset);
        };

        var onReady = function (asset) {
            model = asset.resource;
            onLoaded();

            var onChange = function (asset, attribute, newValue, oldValue) {
                if (attribute === 'file' && newValue) {
                    if (timeout) {
                        clearTimeout(timeout);
                    }

                    // reload model asset
                    // (do it in a timeout to avoid
                    // rapid attribute changes)
                    timeout = setTimeout(function () {
                        asset.off('change', onChange);
                        asset.unload();
                        editor.call('preview:loader').clearCache(asset.file.url, 'model');
                        asset.ready(onReady);
                        assets.load(asset);

                        timeout = null;
                    }, 100);
                }
            };

            asset.off('change', onChange);
            asset.on('change', onChange);
        };


        model.ready(onReady);
        assets.load(model);
    };


    // TODO: enable for white materials
    editor.on('assets:add', function (asset) {
        if (asset.get('source')) return;
        if (asset.get('type') !== 'model') return;

        // do this in a timeout to wait for all
        // assets to be added to the asset registry first
        setTimeout(function () {
            generatePreview(asset);
        }, 100);
    });
});
