editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

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

    var defaultTexture = new pc.Texture(app.graphicsDevice, {width:1, height:1, format:pc.PIXELFORMAT_R8_G8_B8_A8});
    var pixels = defaultTexture.lock();
    var pixelData = new Uint8Array(4);
    pixelData[0] = 255.0;
    pixelData[1] = 255.0;
    pixelData[2] = 255.0;
    pixelData[3] = 0.0;
    pixels.set(pixelData);
    defaultTexture.unlock();

    var defaultScreenSpaceTextMaterial = new pc.StandardMaterial();
    defaultScreenSpaceTextMaterial.msdfMap = defaultTexture;
    defaultScreenSpaceTextMaterial.useLighting = false;
    defaultScreenSpaceTextMaterial.useGammaTonemap = false;
    defaultScreenSpaceTextMaterial.useFog = false;
    defaultScreenSpaceTextMaterial.useSkybox = false;
    defaultScreenSpaceTextMaterial.diffuse = new pc.Color(0,0,0,1); // black diffuse color to prevent ambient light being included
    defaultScreenSpaceTextMaterial.emissive = new pc.Color(1,1,1,1);
    defaultScreenSpaceTextMaterial.opacity = 1;
    defaultScreenSpaceTextMaterial.blendType = pc.BLEND_PREMULTIPLIED;
    defaultScreenSpaceTextMaterial.depthWrite = false;
    defaultScreenSpaceTextMaterial.depthTest = false;
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
            indices.push(i*4 + 1, i*4 + 2, i*4 + 3);
        }

        return pc.createMesh(device, positions, {normals: normals, uvs: uvs, indices: indices});
    };

    // updates mesh positions and uvs based on the font and the character specified
    var updateMeshes = function (text, font) {
        var width = 1;
        var height = 1;
        var maxScale = -1;
        var maxYOffset = 0;
        var maxWidth = 0;

        // find maxScale and maxYOffset
        for (var i = 0; i < 2; i++) {
            var char = text.charCodeAt(i);

            var charData = font.data.chars[char];
            if (! charData) {
                meshInstances[i].visible = false;
                continue;
            }

            meshInstances[i].visible = true;

            // find max character scale
            // so that we scale all smaller characters based on that value
            maxScale = Math.max(maxScale, 1 / (charData.scale || 1));

            // find max yoffset so that we line up characters a bit better in the preview
            maxYOffset = Math.max(maxYOffset, charData.yoffset / charData.height || 0);
        }

        positions.length = 0;
        uvs.length = 0;

        for (var i = 0; i < 2; i++) {
            var char = text.charCodeAt(i);
            var charData = font.data.chars[char];
            if (! charData) continue;

            var map = charData.map || 0;

            // scale of character relative to max scale
            var scale = 1 / (charData.scale || 1);
            scale = scale / maxScale;

            // yoffset of character relative to maxYOffset
            var yoffset = maxYOffset - (charData.yoffset / charData.height || 0) - height / 2;

            // calculate position for character
            positions.push(maxWidth, yoffset, 0);
            positions.push(maxWidth + scale*width, yoffset, 0);
            positions.push(maxWidth + scale*width, yoffset + height*scale, 0);
            positions.push(maxWidth, yoffset + height*scale, 0);

            // remember maxWidth
            maxWidth += scale*width;

            // calculate uvs
            var x1 = charData.x / font.data.info.maps[map].width;
            var y1 = 1 - (charData.y + charData.height) / font.data.info.maps[map].height;
            var x2 = (charData.x + charData.width) / font.data.info.maps[map].width;
            var y2 = 1 - charData.y / font.data.info.maps[map].height;

            uvs.push(x1, y1);
            uvs.push(x2, y1);
            uvs.push(x2, y2);
            uvs.push(x1, y2);

            // set correct texture for character
            meshInstances[i].setParameter("texture_msdfMap", font.textures[map]);
        }

        // offset positions to be centered vertically
        var offset = -maxWidth / 2;
        for (var i = 0; i < positions.length; i+=3) {
            positions[i] += offset;
        }

        // update vertices
        for (var i = 0; i < 2; i++) {
            var vb = meshInstances[i].mesh.vertexBuffer;
            var it = new pc.VertexIterator(vb);

            var numVertices = 4;
            for (var v = 0; v < numVertices; v++) {
                it.element[pc.SEMANTIC_POSITION].set(positions[i*4*3 + v*3+0], positions[i*4*3 + v*3+1], positions[i*4*3 + v*3+2]);
                it.element[pc.SEMANTIC_TEXCOORD0].set(uvs[i*4*2 + v*2+0], uvs[i*4*2 + v*2+1]);
                it.next();
            }
            it.end();

        }

        return true;

    };

    var hasChars = function (chars, font) {
        for (var i = 0; i < chars.length; i++)
            if (! font.data.chars[chars.charCodeAt(i)])
                return false;

        return true;
    };

    // create one mesh per letter and add them to a model
    var node = new pc.GraphNode();
    var model = new pc.Model();
    var meshes = [createMesh(1), createMesh(1)];
    var meshInstances = [
        new pc.MeshInstance(node, meshes[0], defaultScreenSpaceTextMaterial),
        new pc.MeshInstance(node, meshes[1], defaultScreenSpaceTextMaterial)
    ];
    meshInstances[0].screenSpace = true;
    meshInstances[1].screenSpace = true;
    model.meshInstances.push(meshInstances[0]);
    model.meshInstances.push(meshInstances[1]);


    editor.method('preview:font:render', function(asset, canvas, args) {
        args = args || { };

        var width = canvas.width;
        var height = canvas.height;

        var target = editor.call('preview:getTexture', width, height);

        camera.aspectRatio = height / width;
        camera.renderTarget = target;

        var engineAsset = app.assets.get(asset.get('id'));

        // skip if the font isn't ready
        if (! engineAsset || ! engineAsset.resource || ! engineAsset.resource.textures || ! engineAsset.resource.textures.length || ! engineAsset.resource.data || ! engineAsset.resource.data.chars) {
            renderer.render(scene, camera);
            return;
        }

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

        // set the font texture based on which characters we chose to display
        // defaultScreenSpaceTextMaterial.msdfMap = engineAsset.resource.textures[0];
        defaultScreenSpaceTextMaterial.setParameter('font_sdfIntensity', asset.get('data.intensity'));
        defaultScreenSpaceTextMaterial.update();

        scene.addModel(model);

        updateMeshes(text, engineAsset.resource);

        renderer.render(scene, camera);

        scene.removeModel(model);

        // read pixels from texture
        device.gl.bindFramebuffer(device.gl.FRAMEBUFFER, target._glFrameBuffer);
        device.gl.readPixels(0, 0, width, height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, target.pixels);

        // render to canvas
        canvas.getContext('2d').putImageData(new ImageData(target.pixelsClamped, width, height), 0, 0);
    });
});
