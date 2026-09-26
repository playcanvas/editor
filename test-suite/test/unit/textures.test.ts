import { expect, test } from '@playwright/test';

import { texture } from '../fixtures/assets';
import { GREY, png, RGB } from '../fixtures/meta-images';
import { bmp, hdr, type HdrOrient, tga, tiff } from '../fixtures/textures';
import { shape } from '../ui/parity/texture-convert.cases';

// the server's reads (pipeline/shared/base/image-loader.js), cut down to what the fixtures emit
const untga = (b: Buffer) => {
    const bpp = b[16] / 8;
    const size = b.readUInt16LE(12) * b.readUInt16LE(14) * bpp;
    if (b[2] < 8) {
        return [...b.subarray(18, 18 + size)];
    }
    const out: number[] = [];
    for (let o = 18; out.length < size;) {
        const head = b[o++];
        const n = (head & 0x7f) + 1;
        const items = head & 0x80 ? Array(n).fill([...b.subarray(o, o + bpp)]).flat() : [...b.subarray(o, o + n * bpp)];
        o += head & 0x80 ? bpp : items.length;
        out.push(...items);
    }
    return out;
};

const unhdr = (b: Buffer) => {
    let o = b.indexOf('\n\n') + 2;
    const res = b.toString('ascii', o, b.indexOf('\n', o)).split(' ');
    o = b.indexOf('\n', o) + 1;
    const [lines, len] = [Number(res[1]), Number(res[3])];
    const px: number[][] = [];
    for (let s = 0; s < lines; s++) {
        const line = Array.from({ length: len }, () => [0, 0, 0, 0]);
        if (b[o] === 2 && b[o + 1] === 2) {
            o += 4;
            for (let c = 0; c < 4; c++) {
                for (let x = 0; x < len;) {
                    const code = b[o++];
                    const n = code > 128 ? code - 128 : code;
                    for (let j = 0; j < n; j++) {
                        line[x + j][c] = code > 128 ? b[o] : b[o + j];
                    }
                    o += code > 128 ? 1 : n;
                    x += n;
                }
            }
        } else {
            line.forEach((q, x) => q.splice(0, 4, ...b.subarray(o + x * 4, o + x * 4 + 4)));
            o += len * 4;
        }
        px.push(...line);
    }
    return { res: res.join(' '), px };
};

