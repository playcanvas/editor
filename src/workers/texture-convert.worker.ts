import { WorkerServer } from '@/core/worker/worker-server';

const workerServer = new WorkerServer(self);

const lib = (frontendURL: string) => import(`${frontendURL}js/texture-convert/index.js`);

const fail = (e: unknown) => workerServer.send('error', String((e as Error)?.message ?? e));

workerServer.on('convert', async (frontendURL, buffer, sourceFormat, targetFormat) => {
    const { convert } = await lib(frontendURL);
    const convertedBuffer = await convert(frontendURL, buffer, sourceFormat, targetFormat);
    workerServer.with([convertedBuffer]).send('convert', convertedBuffer);
});

// a rejected async handler never reaches onerror, so report it or the caller waits forever
workerServer.on('import', (frontendURL, buffer, meta, options) => {
    lib(frontendURL)
        .then(({ convertTexture, workerCodecs }) => convertTexture(buffer, meta, options, workerCodecs(frontendURL)))
        .then((res) => workerServer.with([res.file, res.preview].filter(Boolean)).send('import', res))
        .catch(fail);
});

// decision meta for every client source format (sourceMeta); never stored as the asset's meta
workerServer.on('meta', (frontendURL, buffer, name) => {
    lib(frontendURL)
        .then(({ sourceMeta, workerCodecs }) => sourceMeta(buffer, name, workerCodecs(frontendURL)))
        .then((meta) => workerServer.send('meta', meta))
        .catch(fail);
});
