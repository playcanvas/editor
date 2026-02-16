import { RenderPassPrepass } from 'playcanvas';

editor.once('viewport:load', (app) => {
    const scene = app.scene;
    const renderer = app.renderer;
    const device = app.graphicsDevice;
    const canvas = editor.call('viewport:canvas');

    let rendered = false;
    let prePass = null;
    let logged = false;
    const pixels = new Float32Array(1);

    editor.on('viewport:preUpdate', () => {
        rendered = false;
    });

    editor.method('camera:depth:render', (camera) => {

        if (!device.textureFloatRenderable) {
            if (!logged) {
                logged = true;
                console.warn('Device does not support float render targets. Depth picking will not work.');
            }
            return;
        }

        if (!prePass) {
            prePass = new RenderPassPrepass(device, scene, renderer, camera, {
                resizeSource: null  // automatically match its size with the backbuffer
            });
        }

        // render for the current camera
        prePass.camera = camera;
        prePass.frameUpdate();
        prePass.render();

        rendered = true;
    });

    editor.method('camera:depth:pixelAt', (camera, x, y) => {
        if (!prePass || !rendered) {
            editor.call('camera:depth:render', camera);
        }

        if (prePass === null) {
            return null;
        }

        x *= canvas.pixelRatio;
        y *= canvas.pixelRatio;

        const prevRenderTarget = device.renderTarget;
        const currRenderTarget = prePass.renderTarget;

        device.setRenderTarget(prePass.renderTarget);
        device.updateBegin();

        // read the depth value from red channel
        const gl = device.gl;
        gl.readPixels(x, currRenderTarget.height - y, 1, 1, gl.RED, gl.FLOAT, pixels);

        device.updateEnd();
        device.setRenderTarget(prevRenderTarget);

        const linearDepth = pixels[0];
        if (linearDepth === camera.farClip) {
            return null;
        }

        return camera.camera.screenToWorld(x, y, linearDepth, currRenderTarget.width, currRenderTarget.height);
    });
});
