import { decode as decodePng, encode as encodePng } from 'fast-png';

import { decodeBmp } from './decode-bmp';
import { decodeHdr, hdrSize } from './decode-hdr';
import { decodeTga } from './decode-tga';
import { MAX_PIXELS, normalize } from './options';
import type { TextureMeta, TextureOptions } from './options';
import { flipRows, from16, pack, resizeRgba, tonemap, toRgbm } from './pixels';
import type { Float, Rgba } from './pixels';

export type Codecs = {
    decode: (format: string, buffer: ArrayBuffer) => Promise<Rgba>;
    encode: (format: string, img: Rgba) => Promise<ArrayBuffer>;
    exr: (buffer: ArrayBuffer) => Promise<Float>;
};

export type Converted = { file: ArrayBuffer; preview?: ArrayBuffer };

const png = (data: Uint8Array, width: number, height: number, channels: number) => {
    const out = encodePng({ width, height, data, depth: 8, channels });
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
};

// tga/bmp keep their decoded alpha: sharp's removeAlpha runs after the premultiplied resize, so a
// resized xrgb source (alpha bytes 0) comes out black on the server too. flip says whether rows are bottom-up
const decode8 = async (format: string, buffer: ArrayBuffer, meta: TextureMeta, codecs: Codecs) => {
    if (format === 'tga') {
        const img = decodeTga(new Uint8Array(buffer));
        return { img, flip: img.isBottomLeft };
    }
    if (format === 'bmp') {
        const img = decodeBmp(new Uint8Array(buffer));
        return { img, flip: img.isBottomUp };
    }
    if (format === 'png' && meta.depth > 8) {
        const img = from16(
            decodePng(new Uint8Array(buffer)) as { data: Uint16Array; width: number; height: number; channels: number }
        );
        return { img, flip: false };
    }
    return { img: await codecs.decode(format, buffer), flip: false };
};

/**
 * The work pipeline.texture.convert does for one source: decode, depth convert, pow2 resize, drop
 * channels the source didn't have, encode. hdr/exr sources become rgbm png plus a tonemapped preview
 * for the thumbnailer.
 */
export const convertTexture = async (
    buffer: ArrayBuffer,
    meta: TextureMeta,
    options: TextureOptions,
    codecs: Codecs
) => {
    const format = normalize(meta.format);
    if (options.rgbm) {
        const px = format === 'hdr' ? decodeHdr(new Uint8Array(buffer)) : await codecs.exr(buffer);

        // like the server, rgbm output is never resized
        return {
            file: png(toRgbm(px), px.width, px.height, 4),
            preview: png(tonemap(px), px.width, px.height, 3)
        };
    }

    const dec = await decode8(format, buffer, meta, codecs);
    let img: Rgba = dec.img;
    if (options.size) {
        img = resizeRgba(img, options.size.width, options.size.height);
    }

    // sharp applies flip after resize whatever the call order
    if (dec.flip) {
        img = flipRows(img);
    }
    const alpha = !!meta.alpha;
    if (options.format === 'png') {
        return { file: png(pack(img.data, alpha), img.width, img.height, alpha ? 4 : 3) };
    }
    return { file: await codecs.encode(options.format, img) };
};

// exr: the first header's dataWindow (box2i xMin, yMin, xMax, yMax) after the 8-byte magic/version
const exrSize = (dv: DataView) => {
    const str = (o: number) => {
        let e = o;
        while (e < dv.byteLength && dv.getUint8(e)) {
            e++;
        }
        return [new TextDecoder().decode(new Uint8Array(dv.buffer, dv.byteOffset + o, e - o)), e + 1] as const;
    };
    let o = 8;
    while (o + 4 < dv.byteLength && dv.getUint8(o)) {
        const [name, t] = str(o);
        const [, v] = str(t);
        const size = dv.getInt32(v, true);
        if (name === 'dataWindow' && size === 16) {
            const box = (k: number) => dv.getInt32(v + 4 + k * 4, true);
            return [box(2) - box(0) + 1, box(3) - box(1) + 1];
        }
        o = v + 4 + size;
    }
    return null;
};

const headerSize = (ext: string | undefined, dv: DataView) => {
    if (ext === 'tga' && dv.byteLength >= 18) {
        return [dv.getUint16(12, true), dv.getUint16(14, true)];
    }
    if (ext === 'bmp' && dv.byteLength >= 26) {
        return [Math.abs(dv.getInt32(18, true)), Math.abs(dv.getInt32(22, true))];
    }
    return ext === 'exr' && dv.byteLength >= 8 ? exrSize(dv) : null;
};

const tag = (dv: DataView, o: number, n = 4) => String.fromCharCode(...new Uint8Array(dv.buffer, dv.byteOffset + o, n));

const u24 = (dv: DataView, o: number) => dv.getUint16(o, true) | (dv.getUint8(o + 2) << 16);

