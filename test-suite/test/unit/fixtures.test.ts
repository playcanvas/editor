import { inflateSync } from 'node:zlib';

import { expect, test } from '@playwright/test';

import { CLASSIC_THROW_LINE, classicScripts, HDR_SCALE, normalMap, pixels, texture } from '../fixtures/assets';

// unfilters a png written with filter 0 on every row, which is all texture() writes
const readPng = (buf: Buffer) => {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const channels = buf[25] === 6 ? 4 : 3;
    let at = 8;
    const idat: Buffer[] = [];
    while (at < buf.length) {
        const len = buf.readUInt32BE(at);
        const type = buf.toString('ascii', at + 4, at + 8);
        if (type === 'IDAT') {
            idat.push(buf.subarray(at + 8, at + 8 + len));
        }
        at += 12 + len;
    }
    const raw = inflateSync(new Uint8Array(Buffer.concat(idat.map(b => new Uint8Array(b)))));
    const px = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
        expect(raw[y * (width * channels + 1)]).toBe(0);
        for (let x = 0; x < width; x++) {
            for (let c = 0; c < 4; c++) {
                px[(y * width + x) * 4 + c] = c < channels ? raw[y * (width * channels + 1) + 1 + x * channels + c] : 255;
            }
        }
    }
    return { width, height, channels, px };
};

