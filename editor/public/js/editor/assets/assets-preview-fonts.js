editor.once('load', function () {

    var data = editor.call('preview:prepare');
    if (! data) return;

    var canvas = data.canvas;
    var assets = data.assets;
    var scene = data.scene;
    var renderer = data.renderer;
    var device = data.device;

    // shader definition for the font rendering
    var precision = "precision " + device.precision + " float;";

    var shaderDefinition = {
        attributes: {
            aPosition: pc.gfx.SEMANTIC_POSITION,
            aUv0: pc.gfx.SEMANTIC_TEXCOORD0
        },
        vshader: pc.shaderChunks.msdfVS,
        fshader: pc.shaderChunks.msdfPS.replace("[PRECISION]", precision)
    };

    // Create the shader from the definition
    var shader = new pc.gfx.Shader(device, shaderDefinition);

    // the material to render fonts
    var material = new pc.Material();
    material.setShader(shader);

    // material.setParameter("texture_atlas", texture.resource);
    material.setParameter("material_background", [0,0,0,0]);
    material.setParameter("material_foreground", [1,1,1,1]);
    material.blendType = pc.BLEND_PREMULTIPLIED;
    material.cull = pc.CULLFACE_NONE;
    material.depthWrite = false;
    material.depthTest = false;

    var positions = [];
    var normals = [];
    var uvs = [];
    var indices = [];

    // creates text mesh
    var createMesh = function (length) {
        positions.length = 0;
        normals.length = 0;
        uvs.length = 0;
        indices.length = 0;

        for (var i = 0; i < length; i++) {
            positions.push(0,0,0);
            positions.push(0,0,0);
            positions.push(0,0,0);
            positions.push(0,0,0);

            normals.push(0, 0, -1);
            normals.push(0, 0, -1);
            normals.push(0, 0, -1);
            normals.push(0, 0, -1);

            uvs.push(0, 1);
            uvs.push(1, 0);
            uvs.push(1, 1);
            uvs.push(0, 1);

            indices.push(i*4, i*4 + 1, i*4 + 3);
            indices.push(i*4 + 1, i*4 + 3, i*4 + 2);
        }

        return pc.createMesh(device, positions, {normals: normals, uvs: uvs, indices: indices});
    };

    // updates mesh positions and uvs based on the font and the text specified
    var updateMesh = function (text, font) {
        var vb = mesh.vertexBuffer;
        var it = new pc.VertexIterator(vb);

        var length = text.length;
        var maxScale = -1;
        var width = 2;
        var height = 2;
        var maxWidth = 0;

        // find max character scale
        // so that we scale all smaller characters based on that value
        for (var i = 0; i < length; i++) {
            var char = text.charCodeAt(i);

            var charData = font.data.chars[char];
            if (! charData)
                return false;

            maxScale = Math.max(maxScale, 1 / (charData.scale || 1));
        }

        positions.length = 0;
        uvs.length = 0;

        for (var i = 0; i < length; i++) {
            var char = text.charCodeAt(i);

            var charData = font.data.chars[char];
            if (! charData)
                return false;

            var scale = 1 / (charData.scale || 1);
            scale = scale / maxScale;

            // calculate position for character
            positions.push(maxWidth, -1, 0);
            positions.push(maxWidth + scale*width, -1, 0);
            positions.push(maxWidth + scale*width, -1 + height*scale, 0);
            positions.push(maxWidth, -1 + height*scale, 0);

            // remember maxWidth
            maxWidth += scale*width;

            // calculate uvs
            var x1 = charData.x / font.data.info.width;
            var y1 = 1 - (charData.y + charData.height) / font.data.info.height;
            var x2 = (charData.x + charData.width) / font.data.info.width;
            var y2 = 1 - charData.y / font.data.info.height;

            uvs.push(x1, y1);
            uvs.push(x2, y1);
            uvs.push(x2, y2);
            uvs.push(x1, y2);
        }

        // offset positions to be centered vertically
        var offset = -maxWidth / 2;
        for (var i = 0; i < positions.length; i+=3) {
            positions[i] += offset;
        }

        // update vertices
        var numVertices = length * 4;
        for (var i = 0; i < numVertices; i++) {
            it.element[pc.SEMANTIC_POSITION].set(positions[i*3+0], positions[i*3+1], positions[i*3+2]);
            it.element[pc.SEMANTIC_TEXCOORD0].set(uvs[i*2+0], uvs[i*2+1]);

            it.next();
        }
        it.end();

        return true;

    };

    // create the mesh and a model and add them to the scene
    var mesh = createMesh(2);
    var node = new pc.GraphNode();
    var model = new pc.Model();
    var meshInstance = new pc.MeshInstance(node, mesh, material);
    model.meshInstances.push(meshInstance);
    scene.addModel(model);

    // set up camera
    var camera = new pc.Camera();
    var clearOptions = camera.getClearOptions();
    clearOptions.color[0] = 0;
    clearOptions.color[1] = 0;
    clearOptions.color[2] = 0;
    clearOptions.color[3] = 0;

    var cameraNode = new pc.GraphNode();
    cameraNode.setPosition(0, 0, 6);
    camera._node = cameraNode;

    var hasChar = function (char, font) {
        var code = char.charCodeAt(0);
        return !!font.data.chars[code];
    };

    // Instantly renders a preview for the specified material and passes
    // the canvas in the callback
    editor.method('preview:render:font', function (asset, size, callback) {
        // resize canvas appropriately
        if (canvas.width !== size)
            device.resizeCanvas(size, size);

        camera.setAspectRatio(1);

        var font = assets.get(asset.get('id'));

        meshInstance.setParameter("texture_atlas", font.resource.texture);

        if (false && hasChar('A', font.resource) && hasChar('a', font.resource)) {
            var text = 'Aa';
        } else {
            var text = asset.get('meta.chars').slice(0, 2);
        }

        updateMesh(text, font.resource);

        renderer.render(scene, camera);

        callback(canvas);
    });


    // loads real-time material for the specified asset and
    // generates thumbnails for it
    var generatePreview = function (asset) {
        var timeout;
        var font = assets.get(asset.get('id'));
        if (!font) return;

        var data = asset.get('data');
        if (! data || ! data.chars) {
            asset.once('data:set', function () {
                generatePreview(asset);
            });

            return;
        }

        if (! asset.get('file')) {
            asset.once('file:set', function () {
                generatePreview(asset);
            });

            return;
        }

        var onReady = function (runtimeAsset) {
            var onChange = function (runtimeAsset, attribute, newValue, oldValue) {
                if ((attribute === 'file' || attribute === 'data') && newValue) {
                    if (timeout) {
                        clearTimeout(timeout);
                    }

                    // reload font asset
                    // (do it in a timeout to avoid
                    // rapid attribute changes)
                    timeout = setTimeout(function () {
                        runtimeAsset.off('change', onChange);
                        runtimeAsset.unload();
                        editor.call('preview:loader').clearCache(runtimeAsset.file.url, 'font');
                        runtimeAsset.ready(onReady);
                        assets.load(runtimeAsset);

                        timeout = null;
                    }, 100);
                }
            };

            runtimeAsset.off('change', onChange);
            runtimeAsset.on('change', onChange);

            if (runtimeAsset.resource && runtimeAsset.resource.texture && runtimeAsset.resource.data && runtimeAsset.resource.data.chars)
                editor.call('preview:render', asset);
        };


        font.ready(onReady);
        assets.load(font);
    };


    // TODO: enable for white materials
    editor.on('assets:add', function (asset) {
        if (asset.get('source')) return;
        if (asset.get('type') !== 'font') return;

        // do this in a timeout to wait for all
        // assets to be added to the asset registry first
        setTimeout(function () {
            generatePreview(asset);
        }, 100);
    });

});
