import { decodeRgbExr, init } from 'exrs';
import { decode as decodePng } from 'fast-png';

import type { Codecs } from '../../src/texture-convert/convert';

// the same exrs the server's image-loader decodes with; init falls back to reading the wasm from disk
await init();

// node stand-ins for the worker's wasm codecs: png via fast-png, exr via exrs, lossy formats recorded
export const encoded: { format: string; width: number; height: number; data: number[] }[] = [];

export const nodeCodecs: Codecs = {
    decode: async (_format, buffer) => {
        const png = decodePng(new Uint8Array(buffer));
        const n = png.width * png.height;
        const data = new Uint8Array(n * 4);
        for (let i = 0; i < n; i++) {
            const s = i * png.channels;
            const grey = png.channels <= 2;
            data[i * 4] = png.data[s];
            data[i * 4 + 1] = png.data[grey ? s : s + 1];
            data[i * 4 + 2] = png.data[grey ? s : s + 2];
            data[i * 4 + 3] = png.channels === 2 || png.channels === 4 ? png.data[s + png.channels - 1] : 255;
        }
        return { data, width: png.width, height: png.height };
    },
    encode: async (format, img) => {
        encoded.push({ format, width: img.width, height: img.height, data: [...img.data] });
        return new ArrayBuffer(1);
    },
    exr: async (buffer) => {
        const { width, height, interleavedRgbPixels } = decodeRgbExr(new Uint8Array(buffer));
        return { data: interleavedRgbPixels, width, height };
    }
};
