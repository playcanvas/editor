import { GLYPH_SIZE, PXRANGE, generateFont } from '@playcanvas/font-tools';
import { createMsdfgenGlyphSource } from '@playcanvas/font-tools/glyph-source-msdfgen';
import { createCanvasImageBackend } from '@playcanvas/font-tools/image-backend-canvas';

import { WorkerServer } from '@/core/worker/worker-server';

const workerServer = new WorkerServer(self as unknown as DedicatedWorkerGlobalScope);

// no kerning: font-tools reads it via fontkit, which would pull node polyfills into this bundle.
// pass a kerningSource here if kerned text is needed.

type Options = {
    chars?: string;
    fontName?: string;
    intensity?: number;
    invert?: boolean;
    size?: number;
    pxrange?: number;
};

// characters the winding probe tries, in order, until the font actually has one
const PROBE_CHARS = 'HXAoe';

const median = (r: number, g: number, b: number) => Math.max(Math.min(r, g), Math.min(Math.max(r, g), b));

// msdfgen emits an inverted signed-distance field for some fonts (notably CFF/OTF winding), which
// renders as solid blocks. a glyph's bitmap corner is always background, so if it reads "inside"
// (high median) the field is inverted and needs negating. only the first glyph found is probed, and
// only its top-left pixel, so a pxrange wide enough to reach that corner misreads.
const isInverted = (glyphSource: any, size: number, pxrange: number) => {
    for (const ch of PROBE_CHARS) {
        const g = glyphSource.generateGlyph(ch.codePointAt(0), { size, pxrange });
        if (g) {
            const d = g.bitmap.data;
            return median(d[0], d[1], d[2]) > 128;
        }
    }
    return false;
};

const generate = async (frontendURL: string, buffer: ArrayBuffer, options: Options) => {
    const ttf = new Uint8Array(buffer);
    const glyphSource = await createMsdfgenGlyphSource(ttf, {
        moduleOverrides: { locateFile: () => `${frontendURL}js/msdfgen.wasm` }
    });

    // auto-correct winding; the caller's invert flag flips on top of the detection. probe at the same
    // settings generateFont will use, so take its defaults from font-tools rather than repeating them
    const invert =
        isInverted(glyphSource, options.size ?? GLYPH_SIZE, options.pxrange ?? PXRANGE) !== Boolean(options.invert);

    const { data, textures } = await generateFont({
        chars: options.chars,
        fontName: options.fontName,
        intensity: options.intensity,
        invert,
        size: options.size,
        pxrange: options.pxrange,
        glyphSource,
        imageBackend: createCanvasImageBackend()
    });
    // not in a finally: a throw here reports 'error', and the client stops this worker on every
    // settled path, so the wasm heap goes with it. keep that true if the worker is ever pooled
    glyphSource.dispose?.();

    workerServer.with(textures.map((t) => t.buffer as ArrayBuffer)).send('generate', data, textures);
};

workerServer.on('generate', (frontendURL, buffer, options) => {
    generate(frontendURL, buffer, options ?? {}).catch((e) => workerServer.send('error', String(e?.message ?? e)));
});
