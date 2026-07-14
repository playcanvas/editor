import { generateFont } from '@playcanvas/font-tools';
import { createMsdfgenGlyphSource } from '@playcanvas/font-tools/glyph-source-msdfgen';
import { createCanvasImageBackend } from '@playcanvas/font-tools/image-backend-canvas';

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

const median = (r: number, g: number, b: number) => Math.max(Math.min(r, g), Math.min(Math.max(r, g), b));

// msdfgen emits an inverted signed-distance field for some fonts (notably CFF/OTF winding), which
// renders as solid blocks. a glyph's bitmap corner is always background, so if it reads "inside"
// (high median) the field is inverted and needs negating.
const isInverted = (glyphSource: any, size: number, pxrange: number) => {
    for (const cp of [72, 88, 65, 111, 101]) {
        const g = glyphSource.generateGlyph(cp, { size, pxrange });
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

    // auto-correct winding; the caller's invert flag flips on top of the detection
    const invert = isInverted(glyphSource, options.size ?? 64, options.pxrange ?? 8) !== Boolean(options.invert);

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
    glyphSource.dispose?.();

    workerServer.with(textures.map((t) => t.buffer as ArrayBuffer)).send('generate', data, textures);
};

workerServer.on('generate', (frontendURL, buffer, options) => {
    generate(frontendURL, buffer, options ?? {}).catch((e) => workerServer.send('error', String(e?.message ?? e)));
});
