import type { Page } from '@playwright/test';

import { HDR_SCALE, pixels } from './assets';

// deterministic texture inputs the shared texture()/meta-images generators don't cover; the
// variants below hit the server decoder branches (pipeline/shared/base/image-loader.js) the
// shared encoders never reach, over the same vertically asymmetric texture() gradient

type Size = { width: number; height: number };

/** The classic 1×1 gif. */
export const gif = () => Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

/** A 1×1 uncompressed baseline rgb tiff (red), 8 or 16 bits per sample. */
export const tiff = (depth: 8 | 16 = 8) => {
    const bytes = depth / 8;
    // tag, type (3 short, 4 long), count, value; ascending tag order, as tiff requires
    const tags = [
        [256, 3, 1, 1],
        [257, 3, 1, 1],
        [258, 3, 3, 0],
        [259, 3, 1, 1],
        [262, 3, 1, 2],
        [273, 4, 1, 0],
        [277, 3, 1, 3],
        [278, 3, 1, 1],
        [279, 4, 1, 3 * bytes]
    ];
    const ifd = 8;
    const bps = ifd + 2 + tags.length * 12 + 4;
    const px = bps + 6;
    tags[2][3] = bps;
    tags[5][3] = px;
    const b = Buffer.alloc(px + 3 * bytes);
    b.write('II', 0, 'latin1');
    b.writeUInt16LE(42, 2);
    b.writeUInt32LE(ifd, 4);
    b.writeUInt16LE(tags.length, ifd);
    tags.forEach(([tag, type, count, value], i) => {
        const o = ifd + 2 + i * 12;
        b.writeUInt16LE(tag, o);
        b.writeUInt16LE(type, o + 2);
        b.writeUInt32LE(count, o + 4);
        if (type === 3 && count === 1) {
            b.writeUInt16LE(value, o + 8);
        } else {
            b.writeUInt32LE(value, o + 8);
        }
    });
    [0, 1, 2].forEach(i => b.writeUInt16LE(depth, bps + i * 2));
    if (depth === 16) {
        b.writeUInt16LE(0xffff, px);
    } else {
        b[px] = 255;
    }
    return b;
};

// greedy run-length packets: [run length, value] for runs of 2+ identical items, else literals
const runs = <T>(items: T[], same: (a: T, b: T) => boolean, max: number) => {
    const out: { run: boolean; items: T[] }[] = [];
    for (let i = 0; i < items.length;) {
        let n = 1;
        while (i + n < items.length && n < max && same(items[i + n], items[i])) {
            n++;
        }
        if (n > 1) {
            out.push({ run: true, items: [items[i]] });
            for (let k = 1; k < n; k++) {
                out[out.length - 1].items.push(items[i]);
            }
        } else {
            const last = out[out.length - 1];
            if (last && !last.run && last.items.length < max) {
                last.items.push(items[i]);
            } else {
                out.push({ run: false, items: [items[i]] });
            }
        }
        i += n;
    }
    return out;
};

/**
 * A tga: true colour (24-bit, or 32-bit with `alpha`/`opaque`) or 8-bit greyscale (grey is the
 * mean of red and green), bottom-left origin unless `topLeft`, uncompressed unless `rle`.
 * `opaque` writes a 32-bit alpha channel that is 255 everywhere.
 */
export const tga = ({ width, height, alpha = false, opaque = false, grey = false, topLeft = false, rle = false, blocks = false }: Size & { alpha?: boolean; opaque?: boolean; grey?: boolean; topLeft?: boolean; rle?: boolean; blocks?: boolean }) => {
    const px = pixels({ width, height, alpha, format: 'png', blocks });
    const wide = alpha || opaque;
    const rows = Array.from({ length: height }, (_, r) => (topLeft ? r : height - 1 - r));
    const cells = rows.flatMap(y => Array.from({ length: width }, (_, x) => {
        const i = (y * width + x) * 4;
        return grey ? [(px[i] + px[i + 1]) >> 1] : [px[i + 2], px[i + 1], px[i], ...(wide ? [opaque ? 255 : px[i + 3]] : [])];
    }));
    const body = rle ?
        runs(cells, (a, b) => a.every((v, k) => v === b[k]), 128).flatMap(k => (k.run ? [0x80 | (k.items.length - 1), ...k.items[0]] : [k.items.length - 1, ...k.items.flat()])) :
        cells.flat();
    const head = Buffer.alloc(18);
    head[2] = (grey ? 3 : 2) + (rle ? 8 : 0);
    head.writeUInt16LE(width, 12);
    head.writeUInt16LE(height, 14);
    head[16] = grey ? 8 : wide ? 32 : 24;
    head[17] = (wide ? 8 : 0) | (topLeft ? 0x20 : 0);
    return Buffer.concat([head, Buffer.from(body)].map(b => new Uint8Array(b)));
};