test.describe('texture fixtures', () => {
    test('are deterministic', () => {
        for (const format of ['png', 'jpeg', 'tga', 'bmp', 'hdr', 'exr'] as const) {
            const opts = { width: 12, height: 5, alpha: false, format };
            expect(texture(opts).equals(new Uint8Array(texture(opts)))).toBe(true);
        }
    });

    test('png holds exactly pixels()', () => {
        for (const alpha of [false, true]) {
            const opts = { width: 5, height: 3, alpha, format: 'png' as const };
            const png = readPng(texture(opts));
            expect(png).toMatchObject({ width: 5, height: 3, channels: alpha ? 4 : 3 });
            expect([...png.px]).toEqual([...pixels(opts)]);
        }
    });

    test('alpha fixtures are translucent somewhere and opaque ones never are', () => {
        const alpha = pixels({ width: 4, height: 4, alpha: true, format: 'png' });
        const opaque = pixels({ width: 4, height: 4, alpha: false, format: 'png' });
        expect(alpha.filter((_, i) => i % 4 === 3).some(a => a < 255)).toBe(true);
        expect(opaque.filter((_, i) => i % 4 === 3).every(a => a === 255)).toBe(true);
    });

    test('jpeg is a baseline 3-component frame of the requested size', () => {
        const jpg = texture({ width: 20, height: 9, alpha: false, format: 'jpeg' });
        expect([jpg[0], jpg[1]]).toEqual([0xff, 0xd8]);
        expect([jpg[jpg.length - 2], jpg[jpg.length - 1]]).toEqual([0xff, 0xd9]);
        const sof = jpg.indexOf(new Uint8Array([0xff, 0xc0]));
        expect(sof).toBeGreaterThan(0);
        expect({ precision: jpg[sof + 4], height: jpg.readUInt16BE(sof + 5), width: jpg.readUInt16BE(sof + 7), comps: jpg[sof + 9] }).toEqual({ precision: 8, height: 9, width: 20, comps: 3 });
    });

    test('jpeg pixels are flat per 8×8 block', () => {
        const px = pixels({ width: 16, height: 8, alpha: false, format: 'jpeg' });
        expect([...px.subarray(0, 4)]).toEqual([...px.subarray(7 * 4, 8 * 4)]);
        expect([...px.subarray(0, 4)]).not.toEqual([...px.subarray(8 * 4, 9 * 4)]);
    });

    test('formats without alpha refuse it', () => {
        for (const format of ['jpeg', 'hdr', 'exr'] as const) {
            expect(() => texture({ width: 2, height: 2, alpha: true, format })).toThrow(`${format} fixtures have no alpha`);
        }
    });

    test('tga is uncompressed true-colour, bottom-up', () => {
        const opts = { width: 3, height: 2, alpha: true, format: 'tga' as const };
        const tga = texture(opts);
        const px = pixels(opts);
        expect({ type: tga[2], width: tga.readUInt16LE(12), height: tga.readUInt16LE(14), bpp: tga[16], desc: tga[17] }).toEqual({ type: 2, width: 3, height: 2, bpp: 32, desc: 8 });

        // the first stored pixel is the bottom-left one, in bgra
        expect([tga[18], tga[19], tga[20], tga[21]]).toEqual([px[3 * 4 + 2], px[3 * 4 + 1], px[3 * 4], px[3 * 4 + 3]]);
        expect(tga.length).toBe(18 + 3 * 2 * 4);
    });

    test('bmp is BI_RGB, bottom-up, with 4-byte row padding', () => {
        const bmp = texture({ width: 3, height: 2, alpha: false, format: 'bmp' });
        expect(bmp.toString('ascii', 0, 2)).toBe('BM');
        expect({ size: bmp.readUInt32LE(2), offset: bmp.readUInt32LE(10), width: bmp.readInt32LE(18), height: bmp.readInt32LE(22), bpp: bmp.readUInt16LE(28), compression: bmp.readUInt32LE(30) })
        .toEqual({ size: 54 + 12 * 2, offset: 54, width: 3, height: 2, bpp: 24, compression: 0 });
    });

    test('alpha bmp uses BI_RGB with V4 RGBA masks and preserves every pixel', () => {
        const opts = { width: 6, height: 4, alpha: true, format: 'bmp' as const };
        const bmp = texture(opts);
        expect(bmp.readUInt32LE(14)).toBe(108);
        expect(bmp.readUInt32LE(10)).toBe(122);
        expect(bmp.readUInt32LE(30)).toBe(0);
        expect([54, 58, 62, 66, 70].map(at => bmp.readUInt32LE(at))).toEqual([0xff0000, 0xff00, 0xff, 0xff000000, 0x73524742]);
        const px = pixels(opts);
        for (let y = 0; y < opts.height; y++) {
            for (let x = 0; x < opts.width; x++) {
                const at = (y * opts.width + x) * 4;
                const offset = 122 + ((opts.height - 1 - y) * opts.width + x) * 4;
                expect([...bmp.subarray(offset, offset + 4)]).toEqual([px[at + 2], px[at + 1], px[at], px[at + 3]]);
            }
        }
    });

    test('hdr is flat rgbe with a -Y +X header and values above one', () => {
        const hdr = texture({ width: 6, height: 4, alpha: false, format: 'hdr' });
        const head = '#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 4 +X 6\n';
        expect(hdr.toString('ascii', 0, head.length)).toBe(head);
        expect(hdr.length).toBe(head.length + 6 * 4 * 4);

        // the brightest pixel is HDR_SCALE, stored as mantissa 128 with exponent 128 + 3
        const e = Math.floor(Math.log2(HDR_SCALE)) + 1 + 128;
        const body = hdr.subarray(head.length);
        expect([...body.subarray(body.length - 4)]).toContain(e);
    });

    test('exr is a single-part scanline file with B, G, R float channels', () => {
        const exr = texture({ width: 4, height: 3, alpha: false, format: 'exr' });
        expect([...exr.subarray(0, 4)]).toEqual([0x76, 0x2f, 0x31, 0x01]);
        expect(exr.readInt32LE(4)).toBe(2);
        expect(exr.includes('channels\0chlist\0')).toBe(true);
        expect(exr.includes('compression\0compression\0')).toBe(true);

        // header, then 3 offsets, then 3 lines of 8 + 4 px × 3 channels × 4 bytes
        const end = exr.indexOf('screenWindowWidth\0float\0') + 'screenWindowWidth\0float\0'.length + 4 + 4 + 1;
        expect(exr.length).toBe(end + 3 * 8 + 3 * (8 + 4 * 3 * 4));
        expect(Number(exr.readBigUInt64LE(end))).toBe(end + 3 * 8);
    });

    test('normalMap is an opaque png pointing mostly out of the surface', () => {
        const png = readPng(normalMap({ width: 8, height: 8 }));
        expect(png.channels).toBe(3);
        expect(png.px.filter((_, i) => i % 4 === 2).every(b => b >= 128)).toBe(true);
        expect(new Set(png.px.filter((_, i) => i % 4 === 0)).size).toBeGreaterThan(1);
    });
});

test.describe('classic script fixtures', () => {
    test('are three logging scripts, the last throwing at a known line', () => {
        const scripts = classicScripts('parity');
        expect(scripts.map(s => s.name)).toEqual(['parity-a.js', 'parity-b.js', 'parity-c.js']);
        expect(scripts.every(s => s.mimeType === 'text/javascript')).toBe(true);
        const [a, , c] = scripts.map(s => s.buffer.toString().split('\n'));
        expect(a[0]).toBe('var parity_a = pc.createScript(\'parity_a\');');
        expect(a[1]).toContain('__e2eOrder');
        expect(c[CLASSIC_THROW_LINE - 1]).toBe('    throw new Error(\'parity-c.js failed\');');
    });
});
