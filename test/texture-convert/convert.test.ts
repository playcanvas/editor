import { deflateSync } from 'node:zlib';

import { expect } from 'chai';
import { encodeRgbExr } from 'exrs';
import { decode as decodePng, encode as encodePng } from 'fast-png';
import { describe, it } from 'mocha';

import { convertTexture, sourceMeta } from '../../src/texture-convert/convert';

import { encoded, nodeCodecs } from './node-codecs';

const png = (width: number, height: number, channels: number, depth: 8 | 16 = 8) => {
    const Arr = depth === 16 ? Uint16Array : Uint8Array;
    const data = new Arr(width * height * channels).map((_, i) => (i * 37) % (depth === 16 ? 65535 : 255));
    const out = encodePng({ width, height, data, depth, channels });
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
};

const outPng = (buf: ArrayBuffer) => decodePng(new Uint8Array(buf));

describe('convertTexture', () => {
    it('resizes an npot in-place png and keeps rgb', async () => {
        const meta = { format: 'png', type: 'TrueColor', width: 20, height: 12, alpha: false, depth: 8 };
        const res = await convertTexture(
            png(20, 12, 3),
            meta,
            { format: 'png', size: { width: 16, height: 16 } },
            nodeCodecs
        );
        const out = outPng(res.file);
        expect([out.width, out.height, out.channels]).to.deep.equal([16, 16, 3]);
    });

    it('always resizes when a size is set, even if a stale target meta already says so', async () => {
        // convertTexture always applies options.size; importTexture (Task 8) drops it where the server's stale-size skip would
        const meta = { format: 'png', type: 'TrueColor', width: 16, height: 16, alpha: false, depth: 8 };
        const res = await convertTexture(
            png(20, 12, 3),
            meta,
            { format: 'png', size: { width: 16, height: 16 } },
            nodeCodecs
        );
        expect(outPng(res.file).width).to.equal(16);
    });

    it('writes a resized grayscale png as rgb, like sharp converting back to srgb', async () => {
        const meta = { format: 'png', type: 'Grayscale', width: 20, height: 12, alpha: false, depth: 8 };
        const res = await convertTexture(
            png(20, 12, 1),
            meta,
            { format: 'png', size: { width: 16, height: 16 } },
            nodeCodecs
        );
        expect(outPng(res.file).channels).to.equal(3);
    });

    it('depth converts a 16-bit png to 8-bit rgb', async () => {
        const meta = { format: 'png', type: 'TrueColor', width: 4, height: 4, alpha: false, depth: 16 };
        const res = await convertTexture(png(4, 4, 3, 16), meta, { format: 'png', depthConvert: true }, nodeCodecs);
        const out = outPng(res.file);
        expect([out.depth, out.channels]).to.deep.equal([8, 3]);
    });

    it('flips a bottom-left tga and hands jpeg to the lossy encoder as rgba', async () => {
        encoded.length = 0;
        const tga = new Uint8Array([0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 8, 0, 10, 20]);
        const meta = { format: 'tga', type: 'Grayscale', width: 1, height: 2, alpha: false, depth: 8 };
        await convertTexture(tga.buffer, meta, { format: 'jpeg' }, nodeCodecs);
        expect(encoded).to.deep.equal([
            { format: 'jpeg', width: 1, height: 2, data: [20, 20, 20, 255, 10, 10, 10, 255] }
        ]);
    });

    it('flips a bottom-left tga after resizing it, like sharp', async () => {
        // 1x3 bottom-left grey rows 0, 100, 200 (file order) upsized to 1x4
        const tga = new Uint8Array([0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 0, 8, 0, 0, 100, 200]);
        const meta = { format: 'tga', type: 'Grayscale', width: 1, height: 3, alpha: false, depth: 8 };
        const res = await convertTexture(
            tga.buffer,
            meta,
            { format: 'png', size: { width: 1, height: 4 } },
            nodeCodecs
        );
        const up = [...outPng(res.file).data].filter((_, i) => i % 3 === 0);

        // the affine samples at i * scale - 0.5, so resizing before the flip is not mirror-symmetric
        expect(up).to.not.deep.equal([...up].reverse());
        expect(up[0]).to.be.greaterThan(up[3]);
    });

    it('turns a resized xrgb tga black, like the server premultiplying before removeAlpha', async () => {
        // 32-bit, top-left, every alpha byte 0: the decoder reports no alpha
        const tga = new Uint8Array([
            0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 32, 0x20, 0, 0, 200, 0, 0, 0, 200, 0
        ]);
        const meta = { format: 'tga', type: 'TrueColor', width: 2, height: 1, alpha: false, depth: 8 };
        const res = await convertTexture(
            tga.buffer,
            meta,
            { format: 'png', size: { width: 4, height: 1 } },
            nodeCodecs
        );
        const out = outPng(res.file);
        expect(out.channels).to.equal(3);
        expect([...out.data]).to.deep.equal(new Array(12).fill(0));
    });

    it('keeps the colour of an unresized xrgb tga', async () => {
        const tga = new Uint8Array([
            0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 32, 0x20, 0, 0, 200, 0, 0, 0, 200, 0
        ]);
        const meta = { format: 'tga', type: 'TrueColor', width: 2, height: 1, alpha: false, depth: 8 };
        const res = await convertTexture(tga.buffer, meta, { format: 'png' }, nodeCodecs);
        expect([...outPng(res.file).data]).to.deep.equal([200, 0, 0, 200, 0, 0]);
    });

    it('encodes hdr as an unresized rgbm png with a tonemapped preview', async () => {
        const hdr = new Uint8Array([
            ...new TextEncoder().encode('#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 1 +X 3\n'),
            128,
            64,
            0,
            129,
            0,
            0,
            0,
            0,
            128,
            128,
            128,
            129
        ]);
        const meta = { format: 'hdr', type: 'TrueColor', width: 3, height: 1, alpha: false, depth: 32 };
        const res = await convertTexture(
            hdr.buffer,
            meta,
            { format: 'png', rgbm: true, size: { width: 4, height: 1 } },
            nodeCodecs
        );
        const out = outPng(res.file);
        expect([out.width, out.height, out.channels]).to.deep.equal([3, 1, 4]);
        expect(outPng(res.preview).channels).to.equal(3);
    });

    it('decodes exr through exrs and encodes it as rgbm', async () => {
        const exr = encodeRgbExr({ width: 2, height: 1, interleavedRgbPixels: new Float32Array([1, 1, 1, 0, 0, 0]) });
        const meta = { format: 'exr', type: 'TrueColor', width: 2, height: 1, alpha: false, depth: 32 };
        const res = await convertTexture(exr.slice().buffer, meta, { format: 'png', rgbm: true }, nodeCodecs);
        expect([...outPng(res.file).data]).to.deep.equal([255, 255, 255, 32, 0, 0, 0, 1]);
    });
});

