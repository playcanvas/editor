// port of pipeline/jobs/texture-meta getFileMeta for the formats whose sharp metadata is fully
// determined by the file header. anything else returns null and the server job runs as before

export type TextureMeta = {
    format: string;
    type: string;
    width: number;
    height: number;
    alpha: boolean;
    depth: number;
    srgb: boolean;
    interlaced: boolean;
};

// sharp's default limitInputPixels, so bigger images never get server meta either
const MAX_DIM = 16384;

// the server picks these decoders by extension, not by content (image-loader.js loadImage)
const SERVER_ONLY = new Set(['tga', 'bmp', 'exr']);

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// libspng: bands per colour type (before tRNS adds alpha) and the bit depths each allows
const PNG_CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 3, 4: 2, 6: 4 };
const PNG_DEPTHS: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };

const latin1 = new TextDecoder('latin1');
const ascii = (b: Uint8Array, o: number, n: number) => latin1.decode(b.subarray(o, o + n));
const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const le16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const le24 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);

// deriveImageType: grey when sharp reports <= 2 channels
const raster = (
    format: string,
    width: number,
    height: number,
    channels: number,
    alpha: boolean,
    depth: number,
    srgb: boolean
): TextureMeta => {
    const grey = channels <= 2;
    const type = alpha ? (grey ? 'GrayscaleAlpha' : 'TrueColorAlpha') : grey ? 'Grayscale' : 'TrueColor';
    return { format, type, width, height, alpha, depth, srgb, interlaced: false };
};

const png = (b: Uint8Array) => {
    if (u32(b, 8) !== 13 || ascii(b, 12, 4) !== 'IHDR') {
        return null;
    }
    const bits = b[24];
    const color = b[25];
    if (!PNG_DEPTHS[color]?.includes(bits) || b[26] !== 0 || b[27] !== 0 || b[28] > 1) {
        return null;
    }

    // a tRNS chunk before the image data makes libspng add an alpha band
    let trns = false;
    for (let o = 33; o + 8 <= b.length && !trns; o += 12 + u32(b, o)) {
        const name = ascii(b, o + 4, 4);
        if (name === 'IDAT' || name === 'IEND') {
            break;
        }
        trns = name === 'tRNS';
    }

    const grey = color === 0 || color === 4;
    const alpha = color === 4 || color === 6 || trns;

    // 16-bit loads as rgb16/grey16 and grey as b-w, none of which are srgb
    const channels = PNG_CHANNELS[color] + (trns ? 1 : 0);
    return raster('png', u32(b, 16), u32(b, 20), channels, alpha, bits === 16 ? 16 : 8, !grey && bits !== 16);
};

const jpeg = (b: Uint8Array) => {
    for (let o = 2; o + 9 < b.length; ) {
        if (b[o] !== 0xff) {
            return null;
        }
        const m = b[o + 1];
        if (m === 0xff) {
            o++;
        } else if (m >= 0xd0 && m <= 0xd8) {
            // RSTn and SOI have no length
            o += 2;
        } else if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
            // baseline, extended and progressive huffman only; lossless and arithmetic go to the server
            const comps = b[o + 9];
            if (m > 0xc2 || b[o + 4] !== 8 || (comps !== 1 && comps !== 3 && comps !== 4)) {
                return null;
            }

            // 1 component loads as b-w and 4 as cmyk, neither srgb
            return raster('jpeg', u16(b, o + 7), u16(b, o + 5), comps, false, 8, comps === 3);
        } else {
            o += 2 + u16(b, o + 2);
        }
    }
    return null;
};

const webp = (b: Uint8Array) => {
    const chunk = ascii(b, 12, 4);
    if (chunk === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
        return raster('webp', le16(b, 26) & 0x3fff, le16(b, 28) & 0x3fff, 3, false, 8, true);
    }
    if (chunk === 'VP8L' && b[20] === 0x2f) {
        const bits = (b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)) >>> 0;
        const alpha = ((bits >>> 28) & 1) === 1;
        return raster('webp', (bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1, alpha ? 4 : 3, alpha, 8, true);
    }

    // animations stay on the server
    if (chunk === 'VP8X' && !(b[20] & 0x02)) {
        const alpha = (b[20] & 0x10) !== 0;
        return raster('webp', le24(b, 24) + 1, le24(b, 27) + 1, alpha ? 4 : 3, alpha, 8, true);
    }
    return null;
};

// decodeHdr's header scan in pipeline/shared/base/image-loader.js: the first blank line (lf or crlf)
const headerEnd = (b: Uint8Array) => {
    for (let i = 0; i < b.length - 1; i++) {
        if (b[i] === 0x0a && b[i + 1] === 0x0a) {
            return i + 2;
        }
        if (b[i] === 0x0d && b[i + 1] === 0x0a && b[i + 2] === 0x0d && b[i + 3] === 0x0a) {
            return i + 4;
        }
    }
    return -1;
};

// the float branch of getFileMeta; the resolution line is read the way decodeHdr reads it
const hdr = (b: Uint8Array): TextureMeta | null => {
    const start = headerEnd(b);
    if (start < 0) {
        return null;
    }
    let line = '';

    // buffer.toString('ascii') drops the top bit
    for (let i = start; i < b.length && b[i] !== 0x0a; i++) {
        line += String.fromCharCode(b[i] & 0x7f);
    }
    const m = /([+-])([XY])\s+(\d+)\s+([+-])([XY])\s+(\d+)/.exec(line);
    if (!m) {
        return null;
    }
    const x = m[2] === 'X';
    return {
        format: 'hdr',
        type: 'TrueColor',
        width: parseInt(x ? m[3] : m[6], 10),
        height: parseInt(x ? m[6] : m[3], 10),
        alpha: false,
        depth: 32,
        srgb: false,
        interlaced: false
    };
};

const detect = (b: Uint8Array, ext: string) => {
    if (ext === 'hdr') {
        return hdr(b);
    }
    if (SERVER_ONLY.has(ext)) {
        return null;
    }

    // sharp sniffs everything else by content
    if (b.length > 33 && PNG_SIGNATURE.every((v, i) => b[i] === v)) {
        return png(b);
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
        return jpeg(b);
    }
    if (b.length > 30 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') {
        return webp(b);
    }
    return null;
};

/**
 * The meta pipeline.texture.meta would write for this file, or null when only the server can tell.
 *
 * @param bytes - the texture file
 * @param name - file name; picks the extension-decoded formats like the server does
 */
export const textureMeta = (bytes: Uint8Array, name = '') => {
    // path.extname: a leading dot is part of the name, not an extension
    const meta = detect(bytes, /(?!^)\.([^.]+)$/.exec(name)?.[1].toLowerCase() ?? '');
    return meta && meta.width > 0 && meta.height > 0 && meta.width <= MAX_DIM && meta.height <= MAX_DIM ? meta : null;
};

/**
 * Port of texture-meta detectNormalmap over 8-bit rgba pixels.
 *
 * @param rgba - decoded pixels
 */
export const isNormalMap = (rgba: ArrayLike<number>) => {
    let yes = 0;
    let no = 0;
    for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3] > 0) {
            const r = rgba[i] / 128 - 1;
            const g = rgba[i + 1] / 128 - 1;
            const b = rgba[i + 2] / 128 - 1;
            const len = Math.sqrt(r * r + g * g + b * b);
            if (len < 0.7 || len > 1.3) {
                no++;
            } else {
                yes++;
            }
        }
    }
    return no / yes < 0.01;
};
