import { WorkerClient } from '@/core/worker/worker-client';

import type { ArchivePlan } from './archive/entries';
import { loadFiles } from './archive/load';

export const STARTUP_FAILED = 'the archive worker could not be loaded';

// fetches and zips off the main thread; resolves [err, data]. err is exactly
// STARTUP_FAILED only when the worker never started, i.e. before any file was fetched
const run = (plan: ArchivePlan) =>
    new Promise<[string | null, Uint8Array<ArrayBuffer> | null]>((resolve) => {
        const client = new WorkerClient(`${config.url.frontend}js/asset-archive.worker.js`);

        let settled = false;
        const settle = (err: string | null, data: Uint8Array<ArrayBuffer> | null = null) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve([err, data]);
            client.stop();
        };

        // bind before start: a worker that 404s fires 'error' before 'ready'. one binding for the
        // whole lifecycle, so an error between 'ready' and the zip reply can't go unheard
        let ready = false;
        client.once('error', (err) => settle(ready ? (err ?? 'zipping failed') : STARTUP_FAILED));
        client.once('ready', () => {
            ready = true;
            loadFiles(plan).then(
                (files) => {
                    client.once('zip', (data) => settle(null, data));
                    client.with(files.map((f) => f.data.buffer as ArrayBuffer)).send('zip', files);
                },
                (e: Error) => settle(e.message)
            );
        });
        client.start().catch(() => settle(STARTUP_FAILED));
    });

editor.once('load', () => {
    let n = 0;

    editor.method('assets:archive', async (plan: ArchivePlan) => {
        const job = `asset-archive:${++n}`;
        editor.call('status:job', job, 1);
        const [err, data] = await run(plan);
        editor.call('status:job', job);
        return [err, data && new Blob([data], { type: 'application/zip' })] as [string | null, Blob | null];
    });
});
