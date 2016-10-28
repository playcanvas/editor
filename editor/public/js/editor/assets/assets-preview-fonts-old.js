editor.once('load', function () {

    var data = editor.call('preview:prepare');
    if (! data) return;

    var canvas = data.canvas;
    var assets = data.assets;
    var scene = data.scene;
    var renderer = data.renderer;
    var device = data.device;

    var defaultScreenSpaceTextMaterial = new pc.StandardMaterial();

    defaultScreenSpaceTextMaterial.screenSpace = true;
    defaultScreenSpaceTextMaterial.useLighting = false;
    defaultScreenSpaceTextMaterial.useGammaTonemap = false;
    defaultScreenSpaceTextMaterial.useFog = false;
    defaultScreenSpaceTextMaterial.useSkybox = false;
    defaultScreenSpaceTextMaterial.emissive = new pc.Color(1,1,1,1);
    defaultScreenSpaceTextMaterial.opacity = 1;
    defaultScreenSpaceTextMaterial.blendType = pc.BLEND_PREMULTIPLIED;
    defaultScreenSpaceTextMaterial.depthWrite = false;
    defaultScreenSpaceTextMaterial.depthTest = false;
    defaultScreenSpaceTextMaterial.cull = pc.CULLFACE_NONE;
    defaultScreenSpaceTextMaterial.update();

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
        var width = 1;
        var height = 1;
        var maxWidth = 0;
        var maxYOffset = 0;

        for (var i = 0; i < length; i++) {
            var char = text.charCodeAt(i);

            var charData = font.data.chars[char];
            if (! charData)
                return false;

            // find max character scale
            // so that we scale all smaller characters based on that value
            maxScale = Math.max(maxScale, 1 / (charData.scale || 1));

            // find max yoffset so that we line up characters a bit better in the preview
            maxYOffset = Math.max(maxYOffset, charData.yoffset / charData.height || 0);
        }

        positions.length = 0;
        uvs.length = 0;

        for (var i = 0; i < length; i++) {
            var char = text.charCodeAt(i);

            var charData = font.data.chars[char];
            if (! charData)
                return false;

            // scale of character relative to max scale
            var scale = 1 / (charData.scale || 1);
            scale = scale / maxScale;

            // yoffset of character relative to maxYOffset
            var yoffset = maxYOffset - (charData.yoffset / charData.height || 0) - 1;

            // calculate position for character
            positions.push(maxWidth, yoffset, 0);
            positions.push(maxWidth + scale*width, yoffset, 0);
            positions.push(maxWidth + scale*width, yoffset + height*scale, 0);
            positions.push(maxWidth, yoffset + height*scale, 0);

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
    var meshInstance = new pc.MeshInstance(node, mesh, defaultScreenSpaceTextMaterial);
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

    var hasChars = function (chars, font) {
        for (var i = 0; i < chars.length; i++)
            if (! font.data.chars[chars.charCodeAt(i)])
                return false;

        return true;
    };

    // Instantly renders a preview for the specified material and passes
    // the canvas in the callback
    editor.method('preview:render:font', function (asset, size, callback) {
        // resize canvas appropriately
        if (canvas.width !== size)
            device.resizeCanvas(size, size);

        camera.setAspectRatio(1);

        var font = assets.get(asset.get('id'));
        if (! font || ! font.resource || ! font.resource.texture || ! font.data || ! font.data.chars)
            return;

        // set the font texture
        defaultScreenSpaceTextMaterial.msdfMap = font.resource.texture;
        defaultScreenSpaceTextMaterial.update();

        // try to use Aa as the text in different languages
        // and if that is not found try the first two characters of the font

        // latin
        if (hasChars('Aa', font.resource)) {
            var text = 'Aa';
        }
        // greek
        else if (hasChars('Αα', font.resource)) {
            var text = 'Αα';
        }
        // cyrillic
        else if (hasChars('Аа', font.resource)) {
            var text = 'Аа';
        }
        // rest
        else {
            var text = '';
            var chars = asset.get('meta.chars');
            for (var i = 0, len = chars.length; i < len && text.length < 2; i++) {
                if (/\s/.test(chars[i])) continue;
                text += chars[i];
            }
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

            if (runtimeAsset.resource && runtimeAsset.resource.texture && runtimeAsset.resource.data && runtimeAsset.resource.data.chars) {
                editor.call('preview:render', asset);
                editor.emit('preview:font:changed', asset.get('id'));
            }
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
