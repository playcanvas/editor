import { WorkerServer } from '@/core/worker/worker-server';

const workerServer = new WorkerServer(self);
workerServer.on('convert', async (frontendURL, buffer, sourceFormat, targetFormat) => {
    const { convert } = await import(`${frontendURL}js/texture-convert/index.js`);
    const convertedBuffer = await convert(frontendURL, buffer, sourceFormat, targetFormat);
    workerServer.with([convertedBuffer]).send('convert', convertedBuffer);
});
