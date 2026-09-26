import type { Observer } from '@playcanvas/observer';

import { createLog } from '@/common/sentry';
import { createThumbnailQueue } from '@/common/texture-thumbnails';
import { WorkerClient } from '@/core/worker/worker-client';
import { config } from '@/editor/config';

const log = createLog('<PATH>');

const STARTUP_FAILED = 'the thumbnail generator could not be loaded';

// a worker script that never runs (an empty or blocked response) never says ready, which would stall the queue
const READY_TIMEOUT = 15000;

editor.once('load', () => {
    const generate = (buffer: ArrayBuffer, rgbm: boolean) =>
        new Promise<ArrayBuffer[]>((resolve, reject) => {
            const client = new WorkerClient(`${config.url.frontend}js/texture-thumbnails.worker.js`);

            let settled = false;
            const settle = (err: string | null, out?: ArrayBuffer[]) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timer);
                client.stop();
                return err ? reject(new Error(err)) : resolve(out);
            };

            // bind before start: a worker that 404s fires 'error' before 'ready'
            let ready = false;
            const timer = setTimeout(() => settle(STARTUP_FAILED), READY_TIMEOUT);
            client.once('error', (err) => settle(err ?? (ready ? 'thumbnail generation failed' : STARTUP_FAILED)));
            client.once('ready', () => {
                ready = true;
                clearTimeout(timer);
                client.once('generate', (out: ArrayBuffer[]) => settle(null, out));
                client.with([buffer]).send('generate', buffer, rgbm);
            });
            client.start().catch((err) => settle(`${STARTUP_FAILED} (${err?.message ?? err})`));
        });

    const upload = (id: number, thumbs: Record<string, Blob>) =>
        editor.api.globals.rest.assets.assetThumbnailsUpload(`${id}`, thumbs).promisify();

    // the server job is the fallback so a texture never ends up without thumbnails
    const fallback = (id: number, err: unknown) => {
        log.error(`client thumbnails failed for asset ${id}`, err);
        editor.call('realtime:send', 'pipeline', { name: 'thumbnails', data: { target: id } });
    };

    const enqueue = createThumbnailQueue({ generate, upload, fallback });

    // generate and upload a texture's thumbnails from its file (or, rgbm false, a decoded preview)
    editor.method('assets:thumbnails:texture', (asset: Observer, source: Blob, rgbm?: boolean) =>
        enqueue(asset, source, rgbm)
    );
});