describe('sourceMeta', () => {
    it('describes a tga like texture-meta, with alpha and grey from the decoder scan', async () => {
        const tga = new Uint8Array([0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 8, 0, 10, 20]);
        expect(await sourceMeta(tga.buffer, 'rock.TGA', nodeCodecs)).to.deep.equal({
            format: 'tga',
            type: 'Grayscale',
            width: 1,
            height: 2,
            alpha: false,
            depth: 8
        });
    });

    it('describes an exr like the getFileMeta float branch', async () => {
        const exr = encodeRgbExr({ width: 2, height: 1, interleavedRgbPixels: new Float32Array(6) });
        const codecs = { ...nodeCodecs, exr: async () => ({ data: new Float32Array(6), width: 2, height: 1 }) };
        expect(await sourceMeta(exr.slice().buffer, 'sky.exr', codecs)).to.deep.equal({
            format: 'exr',
            type: 'TrueColor',
            width: 2,
            height: 1,
            alpha: false,
            depth: 32
        });
    });

    it('leaves images over the pixel cap to the server without decoding them', async () => {
        // headers only: decoding either would throw on the missing pixel data
        const tga = new Uint8Array(18);
        tga.set([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01, 0x40, 0x01, 0x40, 32], 2);
        expect(await sourceMeta(tga.buffer, 'big.tga', nodeCodecs)).to.equal(null);

        const bmp = new DataView(new ArrayBuffer(54));
        bmp.setInt32(18, 8192, true);
        bmp.setInt32(22, -4096, true);
        expect(await sourceMeta(bmp.buffer, 'big.bmp', nodeCodecs)).to.equal(null);

        const exr = encodeRgbExr({
            width: 4097,
            height: 4096,
            interleavedRgbPixels: new Float32Array(4097 * 4096 * 3)
        });
        const codecs = { ...nodeCodecs, exr: () => Promise.reject(new Error('decoded')) };
        expect(await sourceMeta(exr.slice().buffer, 'big.exr', codecs)).to.equal(null);
    });

    it('describes an exr at the cap from its header', async () => {
        const exr = encodeRgbExr({ width: 3, height: 2, interleavedRgbPixels: new Float32Array(18) });
        const codecs = { ...nodeCodecs, exr: async () => ({ data: new Float32Array(18), width: 3, height: 2 }) };
        expect(await sourceMeta(exr.slice().buffer, 'a.exr', codecs)).to.include({ width: 3, height: 2 });
    });

    // header-only buffers: sniffing never decodes, so no pixel data is needed
    const bytes = (...parts: (number[] | string)[]) =>
        new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p))).buffer;
    const be32 = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    const pngHead = (w: number, h: number, depth: number, color: number, ...chunks: string[]) =>
        bytes(
            [0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10],
            be32(13),
            'IHDR',
            be32(w),
            be32(h),
            [depth, color, 0, 0, 0],
            [0, 0, 0, 0],
            ...chunks.flatMap((c) => [be32(0), c, [0, 0, 0, 0]])
        );
    const jpegHead = (sof: number, precision: number, comps: number) =>
        bytes(
            [0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, sof, 0, 8 + 3 * comps, precision, 0, 12, 0, 20, comps],
            new Array(3 * comps).fill(0)
        );
    const webpHead = (kind: string, body: number[]) =>
        bytes('RIFF', [0, 0, 0, 0], 'WEBP', kind, [0, 0, 0, 0], body, new Array(16).fill(0));

    it('sniffs png like sharp: a trns chunk adds alpha and only 16 bits counts as deep', async () => {
        expect(await sourceMeta(pngHead(20, 12, 8, 2, 'IDAT'), 'a.png', nodeCodecs)).to.deep.equal({
            format: 'png',
            width: 20,
            height: 12,
            alpha: false,
            depth: 8,
            type: 'TrueColor'
        });
        expect(await sourceMeta(pngHead(4, 4, 8, 3, 'PLTE', 'tRNS', 'IDAT'), 'a.png', nodeCodecs)).to.include({
            alpha: true,
            type: 'TrueColorAlpha'
        });
        expect(await sourceMeta(pngHead(4, 4, 8, 0, 'IDAT', 'tRNS'), 'a.png', nodeCodecs)).to.include({ alpha: false });
        expect(await sourceMeta(pngHead(4, 4, 16, 0, 'IDAT'), 'a.png', nodeCodecs)).to.include({
            depth: 16,
            type: 'Grayscale'
        });
        expect(await sourceMeta(pngHead(4, 4, 1, 4, 'IDAT'), 'a.png', nodeCodecs)).to.include({
            depth: 8,
            type: 'GrayscaleAlpha'
        });
    });

    it('flags an embedded colour profile: png iccp, jpeg app2 icc_profile, webp vp8x icc flag or iccp chunk', async () => {
        expect(await sourceMeta(pngHead(4, 4, 8, 2, 'iCCP', 'IDAT'), 'a.png', nodeCodecs)).to.include({ icc: true });
        expect(await sourceMeta(pngHead(4, 4, 8, 3, 'tRNS', 'iCCP', 'IDAT'), 'a.png', nodeCodecs)).to.include({
            alpha: true,
            icc: true
        });
        expect(await sourceMeta(pngHead(4, 4, 8, 2, 'IDAT', 'iCCP'), 'a.png', nodeCodecs)).to.not.have.any.keys('icc');
        const icc = bytes(
            [0xff, 0xd8, 0xff, 0xe2, 0, 16],
            'ICC_PROFILE',
            [0, 1, 1],
            [0xff, 0xc0, 0, 17, 8, 0, 12, 0, 20, 3],
            new Array(9).fill(0)
        );
        expect(await sourceMeta(icc, 'a.jpg', nodeCodecs)).to.include({ width: 20, height: 12, icc: true });
        expect(await sourceMeta(jpegHead(0xc0, 8, 3), 'a.jpg', nodeCodecs)).to.not.have.any.keys('icc');
        const vp8x = (flags: number, next = 'VP8 ') =>
            bytes(
                'RIFF',
                [0, 0, 0, 0],
                'WEBP',
                'VP8X',
                [10, 0, 0, 0],
                [flags, 0, 0, 0, 19, 0, 0, 11, 0, 0],
                next,
                new Array(12).fill(0)
            );
        expect(await sourceMeta(vp8x(0x20), 'a.webp', nodeCodecs)).to.include({ icc: true });
        expect(await sourceMeta(vp8x(0, 'ICCP'), 'a.webp', nodeCodecs)).to.include({ icc: true });
        expect(await sourceMeta(vp8x(0x10), 'a.webp', nodeCodecs)).to.not.have.any.keys('icc');
    });

    it('ignores an srgb profile, like the one browsers embed, but not p3, gamma 2.2 or a lut', async () => {
        const s15 = (v: number) => be32(Math.round(v * 65536) >>> 0);
        const le32 = (n: number) => be32(n).reverse();
        const SRGB = [0.4361, 0.2225, 0.0139, 0.3851, 0.7169, 0.0971, 0.1431, 0.0606, 0.7141];
        const P3 = [0.5151, 0.2412, -0.0011, 0.292, 0.6922, 0.0419, 0.1571, 0.0666, 0.7841];

        // skcms' srgb curve (para type 4), and hp's 1024-entry table
        const PARA = [
            'para',
            [0, 0, 0, 0, 0, 4, 0, 0],
            ...[2.4, 1 / 1.055, 0.055 / 1.055, 1 / 12.92, 0.04045, 0, 0].map(s15)
        ];
        const lin = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
        const TABLE = [
            'curv',
            [0, 0, 0, 0],
            be32(1024),
            ...Array.from({ length: 1024 }, (_, i) => {
                const v = Math.round(lin(i / 1023) * 65535);
                return [v >> 8, v & 255];
            })
        ];
        const GAMMA22 = ['para', [0, 0, 0, 0, 0, 3, 0, 0], ...[2.2, 1, 0, 0, 0].map(s15)];

        // a matrix/trc rgb profile: rXYZ, gXYZ, bXYZ, then one curve shared by the three trc tags
        const icc = (xyz: number[], trc: (number[] | string)[] = PARA, extra: string[] = []) => {
            const curve = new Uint8Array(bytes(...trc));
            const names = ['rXYZ', 'gXYZ', 'bXYZ', 'rTRC', 'gTRC', 'bTRC', ...extra];
            const data = 132 + names.length * 12;
            const table = names.flatMap((t, i) => [
                t,
                be32(i < 3 ? data + i * 20 : data + 60),
                be32(i < 3 ? 20 : curve.length)
            ]);
            const cols = [0, 1, 2].flatMap((i) => ['XYZ ', [0, 0, 0, 0], ...xyz.slice(i * 3, i * 3 + 3).map(s15)]);
            return new Uint8Array(
                bytes(
                    new Array(16).fill(0),
                    'RGB XYZ ',
                    new Array(104).fill(0),
                    be32(names.length),
                    ...table,
                    ...cols,
                    [...curve]
                )
            );
        };
        const SOF = [0xff, 0xc0, 0, 17, 8, 0, 12, 0, 20, 3, ...new Array(9).fill(0)];
        const jpeg = (p: Uint8Array) =>
            bytes(
                [0xff, 0xd8, 0xff, 0xe2],
                [(p.length + 16) >> 8, (p.length + 16) & 255],
                'ICC_PROFILE',
                [0, 1, 1],
                [...p],
                SOF
            );
        const webp = (p: Uint8Array) =>
            bytes(
                'RIFF',
                [0, 0, 0, 0],
                'WEBP',
                'VP8X',
                [10, 0, 0, 0],
                [0x20, 0, 0, 0, 19, 0, 0, 11, 0, 0],
                'ICCP',
                le32(p.length),
                [...p],
                'VP8 ',
                new Array(12).fill(0)
            );
        const png = (p: Uint8Array) => {
            const z = [...deflateSync(p)];
            return bytes(
                [...new Uint8Array(pngHead(20, 12, 8, 2)).slice(0, 33)],
                be32(z.length + 5),
                'iCCP',
                'icc',
                [0, 0],
                z,
                [0, 0, 0, 0],
                be32(0),
                'IDAT',
                [0, 0, 0, 0]
            );
        };
        for (const [name, wrap] of [
            ['a.jpg', jpeg],
            ['a.webp', webp],
            ['a.png', png]
        ] as const) {
            for (const trc of [PARA, TABLE]) {
                expect(await sourceMeta(wrap(icc(SRGB, trc)), name, nodeCodecs), name).to.not.have.any.keys('icc');
            }
            for (const p of [icc(P3), icc(SRGB, GAMMA22), icc(SRGB, PARA, ['A2B0'])]) {
                expect(await sourceMeta(wrap(p), name, nodeCodecs), name).to.include({
                    width: 20,
                    height: 12,
                    icc: true
                });
            }
        }
    });

    it('sniffs the content, not the extension, for formats sharp opens', async () => {
        expect(await sourceMeta(pngHead(4, 4, 8, 6, 'IDAT'), 'a.jpg', nodeCodecs)).to.include({
            format: 'png',
            alpha: true
        });
    });

    it('sniffs 8-bit grey or ycbcr jpeg and leaves cmyk, 12-bit and arithmetic coding to the server', async () => {
        expect(await sourceMeta(jpegHead(0xc0, 8, 3), 'a.jpg', nodeCodecs)).to.deep.equal({
            format: 'jpeg',
            width: 20,
            height: 12,
            alpha: false,
            depth: 8,
            type: 'TrueColor'
        });
        expect(await sourceMeta(jpegHead(0xc2, 8, 1), 'a.jpeg', nodeCodecs)).to.include({ type: 'Grayscale' });
        expect(await sourceMeta(jpegHead(0xc0, 8, 4), 'a.jpg', nodeCodecs)).to.equal(null);
        expect(await sourceMeta(jpegHead(0xc1, 12, 3), 'a.jpg', nodeCodecs)).to.equal(null);
        expect(await sourceMeta(jpegHead(0xc9, 8, 3), 'a.jpg', nodeCodecs)).to.equal(null);
    });

    it('sniffs still webp alpha from vp8l and vp8x, and leaves animations to the server', async () => {
        const vp8 = webpHead('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, 20, 0, 12, 0]);
        expect(await sourceMeta(vp8, 'a.webp', nodeCodecs)).to.deep.equal({
            format: 'webp',
            width: 20,
            height: 12,
            alpha: false,
            depth: 8,
            type: 'TrueColor'
        });

        // 14-bit width-1, 14-bit height-1, then the alpha bit
        const v = 19 | (11 << 14) | (1 << 28);
        const vp8l = webpHead('VP8L', [0x2f, v & 255, (v >>> 8) & 255, (v >>> 16) & 255, v >>> 24]);
        expect(await sourceMeta(vp8l, 'a.webp', nodeCodecs)).to.include({ width: 20, height: 12, alpha: true });
        const vp8x = (flags: number) => webpHead('VP8X', [flags, 0, 0, 0, 19, 0, 0, 11, 0, 0]);
        expect(await sourceMeta(vp8x(0x10), 'a.webp', nodeCodecs)).to.include({ width: 20, height: 12, alpha: true });
        expect(await sourceMeta(vp8x(0x12), 'a.webp', nodeCodecs)).to.equal(null);
    });

    it('describes an hdr from its resolution line, transposed like decodeHdr', async () => {
        const hdr = (res: string) => bytes('#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n', res, '\n');
        expect(await sourceMeta(hdr('-Y 12 +X 20'), 'env.hdr', nodeCodecs)).to.deep.equal({
            format: 'hdr',
            type: 'TrueColor',
            width: 20,
            height: 12,
            alpha: false,
            depth: 32
        });
        expect(await sourceMeta(hdr('+X 20 -Y 12'), 'env.hdr', nodeCodecs)).to.include({ width: 20, height: 12 });
        expect(await sourceMeta(hdr('garbage'), 'env.hdr', nodeCodecs)).to.equal(null);
    });

    it('leaves every other extension to plan 02 or the server', async () => {
        expect(await sourceMeta(new ArrayBuffer(4), 'a.png', nodeCodecs)).to.equal(null);
        expect(await sourceMeta(new ArrayBuffer(4), 'a.avif', nodeCodecs)).to.equal(null);
        expect(await sourceMeta(new ArrayBuffer(4), 'tga', nodeCodecs)).to.equal(null);
        // path.extname('.tga') is '', so the server sends a dotfile to sharp
        expect(await sourceMeta(new ArrayBuffer(4), '.tga', nodeCodecs)).to.equal(null);
    });
});
