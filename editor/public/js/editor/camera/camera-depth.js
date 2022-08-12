editor.once('viewport:load', function () {
    'use strict';

    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    const scene = app.scene;
    const renderer = app.renderer;
    const device = app.graphicsDevice;
    const canvas = editor.call('viewport:canvas');

    let depthTarget;
    let rendered = false;

    editor.on('viewport:preUpdate', function () {
        rendered = false;
    });

    editor.method('camera:depth:render', function (camera) {
        const rect = camera.rect;
        const rectWidth = rect.z;
        const rectHeight = rect.w;
        const width = Math.floor(rectWidth * device.width);
        const height = Math.floor(rectHeight * device.height);

        if (depthTarget && (depthTarget.width !== width || depthTarget.height !== height)) {
            depthTarget.destroy();
            depthTarget = null;
        }

        if (!depthTarget) {
            const colorBuffer = new pc.Texture(device, {
                format: pc.PIXELFORMAT_R8_G8_B8_A8,
                minFilter: pc.FILTER_NEAREST,
                magFilter: pc.FILTER_NEAREST,
                addressU: pc.ADDRESS_CLAMP_TO_EDGE,
                addressV: pc.ADDRESS_CLAMP_TO_EDGE,
                width: width,
                height: height
            });
            depthTarget = new pc.RenderTarget({
                name: 'CameraDepthRenderRT',
                colorBuffer: colorBuffer,
                depth: true
            });
        }

        const cam = camera.camera;
        renderer.setCamera(cam);
        renderer.clearView(cam, depthTarget, true);

        const oldBlending = device.getBlending();
        device.setBlending(false);

        const drawCalls = scene.drawCalls;
        const drawCallsCount = drawCalls.length;

        for (let i = 0; i < drawCallsCount; i++) {
            const meshInstance = drawCalls[i];
            if (!meshInstance.command && meshInstance.material && meshInstance.material.blendType === pc.BLEND_NONE) {
                const mesh = meshInstance.mesh;

                renderer.modelMatrixId.setValue(meshInstance.node.worldTransform.data);

                const material = meshInstance.material;
                if (material.opacityMap) {
                    renderer.opacityMapId.setValue(material.opacityMap);
                    renderer.alphaTestId.setValue(material.alphaTest);
                }

                if (meshInstance.skinInstance) {
                    renderer._skinDrawCalls++;
                    if (device.supportsBoneTextures) {
                        const boneTexture = meshInstance.skinInstance.boneTexture;
                        renderer.boneTextureId.setValue(boneTexture);
                        renderer.boneTextureSizeId.setValue([boneTexture.width, boneTexture.height, 1.0 / boneTexture.width, 1.0 / boneTexture.height]);
                    } else {
                        renderer.poseMatrixId.setValue(meshInstance.skinInstance.matrixPalette);
                    }
                }

                let shader = meshInstance._shader[pc.SHADER_DEPTH];
                if (!shader) {
                    renderer.updateShader(meshInstance, meshInstance._shaderDefs, null, pc.SHADER_DEPTH);
                    shader = meshInstance._shader[pc.SHADER_DEPTH];
                }
                device.setShader(shader);

                const style = meshInstance.renderStyle;

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


    editor.method('camera:depth:pixelAt', function (camera, x, y) {
        if (!depthTarget || !rendered)
            editor.call('camera:depth:render', camera);

        x *= canvas.pixelRatio;
        y *= canvas.pixelRatio;

        const prevRenderTarget = device.renderTarget;

        device.setRenderTarget(depthTarget);
        device.updateBegin();

        const pixels = new Uint8Array(4);
        device.readPixels(x, depthTarget.height - y, 1, 1, pixels);

        device.updateEnd();

        device.setRenderTarget(prevRenderTarget);

        const bitShift = new pc.Vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
        const color = new pc.Vec4(pixels[0], pixels[1], pixels[2], pixels[3]);
        const colorDistance = color.dot(bitShift);

        if (colorDistance >= 255)
            return null;

        const distance = (camera.nearClip || 0.0001) + (camera.farClip * (colorDistance / 255.0));

        return camera.camera.screenToWorld(x, y, distance, depthTarget.width, depthTarget.height);
    });
});
