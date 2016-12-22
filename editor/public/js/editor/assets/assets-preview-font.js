editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    var device = app.graphicsDevice;
    var renderer = app.renderer;
    var scene = editor.call('preview:scene');

    // camera
    var cameraNode = new pc.GraphNode();
    cameraNode.setLocalPosition(0, 0, 1);

    var camera = new pc.Camera();
    camera._node = cameraNode;
    camera.nearClip = 1;
    camera.farClip = 32;
    camera.clearColor = [ 0, 0, 0, 0 ];
    camera.fov = 75;
    camera.frustumCulling = false;

    var defaultScreenSpaceTextMaterial = new pc.StandardMaterial();
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

    var hasChars = function (chars, font) {
        for (var i = 0; i < chars.length; i++)
            if (! font.data.chars[chars.charCodeAt(i)])
                return false;

        return true;
    };

    // create the mesh and a model and add them to the scene
    var mesh = createMesh(2);
    var node = new pc.GraphNode();
    var model = new pc.Model();
    var meshInstance = new pc.MeshInstance(node, mesh, defaultScreenSpaceTextMaterial);
    meshInstance.screenSpace = true;
    model.meshInstances.push(meshInstance);


    editor.method('preview:font:render', function(asset, target, args) {
        args = args || { };

        camera.aspectRatio = target.height / target.width;
        camera.renderTarget = target;
        
        var engineAsset = app.assets.get(asset.get('id'));

        // skip if the font isn't ready
        if (! engineAsset || ! engineAsset.resource || ! engineAsset.resource.texture || ! engineAsset.data || ! engineAsset.data.chars) {
            renderer.render(scene, camera);
            return;
        }

        // set the font texture
        defaultScreenSpaceTextMaterial.msdfMap = engineAsset.resource.texture;
        defaultScreenSpaceTextMaterial.update();

        // try to use Aa as the text in different languages
        // and if that is not found try the first two characters of the font

        // latin
        if (hasChars('Aa', engineAsset.resource)) {
            var text = 'Aa';
        }
        // greek
        else if (hasChars('Αα', engineAsset.resource)) {
            var text = 'Αα';
        }
        // cyrillic
        else if (hasChars('Аа', engineAsset.resource)) {
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

        scene.addModel(model);

        updateMesh(text, engineAsset.resource); 

        renderer.render(scene, camera);

        scene.removeModel(model);

    });
});
