import { generateFont } from '@playcanvas/font-tools';
import { createCanvasImageBackend } from '@playcanvas/font-tools/image-backend-canvas';
import { createMsdfgenGlyphSource } from '@playcanvas/font-tools/glyph-source-msdfgen';

import { WorkerServer } from '@/core/worker/worker-server';

const workerServer = new WorkerServer(self as unknown as DedicatedWorkerGlobalScope);

// ponytail: kerning (fontkit) skipped in v1 to keep the bundle free of node polyfills; add via kerningSource when needed

type Options = {
    chars?: string;
    fontName?: string;
    intensity?: number;
    invert?: boolean;
    size?: number;
    pxrange?: number;
};

const generate = async (frontendURL: string, buffer: ArrayBuffer, options: Options) => {
    const ttf = new Uint8Array(buffer);
    const glyphSource = await createMsdfgenGlyphSource(ttf, {
        moduleOverrides: { locateFile: () => `${frontendURL}js/msdfgen.wasm` }
    });

    const { data, textures } = await generateFont({
        chars: options.chars,
        fontName: options.fontName,
        intensity: options.intensity,
        invert: options.invert,
        size: options.size,
        pxrange: options.pxrange,
        glyphSource,
        imageBackend: createCanvasImageBackend()
    });
    glyphSource.dispose?.();

    workerServer.with(textures.map((t) => t.buffer as ArrayBuffer)).send('generate', data, textures);
};

workerServer.on('generate', (frontendURL, buffer, options) => {
    generate(frontendURL, buffer, options ?? {}).catch((e) => workerServer.send('error', String(e?.message ?? e)));
});
