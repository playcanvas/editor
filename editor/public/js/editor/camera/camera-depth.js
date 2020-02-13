editor.once('viewport:load', function() {
    'use strict';

    var depthTarget;
    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var scene = app.scene;
    var renderer = app.renderer;
    var device = renderer.device;
    var rendered = false;
    var canvas = editor.call('viewport:canvas');

    editor.on('viewport:preUpdate', function() {
        rendered = false;
    });

    editor.method('camera:depth:render', function(camera) {
        var rect = camera.camera._rect;
        var width = Math.floor(rect.width * device.width);
        var height = Math.floor(rect.height * device.height);

        if (depthTarget && (depthTarget.width !== width || depthTarget.height !== height)) {
            depthTarget.destroy();
            depthTarget = null;
        }

        if (! depthTarget) {
            var colorBuffer = new pc.Texture(device, {
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                width: width,
                height: height
            });
            colorBuffer.minFilter = pc.FILTER_NEAREST;
            colorBuffer.magFilter = pc.FILTER_NEAREST;
            colorBuffer.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
            colorBuffer.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
            depthTarget = new pc.RenderTarget(device, colorBuffer, {
                depth: true
            });
        }

        var cam = camera.camera;
        renderer.setCamera(cam);
        renderer.clearView(camera, depthTarget)

        var oldBlending = device.getBlending();
        device.setBlending(false);

        var drawCalls = scene.drawCalls;
        var drawCallsCount = drawCalls.length;

        for (var i = 0; i < drawCallsCount; i++) {
            var opChan = 'r';
            var meshInstance = drawCalls[i];
            if (! meshInstance.command && meshInstance.material && meshInstance.material.blendType === pc.BLEND_NONE) {
                var mesh = meshInstance.mesh;

                renderer.modelMatrixId.setValue(meshInstance.node.worldTransform.data);

                var material = meshInstance.material;
                if (material.opacityMap) {
                    renderer.opacityMapId.setValue(material.opacityMap);
                    renderer.alphaTestId.setValue(material.alphaTest);
                    if (material.opacityMapChannel) opChan = material.opacityMapChannel;
                }

                if (meshInstance.skinInstance) {
                    renderer._skinDrawCalls++;
                    if (device.supportsBoneTextures) {
                        var boneTexture = meshInstance.skinInstance.boneTexture;
                        renderer.boneTextureId.setValue(boneTexture);
                        renderer.boneTextureSizeId.setValue([boneTexture.width, boneTexture.height]);
                    } else {
                        renderer.poseMatrixId.setValue(meshInstance.skinInstance.matrixPalette);
                    }
                }

                var shader = meshInstance._shader[pc.SHADER_DEPTH];
                if (!shader) {
                    app.renderer.updateShader(meshInstance, meshInstance._shaderDefs, null, pc.SHADER_DEPTH);
                    shader = meshInstance._shader[pc.SHADER_DEPTH];
                }
                device.setShader(shader);

                var style = meshInstance.renderStyle;

                device.setVertexBuffer(mesh.vertexBuffer, 0);
                device.setIndexBuffer(mesh.indexBuffer[style]);
                device.draw(mesh.primitive[style]);
                renderer._depthDrawCalls++;
            }
        }

        device.setBlending(oldBlending);

        rendered = true;

        return depthTarget;
    });


    editor.method('camera:depth:pixelAt', function(camera, x, y) {
        if (! depthTarget || ! rendered)
            editor.call('camera:depth:render', camera);

        x *= canvas.pixelRatio;
        y *= canvas.pixelRatio;

        var prevRenderTarget = device.renderTarget;

        device.setRenderTarget(depthTarget);
        device.updateBegin();

        var pixels = new Uint8Array(4);
        device.readPixels(x, depthTarget.height - y, 1, 1, pixels);

        device.updateEnd();

        device.setRenderTarget(prevRenderTarget);

        var bitShift = new pc.Vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
        var color = new pc.Vec4(pixels[0], pixels[1], pixels[2], pixels[3]);
        var colorDistance = color.dot(bitShift);

        if (colorDistance >= 255)
            return null;

        var distance = (camera.nearClip || 0.0001) + (camera.farClip * (colorDistance / 255.0));
        var point = new pc.Vec3();

        camera.camera.screenToWorld(x, y, distance, depthTarget.width, depthTarget.height, point);

        return point;
    });
});