/**
 * A bmp with a 40-byte header: 24-bit colour, rows top-down (negative height) when `topDown`,
 * or 8-bit paletted over `palette` (256 rgb entries) with an asymmetric index ramp.
 */
export const bmp = ({ width, height, topDown = false, palette }: Size & { topDown?: boolean; palette?: (i: number) => [number, number, number] }) => {
    const px = pixels({ width, height, alpha: false, format: 'png' });
    const stride = palette ? (width + 3) & ~3 : (width * 3 + 3) & ~3;
    const table = palette ? 1024 : 0;
    const offset = 54 + table;
    const out = Buffer.alloc(offset + stride * height);
    out.write('BM', 0, 'ascii');
    out.writeUInt32LE(out.length, 2);
    out.writeUInt32LE(offset, 10);
    out.writeUInt32LE(40, 14);
    out.writeInt32LE(width, 18);
    out.writeInt32LE(topDown ? -height : height, 22);
    out.writeUInt16LE(1, 26);
    out.writeUInt16LE(palette ? 8 : 24, 28);
    out.writeUInt32LE(stride * height, 34);
    if (palette) {
        out.writeUInt32LE(256, 46);
        for (let i = 0; i < 256; i++) {
            const [r, g, b] = palette(i);
            out.set([b, g, r, 0], 54 + i * 4);
        }
    }
    for (let y = 0; y < height; y++) {
        const row = offset + (topDown ? y : height - 1 - y) * stride;
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (palette) {
                out[row + x] = (x * 12 + y * 5) & 0xff;
            } else {
                out.set([px[i + 2], px[i + 1], px[i]], row + x * 3);
            }
        }
    }
    return out;
};

const rgbe = (r: number, g: number, b: number) => {
    const v = Math.max(r, g, b);
    if (v < 1e-32) {
        return [0, 0, 0, 0];
    }
    const e = Math.floor(Math.log2(v)) + 1;
    const f = 256 / 2 ** e;
    return [Math.floor(r * f), Math.floor(g * f), Math.floor(b * f), e + 128];
};

export type HdrOrient = '-Y +X' | '+Y +X' | '-Y -X' | '+X -Y';

/**
 * A radiance hdr in any of four orientations (the first axis runs the scanlines, a sign flips
 * it), flat rgbe scanlines or new-style adaptive rle, over `texture()`'s float values.
 */
export const hdr = ({ width, height, orient = '-Y +X', rle = false }: Size & { orient?: HdrOrient; rle?: boolean }) => {
    const px = pixels({ width, height, alpha: false, format: 'hdr' });
    const [first, second] = orient.split(' ');
    const transpose = first[1] === 'X';
    const flipY = (transpose ? second : first)[0] === '+';
    const flipX = (transpose ? first : second)[0] === '-';
    const lines = transpose ? width : height;
    const len = transpose ? height : width;
    const at = (s: number, p: number) => {
        const row = transpose ? (flipY ? height - 1 - p : p) : (flipY ? height - 1 - s : s);
        const col = transpose ? (flipX ? width - 1 - s : s) : (flipX ? width - 1 - p : p);
        const i = (row * width + col) * 4;
        return rgbe(...([0, 1, 2].map(c => px[i + c] / 255 * HDR_SCALE) as [number, number, number]));
    };
    const body: number[] = [];
    for (let s = 0; s < lines; s++) {
        const line = Array.from({ length: len }, (_, p) => at(s, p));
        if (!rle) {
            body.push(...line.flat());
            continue;
        }
        body.push(2, 2, len >> 8, len & 0xff);
        for (let c = 0; c < 4; c++) {
            runs(line.map(q => q[c]), (a, b) => a === b, 127).forEach(k => body.push(...(k.run ? [128 + k.items.length, k.items[0]] : [k.items.length, ...k.items])));
        }
    }
    const res = transpose ? `${first} ${width} ${second} ${height}` : `${first} ${height} ${second} ${width}`;
    return Buffer.concat([Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n${res}\n`), Buffer.from(body)].map(b => new Uint8Array(b)));
};

/** An opaque webp of the `texture()` gradient, encoded by the browser (node has no webp encoder). */
export const webp = (page: Page, { width, height }: Size) => page.evaluate(async ([w, h, data]) => {
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data), w, h), 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
}, [width, height, Array.from(pixels({ width, height, alpha: false, format: 'png' }))] as const).then(b => Buffer.from(b));
