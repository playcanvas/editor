editor.once('load', function () {

    // canvas user to render the preview
    var canvas = new ui.Canvas();

    // create resource loader and asset registry
    var loader = new pc.resources.ResourceLoader();
    var assets = new pc.asset.AssetRegistry(loader, '/api');

    // bind asset registry to editor
    editor.call('assets:registry:bind', assets);

    // set up graphics
    var device = new pc.GraphicsDevice(canvas.element);
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
    var lightNode = new pc.GraphNode();
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
    cameraNode.setPosition(0, 0, 1.5);
    camera._node = cameraNode;

    // set up scene
    scene.ambientLight.set(0.2, 0.2, 0.2);
    scene.addModel(model);
    scene.addLight(light);

    // register resource handlers
    loader.registerHandler(pc.resources.TextureRequest, new pc.resources.TextureResourceHandler(device, assets));
    loader.registerHandler(pc.resources.CubemapRequest, new pc.resources.CubemapResourceHandler(device, assets));
    loader.registerHandler(pc.resources.MaterialRequest, new pc.resources.MaterialResourceHandler(device, assets));

    // renders the scene with the specified material and emits event
    // with canvas.toDataURL() as argument
    editor.method('material:preview', function (asset, width, height, callback) {
        var materialId = asset.get('id');

        var asset = assets.getAssetById(materialId);
        if (!asset)
            return;

        // render with specified material
        function render (material) {
            model.meshInstances[0].material = material;
            device.resizeCanvas(width, height);
            canvas.resize(width, height);
            camera.setAspectRatio(width / height);
            renderer.render(scene, camera);
            editor.emit('material:preview:' + materialId, canvas.element.toDataURL());
        }

        // called when material resource is loaded
        function onLoaded (material) {
            // remember old update
            if (!material.oldUpdate) {
                material.oldUpdate = material.update;
            }

            // change update function of material
            // to re-render on the canvas whenever the
            // material is updated
            material.update = function () {
                material.oldUpdate.call(material);

                // if the asset no longer exists then stop re-rendering
                if (! editor.call('assets:get', materialId)) {
                    material.update = material.oldUpdate;
                } else  {
                    render(material);
                }
            };

            render(material);

            if (callback)
                callback();
        }

        // load material
        var material = asset.resource;
        if (!material) {
            assets.load(asset).then(function (resources) {
                material = resources[0];
                onLoaded(material);
            }.bind(this));
        } else {
            onLoaded(material);
        }
    });

});