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
    cameraNode.setPosition(0, 0, 1.3);
    camera._node = cameraNode;

    // set up scene
    scene.ambientLight.set(0.2, 0.2, 0.2);
    scene.addModel(model);
    scene.addLight(light);

    // function updateSettings (settings) {
    //     var ambient = settings.get('render.global_ambient');
    //     scene.ambientLight.set(ambient[0], ambient[1], ambient[2]);

    //     scene.gammaCorrection = settings.get('render.gamma_correction');
    //     scene.toneMapping = settings.get('render.tonemapping');
    //     scene.exposure = settings.get('render.exposure');

    //     editor.emit('material:preview:sceneChanged');
    // }

    // editor.on('sceneSettings:load', function (settings) {
    //     updateSettings(settings);

    //     settings.on('*:set', function () {
    //         updateSettings(settings);
    //     });
    // });

    // register resource handlers
    loader.registerHandler(pc.resources.TextureRequest, new pc.resources.TextureResourceHandler(device, assets));
    loader.registerHandler(pc.resources.CubemapRequest, new pc.resources.CubemapResourceHandler(device, assets));
    loader.registerHandler(pc.resources.MaterialRequest, new pc.resources.MaterialResourceHandler(device, assets));

    // renders the scene with the specified material and emits event
    // with canvas.toDataURL() as argument
    editor.method('material:preview', function (asset, width, height, callback) {
        var materialId = asset.get('id');
        var material;

        var asset = assets.getAssetById(materialId);
        if (!asset)
            return;

        var timeout;

        // render with specified material
        function render () {
            model.meshInstances[0].material = material;
            device.resizeCanvas(width, height);
            canvas.resize(width, height);
            camera.setAspectRatio(width / height);
            renderer.render(scene, camera);
            editor.emit('material:preview:' + materialId, canvas.element.toDataURL());
        }

        function delayedRender () {
            // if the asset no longer exists then stop re-rendering
            if (! editor.call('assets:get', materialId)) {
                material.update = material.oldUpdate;
                // editor.unbind('material:preview:sceneChanged', delayedRender);
            } else  {
                if (timeout)
                    clearTimeout(timeout);

                timeout = setTimeout(function() {
                    render();
                    timeout = null;
                }, 100);
            }
        }

        // called when material resource is loaded
        function onLoaded () {
            // remember old update
            if (!material.oldUpdate) {
                material.oldUpdate = material.update;

                // // re-render when scene settings change
                // editor.on('material:preview:sceneChanged', delayedRender);
            }

            // change update function of material
            // to re-render on the canvas whenever the
            // material is updated
            material.update = function () {
                material.oldUpdate.call(material);
                delayedRender();
            };

            render();

            if (callback)
                callback();
        }

        // load material
        var material = asset.resource;
        if (!material) {
            assets.load(asset).then(function (resources) {
                material = resources[0];
                onLoaded();
            }.bind(this));
        } else {
            onLoaded();
        }
    });

});