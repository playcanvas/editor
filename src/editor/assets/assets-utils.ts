import { WorkerClient } from '@/core/worker/worker-client';
import { RenderTarget } from 'playcanvas';

// read the pixel data of the given texture face
const readGPUPixels = (texture, face) => {
    const rt = new RenderTarget({
        name: 'ReadPrefilteredCubemapRT',
        colorBuffer: texture,
        depth: false,
        face: face
    });
    const data = new Uint8ClampedArray(texture.width * texture.height * 4);
    const device = texture.device;
    device.setFramebuffer(rt.impl._glFrameBuffer);
    device.initRenderTarget(rt);
    device.gl.readPixels(0, 0, texture.width, texture.height, device.gl.RGBA, device.gl.UNSIGNED_BYTE, data);
    return data;
};

// get the lodepng wasm config
const worker = new WorkerClient(`${config.url.frontend}js/png-export.worker.js`);

const exportState = new Map();

let workerReady = false;
const workerQueue = [];

let esn = 0;

const enqueueExport = (pixels, width, height, resolve) => {
    const currEsn = ++esn;
    exportState.set(currEsn, resolve);
    worker.send('export', currEsn, pixels, width, height);
};

const pixelsToPngBlob = (pixels, width, height) => {
    return new Promise((resolve) => {
        if (!workerReady) {
            workerQueue.push({ pixels, width, height, resolve });
            return;
        }
        enqueueExport(pixels, width, height, resolve);
    });
};

worker.once('init', () => {
    worker.on('export', (esn, data) => {
        const resolve = exportState.get(esn);
        resolve(new Blob([data], { type: 'image/png' }));
    });

    workerReady = true;
    workerQueue.forEach(({ pixels, width, height, resolve }) => {
        enqueueExport(pixels, width, height, resolve);
    });
});

worker.once('ready', () => {
    const lodepngGlueUrl = `${config.url.frontend}wasm/lodepng/wasm.js`;
    const lodepngWasmUrl = `${config.url.frontend}wasm/lodepng/wasm.wasm`;
    worker.send('init', lodepngGlueUrl, lodepngWasmUrl);
});

worker.start();

export {
    readGPUPixels,
    pixelsToPngBlob
};
