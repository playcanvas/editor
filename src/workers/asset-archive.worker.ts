import { WorkerServer } from '@/core/worker/worker-server';
import { zipFiles } from '@/editor/assets/archive/zip';
import type { ZipFile } from '@/editor/assets/archive/zip';

const workerServer = new WorkerServer(self as unknown as DedicatedWorkerGlobalScope);

workerServer.on('zip', (files: ZipFile[]) => {
    // a blob crosses to the page by reference, so the page never copies the zip
    workerServer.send('zip', new Blob([zipFiles(files)], { type: 'application/zip' }));
});