test.describe('texture-convert fixtures', () => {
    test('tga rle, origin and greyscale variants decode to the same pixels', () => {
        const flat = tga({ width: 20, height: 12, alpha: true, blocks: true });
        const rle = tga({ width: 20, height: 12, alpha: true, blocks: true, rle: true });
        expect([flat[2], rle[2], rle.length < flat.length]).toEqual([2, 10, true]);
        expect(untga(rle)).toEqual(untga(flat));
        const top = tga({ width: 20, height: 12, alpha: true, topLeft: true });
        expect(top[17]).toBe(0x28);
        const rows = (px: number[]) => Array.from({ length: 12 }, (_, r) => px.slice(r * 80, r * 80 + 80));
        expect(rows(untga(top))).toEqual(rows(untga(tga({ width: 20, height: 12, alpha: true }))).reverse());
        expect([...tga({ width: 2, height: 1, opaque: true }).subarray(16, 18), tga({ width: 2, height: 1, opaque: true })[21]]).toEqual([32, 8, 255]);
        expect([...tga({ width: 2, height: 1, grey: true }).subarray(16, 18)]).toEqual([8, 0]);
    });

    test('bmp top-down rows reverse the bottom-up ones, and a palette holds 256 entries', () => {
        const up = bmp({ width: 5, height: 3 });
        const down = bmp({ width: 5, height: 3, topDown: true });
        expect(down.readInt32LE(22)).toBe(-3);
        const rows = (b: Buffer) => [0, 1, 2].map(r => [...b.subarray(54 + r * 16, 54 + r * 16 + 15)]);
        expect(rows(down)).toEqual(rows(up).reverse());
        const pal = bmp({ width: 5, height: 3, palette: i => [i, i, i] });
        expect([pal.readUInt16LE(28), pal.readUInt32LE(10), [...pal.subarray(54 + 7 * 4, 54 + 8 * 4)]]).toEqual([8, 54 + 1024, [7, 7, 7, 0]]);
    });

    test('hdr rle and orientations hold the same image', () => {
        const base = unhdr(hdr({ width: 20, height: 12 }));
        expect(base.res).toBe('-Y 12 +X 20');
        expect(unhdr(hdr({ width: 20, height: 12, rle: true })).px).toEqual(base.px);
        const at = (px: number[][], row: number, col: number) => px[row * 20 + col];
        const check = (orient: HdrOrient, map: (s: number, p: number) => [number, number]) => {
            const { res, px } = unhdr(hdr({ width: 20, height: 12, orient, rle: orient === '+X -Y' }));
            const len = Number(res.split(' ')[3]);
            px.forEach((q, i) => expect(q).toEqual(at(base.px, ...map(Math.floor(i / len), i % len))));
        };
        check('+Y +X', (s, p) => [11 - s, p]);
        check('-Y -X', (s, p) => [s, 19 - p]);
        check('+X -Y', (s, p) => [p, s]);
    });

    test('tiff writes 8 or 16 bits per sample', () => {
        expect(tiff(16).length - tiff().length).toBe(3);
        expect(tiff(16).readUInt16LE(tiff(16).length - 6)).toBe(0xffff);
    });

    test('tiff is a 1×1 little-endian rgb strip at the offsets its ifd names', () => {
        const b = tiff();
        expect([b.toString('latin1', 0, 2), b.readUInt16LE(2), b.readUInt32LE(4)]).toEqual(['II', 42, 8]);
        const tag = (id: number) => {
            for (let i = 0, n = b.readUInt16LE(8); i < n; i++) {
                if (b.readUInt16LE(10 + i * 12) === id) {
                    return b.readUInt32LE(10 + i * 12 + 8);
                }
            }
            return null;
        };
        const bps = tag(258)!;
        expect([0, 1, 2].map(i => b.readUInt16LE(bps + i * 2))).toEqual([8, 8, 8]);
        expect([...b.subarray(tag(273)!, tag(273)! + tag(279)!)]).toEqual([255, 0, 0]);
    });

    test('shape reads png and jpeg headers the way sharp reports them', () => {
        expect(shape(texture({ width: 20, height: 12, alpha: true, format: 'png' }))).toEqual({ format: 'png', width: 20, height: 12, channels: 4 });
        expect(shape(png({ width: 3, height: 2, color: RGB, depth: 16, pixel: () => [1, 2, 3] }))).toEqual({ format: 'png', width: 3, height: 2, channels: 3 });
        expect(shape(png({ width: 5, height: 1, color: GREY, pixel: () => [9] }))?.channels).toBe(1);
        expect(shape(texture({ width: 20, height: 12, alpha: false, format: 'jpeg' }))).toEqual({ format: 'jpeg', width: 20, height: 12, channels: 3 });
        expect(shape(texture({ width: 4, height: 4, alpha: false, format: 'tga' }))).toBeNull();
        const riff = (kind: string, body: number[]) => Buffer.concat([Buffer.from(`RIFF\0\0\0\0WEBP${kind}\0\0\0\0`), Buffer.from(body), Buffer.alloc(16)].map(b => new Uint8Array(b)));
        expect(shape(riff('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, 20, 0, 12, 0]))).toEqual({ format: 'webp', width: 20, height: 12, channels: 3 });
        const l = 19 | (11 << 14) | (1 << 28);
        expect(shape(riff('VP8L', [0x2f, l & 0xff, (l >> 8) & 0xff, (l >> 16) & 0xff, l >>> 24]))).toEqual({ format: 'webp', width: 20, height: 12, channels: 4 });
        expect(shape(riff('VP8X', [0x10, 0, 0, 0, 19, 0, 0, 11, 0, 0]))).toEqual({ format: 'webp', width: 20, height: 12, channels: 4 });
    });
});
