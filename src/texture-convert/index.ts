// exrs' own binding (bundled inside exrs@1.0.3, the server's decoder), initialised with an explicit module: the
// wrapper's init resolves the wasm from import.meta.url, which the production target compiles away
import initExr, { readExrRgb } from 'exrs/node_modules/exrs-raw-wasm-bindgen/exrs_raw_wasm_bindgen.js';

import type { Codecs } from './convert';
import type { Rgba } from './pixels';

// dynamic import paths must be explicitly declared otherwise tree-shaking will remove them from the build
const importImageDecoder = (format) => {
    switch (format) {
        case 'avif':
            return import('@jsquash/avif/decode.js');
        case 'webp':
            return import('@jsquash/webp/decode.js');
        case 'png':
            return import('@jsquash/png/decode.js');
        case 'jpeg':
            return import('@jsquash/jpeg/decode.js');
    }
};

const importImageEncoder = (format) => {
    switch (format) {
        case 'avif':
            return import('@jsquash/avif/encode.js');
        case 'webp':
            return import('@jsquash/webp/encode.js');
        case 'png':
            return import('@jsquash/png/encode.js');
        case 'jpeg':
            return import('@jsquash/jpeg/encode.js');
    }
};

// compiles a wasm from its path under wasm/ (codecs/<format>/<kind>.wasm, exrs/...); the worker streams it, node
// tests read it from disk
type Wasm = (path: string) => Promise<WebAssembly.Module>;

type Codec = { init: (...args: unknown[]) => Promise<unknown>; default: (...args: unknown[]) => Promise<any> };

export const EXR_WASM = 'exrs/exrs_raw_wasm_bindgen_bg.wasm';

export const streamWasm = (frontendURL: string) => (path: string) =>
    WebAssembly.compileStreaming(fetch(`${frontendURL}wasm/${path}`));

// provide locateFile so emscripten codecs don't call new URL("xxx.wasm", import.meta.url), which fails in the
// bundled worker. the url is unused because a pre-compiled module is passed via instantiateWasm. the png codec
// (wasm-bindgen) ignores the second argument
const load = async (wasm: Wasm, format: string, kind: 'dec' | 'enc') => {
    const codec = (await (kind === 'dec'
        ? importImageDecoder(format)
        : importImageEncoder(format))) as unknown as Codec;
    await codec.init(await wasm(`codecs/${format}/${kind}.wasm`), {
        locateFile: (file: string) => `${format}/${file}`
    });
    return codec.default;
};

export const convert = async (frontendURL, buffer, sourceFormat, targetFormat): Promise<ArrayBuffer> => {
    const wasm = streamWasm(frontendURL);
    const encode = await load(wasm, targetFormat, 'enc');
    const decode = await load(wasm, sourceFormat, 'dec');
    const encoded = await encode(await decode(buffer));

    // PNG encode method doesn't return a buffer, so you must access it manually.
    return encoded.buffer ? encoded.buffer : encoded;
};

// without OffscreenCanvas (and in node), sharp's settings in texture-convert applyFormat: jpeg q92 baseline, standard tables and 4:2:0 (mozjpeg's auto
// subsampling picks otherwise), webp q80. mozjpeg's trellis quantization can't be turned off, so jpeg stays lossy-close
export const ENCODE_OPTIONS = {
    jpeg: { quality: 92, progressive: false, quant_table: 0, auto_subsample: false, chroma_subsample: 2 },
    webp: { quality: 80 }
};

export const codecs = (wasm: Wasm) =>
    ({
        decode: async (format, buffer) => {
            const img = await (await load(wasm, format, 'dec'))(buffer);
            return {
                data: new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength),
                width: img.width,
                height: img.height
            };
        },
        encode: async (format, img) => {
            const data = new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.byteLength);
            return (await load(wasm, format, 'enc'))(
                { data, width: img.width, height: img.height },
                ENCODE_OPTIONS[format]
            );
        },

        // decodeRgbExr in exrs, as image-loader decodes; init is a no-op once loaded
        exr: async (buffer) => {
            await initExr({ module_or_path: await wasm(EXR_WASM) });
            const res = readExrRgb(new Uint8Array(buffer));
            const out = { data: res.data, width: res.width, height: res.height };
            res.free();
            return out;
        }
    }) satisfies Codecs;

// the browser's canvas jpeg (libjpeg-turbo, no trellis) is what sharp's q92 matches: mean diff ~0 against 2.4 for
// mozjpeg on busy chroma. opaque first, as sharp's removeAlpha leaves it
const canvasJpeg = async (img: Rgba) => {
    const data = new Uint8ClampedArray(img.data);
    for (let i = 3; i < data.length; i += 4) {
        data[i] = 255;
    }
    const canvas = new OffscreenCanvas(img.width, img.height);
    canvas.getContext('2d').putImageData(new ImageData(data, img.width, img.height), 0, 0);
    return (await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })).arrayBuffer();
};

export const workerCodecs = (frontendURL: string) => {
    const base = codecs(streamWasm(frontendURL));
    return {
        ...base,
        encode: (format, img) =>
            format === 'jpeg' && typeof OffscreenCanvas !== 'undefined' ? canvasJpeg(img) : base.encode(format, img)
    } satisfies Codecs;
};

export { convertTexture, sourceMeta } from './convert';
