import { readFileSync } from 'node:fs';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isNormalMap, textureMeta } from '../../../src/common/asset-meta/texture';

const DIR = 'test/fixtures/texture-meta/';
const RGB8 = { format: 'png', type: 'TrueColor', width: 5, height: 3, alpha: false, depth: 8, srgb: true, interlaced: false };
const read = (name: string) => new Uint8Array(readFileSync(DIR + name));

const pngHeader = (w: number, h: number, bits = 8, color = 2) => {
    const b = new Uint8Array(45);
    b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    const v = new DataView(b.buffer);
    v.setUint32(16, w);
    v.setUint32(20, h);
    b[24] = bits;
    b[25] = color;
    b.set([0x49, 0x45, 0x4e, 0x44], 37);
    return b;
};

const hdr = (head: string, res: string) => new TextEncoder().encode(`${head}${res}\n`);

const fill = (n: number, px: number[]) => Uint8Array.from({ length: n * 4 }, (_, i) => px[i % 4]);

describe('textureMeta', () => {
    it('reads png, jpeg, webp and hdr headers', () => {
        expect(textureMeta(read('rgb8.png'), 'rgb8.png')).to.deep.equal(RGB8);
        expect(textureMeta(read('rgba8.png'), 'rgba8.png')).to.include({ type: 'TrueColorAlpha', alpha: true, width: 6 });
        expect(textureMeta(read('rgb16.png'), 'rgb16.png')).to.include({ depth: 16, srgb: false });
        expect(textureMeta(read('grey.jpg'), 'grey.jpg')).to.include({ format: 'jpeg', type: 'Grayscale', srgb: false });
        expect(textureMeta(read('lossy-alpha.webp'), 'a.webp')).to.include({ format: 'webp', alpha: true, height: 4 });
        expect(textureMeta(read('flat.hdr'), 'flat.hdr')).to.include({ format: 'hdr', width: 7, height: 2, depth: 32 });
    });

    it('sniffs content like sharp, whatever the extension', () => {
        expect(textureMeta(read('rgb8.png'), 'rgb8.jpg')).to.deep.equal(RGB8);
    });

    it('leaves extension-decoded formats to the server', () => {
        expect(textureMeta(read('rgb8.png'), 'rgb8.tga')).to.equal(null);
        expect(textureMeta(read('rgb8.png'), 'rgb8.BMP')).to.equal(null);
        expect(textureMeta(read('rgb8.png'), 'rgb8.exr')).to.equal(null);
    });

    it('only reads hdr from .hdr files', () => {
        expect(textureMeta(read('flat.hdr'), 'flat.png')).to.equal(null);
        expect(textureMeta(read('rgb8.png'), 'rgb8.hdr')).to.equal(null);
    });

    it('reads the hdr resolution line like decodeHdr, crlf headers and transposed axes included', () => {
        expect(textureMeta(hdr('#?RADIANCE\r\n\r\n', '+X 5 -Y 3'), 'a.hdr')).to.include({ width: 5, height: 3 });
        expect(textureMeta(hdr('FORMAT=32-bit_rle_rgbe\n\n', '-Y 3 +X 5'), 'a.hdr')).to.include({ width: 5, height: 3 });
        expect(textureMeta(hdr('#?RADIANCE\n\n', 'nonsense'), 'a.hdr')).to.equal(null);
    });

    it('returns null for formats it does not parse', () => {
        expect(textureMeta(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0]), 'a.gif')).to.equal(null);
    });

    it('returns null for pngs libspng rejects', () => {
        expect(textureMeta(pngHeader(4, 4, 16, 3), 'a.png')).to.equal(null);
        expect(textureMeta(pngHeader(4, 4, 8, 5), 'a.png')).to.equal(null);
        expect(textureMeta(pngHeader(0, 4), 'a.png')).to.equal(null);
    });

    it('returns null over the server size limit', () => {
        expect(textureMeta(pngHeader(16385, 4), 'big.png')).to.equal(null);
        expect(textureMeta(pngHeader(16384, 4), 'big.png')).to.not.equal(null);
    });
});

describe('isNormalMap', () => {
    it('detects a flat tangent-space normal map', () => {
        expect(isNormalMap(fill(64, [128, 128, 255, 255]))).to.equal(true);
    });

    it('rejects ordinary colour', () => {
        expect(isNormalMap(fill(64, [255, 0, 0, 255]))).to.equal(false);
    });

    it('rejects fully transparent images like the server (0 / 0)', () => {
        expect(isNormalMap(fill(64, [128, 128, 255, 0]))).to.equal(false);
    });
});