// srgb's d50 colorants (rXYZ, gXYZ, bXYZ) as icc profiles store them
const SRGB_XYZ = [0.4361, 0.2225, 0.0139, 0.3851, 0.7169, 0.0971, 0.1431, 0.0606, 0.7141];

const toSrgb = (y: number) => (y <= 0.0031308 ? y * 12.92 : 1.055 * y ** (1 / 2.4) - 0.055);

// a matrix/trc rgb profile with srgb's colorants and curves within half a level of srgb's: sharp's conversion
// to srgb leaves its pixels alone, so ignoring it matches. p3, adobe rgb, luts, grey and gamma 2.2 don't
const isSrgb = (p: Uint8Array | null) => {
    if (!p || p.byteLength < 132) {
        return false;
    }
    const dv = new DataView(p.buffer, p.byteOffset, p.byteLength);
    const tags = new Map<string, number>();
    for (let i = 0; i < dv.getUint32(128); i++) {
        tags.set(tag(dv, 132 + i * 12), dv.getUint32(136 + i * 12));
    }
    const s15 = (o: number) => dv.getInt32(o) / 65536;
    const curve = (o: number) => {
        const n = dv.getUint32(o + 8);
        if (tag(dv, o) === 'curv' && n > 1) {
            return (x: number) => dv.getUint16(o + 12 + Math.round(x * (n - 1)) * 2) / 65535;
        }
        const fn = dv.getUint16(o + 8);
        if (tag(dv, o) !== 'para' || (fn !== 3 && fn !== 4)) {
            return null;
        }
        const [g, a, b, c, d, e = 0, f = 0] = Array.from({ length: fn === 4 ? 7 : 5 }, (_, k) => s15(o + 12 + k * 4));
        return (x: number) => (x >= d ? (a * x + b) ** g + e : c * x + f);
    };
    const rgb = ['r', 'g', 'b'];
    if (tag(dv, 16) !== 'RGB ' || !rgb.every((c) => tags.has(`${c}XYZ`) && tags.has(`${c}TRC`))) {
        return false;
    }
    const xyz = rgb.flatMap((c) => [8, 12, 16].map((k) => s15(tags.get(`${c}XYZ`) + k)));
    const trcs = rgb.map((c) => curve(tags.get(`${c}TRC`)));
    return (
        ![...tags.keys()].some((t) => t.startsWith('A2B')) &&
        xyz.every((v, i) => Math.abs(v - SRGB_XYZ[i]) <= 0.003) &&
        trcs.every((t) => t && [...Array(256).keys()].every((i) => Math.abs(toSrgb(t(i / 255)) * 255 - i) <= 0.5))
    );
};

// an embedded profile's bytes (inflated for png's iccp); a promise, since only inflating needs one
const profile = (dv: DataView, o: number, n: number, zlib = false) => {
    const at = Math.min(o, dv.byteLength);
    const b = new Uint8Array(dv.buffer, dv.byteOffset + at, Math.max(0, Math.min(n, dv.byteLength - at))).slice();
    return zlib
        ? new Response(
              new Blob([b.subarray(b.indexOf(0) + 2)]).stream().pipeThrough(new DecompressionStream('deflate'))
          )
              .arrayBuffer()
              .then((r) => new Uint8Array(r))
        : Promise.resolve(b);
};

// png ihdr; libspng reads any trns chunk before the image data as an alpha channel, and iccp as a profile
const pngMeta = (dv: DataView) => {
    const color = dv.getUint8(25);
    let alpha = color === 4 || color === 6;
    let icc: Promise<Uint8Array> | null = null;
    for (let o = 33; o + 8 <= dv.byteLength && tag(dv, o + 4) !== 'IDAT'; o += 12 + dv.getUint32(o)) {
        alpha ||= tag(dv, o + 4) === 'tRNS';
        icc ??= tag(dv, o + 4) === 'iCCP' ? profile(dv, o + 8, dv.getUint32(o), true) : null;
    }
    const depth = dv.getUint8(24) === 16 ? 16 : 8;
    return {
        format: 'png',
        width: dv.getUint32(16),
        height: dv.getUint32(20),
        alpha,
        depth,
        grey: color === 0 || color === 4,
        icc
    };
};

// jpeg sof; only 8-bit huffman grey/ycbcr is decoded like sharp, so cmyk, arithmetic and 12-bit stay on the server.
// the app2 icc_profile segments before it carry the embedded profile, in order
const jpegMeta = (dv: DataView) => {
    const parts: Promise<Uint8Array<ArrayBuffer>>[] = [];
    for (let o = 2; o + 10 <= dv.byteLength && dv.getUint8(o) === 0xff; o += 2 + dv.getUint16(o + 2)) {
        const m = dv.getUint8(o + 1);
        if (m === 0xe2 && o + 16 <= dv.byteLength && tag(dv, o + 4, 12) === 'ICC_PROFILE\0') {
            parts.push(profile(dv, o + 18, dv.getUint16(o + 2) - 16));
        }
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
            const comps = dv.getUint8(o + 9);
            const ok = m <= 0xc2 && dv.getUint8(o + 4) === 8 && (comps === 1 || comps === 3);
            return ok
                ? {
                      format: 'jpeg',
                      width: dv.getUint16(o + 7),
                      height: dv.getUint16(o + 5),
                      alpha: false,
                      depth: 8,
                      grey: comps === 1,
                      icc: parts.length
                          ? Promise.all(parts)
                                .then((p) => new Blob(p).arrayBuffer())
                                .then((b) => new Uint8Array(b))
                          : null
                  }
                : null;
        }
    }
    return null;
};

