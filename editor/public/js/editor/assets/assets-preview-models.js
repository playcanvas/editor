editor.once('load', function () {

    var data = editor.call('preview:prepare');

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

    var setBestCameraPositionForModel = function () {
        var i, j;

        // Position the camera somewhere sensible
        var models = scene.getModels();

        var isUnderCamera = function (mi) {
            var parent = mi.node.getParent();

            while (parent) {
                if (parent.camera) {
                    return true;
                }
                parent = parent.getParent();
            }

            return false;
        };

        var meshInstances = [];
        for (i = 0; i < models.length; i++) {
            var mi = models[i].meshInstances;
            for (j = 0; j < mi.length; j++) {
                if (!isUnderCamera(mi[j])) {
                    meshInstances.push(mi[j]);
                }
            }
        }

        if (meshInstances.length > 0) {
            var aabb = new pc.shape.Aabb();
            aabb.copy(meshInstances[0].aabb);
            for (i = 0; i < meshInstances.length; i++) {
                aabb.add(meshInstances[i].aabb);
            }

            var focus = aabb.center;
            var halfHeight = aabb.halfExtents.y;
            var halfDepth = aabb.halfExtents.z;
            var offset = 1.2 * halfHeight / Math.tan(0.5 * camera.getFov() * Math.PI / 180.0);
            cameraNode.setPosition(focus);
            cameraNode.translateLocal(0, 0, offset + halfDepth);
        } else {
            cameraNode.setPosition(pc.Vec3.ZERO);
            cameraNode.translateLocal(0, 0, 1.2);
        }
    };

    // Instantly renders a preview for the specified model and passes
    // the result in the callback
    editor.method('preview:render:model', function (asset, size, callback) {
        var model = assets.getAssetById(asset.get('id'));
        if (!model) return;

        model = model.resource;
        if (!model) return;

        var models = scene.getModels();
        var i = models.length;
        while (i--) {
            scene.removeModel(models[i]);
        }

        scene.addModel(model);

        setBestCameraPositionForModel();

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
        var model = assets.getAssetById(asset.get('id'));
        if (!model) return;

        // clear mapping to avoid loading materials
        if (model.data && model.data.mapping) {
            model.data.mapping = [];
        }

        var onLoaded = function () {
            // update skinned mesh instance aabb's
            var meshInstances = model.meshInstances;
            for (var i = 0; i < meshInstances.length; i++) {
                if (meshInstances[i].skinInstance) {
                    meshInstances[i].skinInstance.updateMatrixPalette();
                }
            }

            editor.call('preview:render', asset);
        };

        if (!model.resource) {
            assets.load(model).then(function (resources) {
                model = resources[0];
                onLoaded();
            });
        } else {
            model = model.resource;
            onLoaded();
        }
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

    // ---- Models with materials -----
    // var modelMaterialCache = {};

    // editor.on('assets:add', function (asset) {
    //     if (asset.get('source')) return;
    //     if (asset.get('type') !== 'model') return;

    //     generatePreview(asset);

    //     var mapping = asset.get('data.mapping');
    //     if (mapping) {
    //         var modelId = asset.get('id');

    //         for (var i = 0; i < mapping.length; i++) {
    //             if (!modelMaterialCache[mapping[i].material]) {
    //                 modelMaterialCache[mapping[i].material] = {};
    //             }

    //             modelMaterialCache[mapping[i].material][modelId] = true;
    //         }
    //     }
    // });

    // editor.on('preview:material:changed', function (materialId) {
    //     if (modelMaterialCache[materialId]) {
    //         for (var modelId in modelMaterialCache[materialId]) {
    //             var asset = editor.call('assets:get', modelId);
    //             if (asset) {
    //                 editor.call('preview:delayedRender', asset);
    //             }
    //         }
    //     }
    // });

});
