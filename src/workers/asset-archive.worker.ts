import { WorkerServer } from '@/core/worker/worker-server';
import { zipFiles } from '@/editor/assets/archive/zip';
import type { ZipFile } from '@/editor/assets/archive/zip';

const workerServer = new WorkerServer(self as unknown as DedicatedWorkerGlobalScope);

workerServer.on('zip', (files: ZipFile[]) => {
    const out = zipFiles(files);
    workerServer.with([out.buffer as ArrayBuffer]).send('zip', out);
});