// still webp: vp8 (opaque), vp8l (alpha bit) or vp8x (alpha flag); animations stay on the server.
// only vp8x carries a profile: its icc flag, or the iccp chunk that must follow it
const webpMeta = (dv: DataView) => {
    const kind = tag(dv, 12);
    const meta = (width: number, height: number, alpha: boolean, icc: Promise<Uint8Array | null> | null = null) => ({
        format: 'webp',
        width,
        height,
        alpha,
        depth: 8,
        grey: false,
        icc
    });
    if (kind === 'VP8X') {
        const flags = dv.getUint8(20);
        const chunk = dv.byteLength >= 38 && tag(dv, 30) === 'ICCP';
        const icc = chunk ? profile(dv, 38, dv.getUint32(34, true)) : flags & 0x20 ? Promise.resolve(null) : null;
        return flags & 0x02 ? null : meta(u24(dv, 24) + 1, u24(dv, 27) + 1, !!(flags & 0x10), icc);
    }
    if (kind === 'VP8L') {
        const v = dv.getUint32(21, true);
        return meta((v & 0x3fff) + 1, ((v >>> 14) & 0x3fff) + 1, !!((v >>> 28) & 1));
    }
    return kind === 'VP8 ' ? meta(dv.getUint16(26, true) & 0x3fff, dv.getUint16(28, true) & 0x3fff, false) : null;
};

// sharp sniffs everything image-loader doesn't pick by extension
const sniff = (dv: DataView) => {
    if (dv.byteLength > 33 && dv.getUint32(0) === 0x89504e47 && tag(dv, 12) === 'IHDR') {
        return pngMeta(dv);
    }
    if (dv.byteLength > 12 && dv.getUint16(0) === 0xffd8) {
        return jpegMeta(dv);
    }
    return dv.byteLength > 30 && tag(dv, 0) === 'RIFF' && tag(dv, 8) === 'WEBP' ? webpMeta(dv) : null;
};

/**
 * Decision meta, as texture-meta getFileMeta reports it. The server picks tga/bmp/hdr/exr decoders by
 * extension (image-loader.js loadImageFromBuffer) and sharp sniffs the rest; getFileMeta reports the
 * decoder's hasAlpha/isGrayscale for tga/bmp and a fixed opaque 32-bit truecolor for float images.
 */
export const sourceMeta = async (buffer: ArrayBuffer, name: string, codecs: Codecs) => {
    // path.extname: a leading dot is part of the name, not an extension
    const ext = /(?!^)\.([^.]+)$/.exec(name)?.[1].toLowerCase();
    const dv = new DataView(buffer);
    if (ext === 'hdr') {
        const size = hdrSize(new Uint8Array(buffer));
        return size && { format: 'hdr', type: 'TrueColor', width: size[0], height: size[1], alpha: false, depth: 32 };
    }
    if (!['tga', 'bmp', 'exr'].includes(ext)) {
        const m = sniff(dv);
        if (!m) {
            return null;
        }
        const { grey, icc, ...meta } = m;

        // an unreadable profile counts as colour managed
        const managed = icc && !(await icc.then(isSrgb).catch(() => false));
        return {
            ...meta,
            type: `${grey ? 'Grayscale' : 'TrueColor'}${meta.alpha ? 'Alpha' : ''}`,
            ...(managed ? { icc: true } : {})
        };
    }

    // header dimensions first, so an oversized image never gets decoded in the tab
    const dims = headerSize(ext, dv);
    if (!dims || dims[0] * dims[1] > MAX_PIXELS) {
        return null;
    }
    if (ext === 'tga' || ext === 'bmp') {
        const img = (ext === 'tga' ? decodeTga : decodeBmp)(new Uint8Array(buffer));

        // texture-meta deriveImageType with the decoder's overrides
        const type = `${img.isGrayscale ? 'Grayscale' : 'TrueColor'}${img.hasAlpha ? 'Alpha' : ''}`;
        return { format: ext, type, width: img.width, height: img.height, alpha: img.hasAlpha, depth: 8 };
    }
    const px = await codecs.exr(buffer);
    return { format: 'exr', type: 'TrueColor', width: px.width, height: px.height, alpha: false, depth: 32 };
};
