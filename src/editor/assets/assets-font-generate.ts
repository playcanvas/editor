import { WorkerClient } from '@/core/worker/worker-client';

type FontGenerateOptions = {
    chars?: string;
    fontName?: string;
    intensity?: number;
    invert?: boolean;
    size?: number;
    pxrange?: number;
};

type FontGenerateResult = {
    data: any;
    textures: Uint8Array[];
};

const STARTUP_FAILED = 'the font generator could not be loaded';

editor.once('load', () => {
    // generate MSDF font data (json + atlas png(s)) from a font file buffer, off the main thread
    editor.method(
        'fonts:generate',
        (
            buffer: ArrayBuffer,
            options: FontGenerateOptions,
            callback: (err: string | null, result?: FontGenerateResult) => void
        ) => {
            const client = new WorkerClient(`${config.url.frontend}js/font-generate.worker.js`);

            let settled = false;
            const settle = (err: string | null, result?: FontGenerateResult) => {
                if (settled) {
                    return;
                }
                settled = true;
                callback(err, result);
                client.stop();
            };

            // bind before start: a worker that 404s or throws at top level fires 'error' before
            // 'ready', and an unreported failure leaves the caller's promise pending forever
            let ready = false;
            client.once('error', (err) => settle(err ?? (ready ? 'font generation failed' : STARTUP_FAILED)));
            client.once('ready', () => {
                ready = true;
                client.once('generate', (data, textures) => settle(null, { data, textures }));
                client.with([buffer]).send('generate', config.url.frontend, buffer, options);
            });
            // there is no server-side fallback, so a failure to load the worker or its wasm has to
            // say what actually went wrong rather than read as a bad font file
            client.start().catch((err) => settle(`${STARTUP_FAILED} (${err?.message ?? err})`));
        }
    );
});
