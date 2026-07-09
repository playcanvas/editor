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

            client.once('ready', () => {
                client.once('generate', (data, textures) => {
                    callback(null, { data, textures });
                    client.stop();
                });
                client.once('error', (err) => {
                    callback(err ?? 'font generation failed');
                    client.stop();
                });
                client.with([buffer]).send('generate', config.url.frontend, buffer, options);
            });

            client.start();
        }
    );
});
