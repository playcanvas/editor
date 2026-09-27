import { WorkerServer } from '@/core/worker/worker-server';
import { concatenate } from '@/launch/assets/concatenate-scripts';
import type { ScriptFile } from '@/launch/assets/concatenate-scripts';

const workerServer = new WorkerServer(self as unknown as DedicatedWorkerGlobalScope);

// a blob crosses to the page by reference, so the page never copies the joined script
workerServer.on('concatenate', (files: ScriptFile[]) => {
    const { code, ranges } = concatenate(files);
    workerServer.send('concatenate', new Blob([code], { type: 'text/javascript' }), ranges);
});
