import { WorkerServer } from '../core/worker/worker-server.ts';

const compress = (codec, pixels, width, height) => {
    const resultDataPtrPtr = codec._malloc(4);
    const resultSizePtr = codec._malloc(4);
    const imageData = codec._malloc(width * height * 4);

    const words = new Uint32Array(pixels.buffer);

    // copy pixels into wasm memory
    for (let i = 0; i < width * height; ++i) {
        codec.HEAPU32[imageData / 4 + i] = words[i];
    }

    // invoke compress
    codec._lodepng_encode32(resultDataPtrPtr, resultSizePtr, imageData, width, height);

    // read results
    const u32 = codec.HEAPU32;
    const result = codec.HEAPU8.slice(u32[resultDataPtrPtr / 4], u32[resultDataPtrPtr / 4] + u32[resultSizePtr / 4]);

    codec._free(resultDataPtrPtr);
    codec._free(resultSizePtr);
    codec._free(imageData);

    return result;
};

const workerServer = new WorkerServer(self);
workerServer.on('init', async (glueUrl, wasmUrl) => {
    importScripts(glueUrl);
    // @ts-ignore
    const codec = await self.lodepng({ locateFile: () => wasmUrl });

    workerServer.on('export', (esn, pixels, width, height) => {
        const result = compress(codec, pixels, width, height);
        workerServer.with([result.buffer]).send('export', esn, result);
    });

    workerServer.send('init');
});
