import { expect } from 'chai';
import { describe, it } from 'mocha';

import { decodeBmp } from '../../src/texture-convert/decode-bmp';
import { decodeHdr } from '../../src/texture-convert/decode-hdr';
import { decodeTga } from '../../src/texture-convert/decode-tga';

const tga = (type: number, w: number, h: number, bpp: number, descriptor: number, body: number[]) =>
    new Uint8Array([0, 0, type, 0, 0, 0, 0, 0, 0, 0, 0, 0, w, 0, h, 0, bpp, descriptor, ...body]);

const bmp = (w: number, h: number, bpp: number, compression: number, body: number[]) => {
    const b = new Uint8Array(54 + body.length);
    const dv = new DataView(b.buffer);
    b[0] = 0x42;
    b[1] = 0x4d;
    dv.setUint32(2, b.length, true);
    dv.setUint32(10, 54, true);
    dv.setUint32(14, 40, true);
    dv.setInt32(18, w, true);
    dv.setInt32(22, h, true);
    dv.setUint16(26, 1, true);
    dv.setUint16(28, bpp, true);
    dv.setUint32(30, compression, true);
    b.set(body, 54);
    return b;
};

const hdr = (res: string, body: number[]) =>
    new Uint8Array([...new TextEncoder().encode(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n${res}\n`), ...body]);

describe('decodeTga', () => {
    it('decodes 24-bit bottom-left in file order', () => {
        const img = decodeTga(tga(2, 2, 2, 24, 0, [3, 2, 1, 6, 5, 4, 9, 8, 7, 12, 11, 10]));
        expect([...img.data]).to.deep.equal([1, 2, 3, 255, 4, 5, 6, 255, 7, 8, 9, 255, 10, 11, 12, 255]);
        expect(img.isBottomLeft).to.equal(true);
        expect(img.hasAlpha).to.equal(false);
        expect(img.isGrayscale).to.equal(false);
    });

    it('decodes a 32-bit rle run with alpha, top-left', () => {
        const img = decodeTga(tga(10, 2, 1, 32, 0x28, [0x81, 30, 20, 10, 128]));
        expect([...img.data]).to.deep.equal([10, 20, 30, 128, 10, 20, 30, 128]);
        expect(img.isBottomLeft).to.equal(false);
        expect(img.hasAlpha).to.equal(true);
    });

    it('decodes 8-bit grayscale', () => {
        const img = decodeTga(tga(3, 1, 1, 8, 0, [77]));
        expect([...img.data]).to.deep.equal([77, 77, 77, 255]);
        expect(img.isGrayscale).to.equal(true);
    });

    it('rejects colour-mapped images like the server', () => {
        expect(() => decodeTga(tga(1, 1, 1, 8, 0, [0]))).to.throw('Unsupported TGA image type: 1');
    });
});

describe('decodeBmp', () => {
    it('decodes padded 24-bit rows bottom-up', () => {
        const img = decodeBmp(bmp(1, 2, 24, 0, [3, 2, 1, 0, 6, 5, 4, 0]));
        expect([...img.data]).to.deep.equal([1, 2, 3, 255, 4, 5, 6, 255]);
        expect(img.isBottomUp).to.equal(true);
        expect(img.hasAlpha).to.equal(false);
    });

    it('treats a negative height as top-down', () => {
        const img = decodeBmp(bmp(1, -1, 24, 0, [3, 2, 1, 0]));
        expect(img.isBottomUp).to.equal(false);
        expect(img.height).to.equal(1);
    });

    it('rejects compressed bmps like the server', () => {
        expect(() => decodeBmp(bmp(1, 1, 24, 1, [0, 0, 0, 0]))).to.throw('Unsupported BMP compression type: 1');
    });
});

describe('decodeHdr', () => {
    it('decodes flat rgbe', () => {
        const img = decodeHdr(hdr('-Y 1 +X 2', [128, 64, 0, 129, 0, 0, 0, 0]));
        expect([...img.data]).to.deep.equal([1, 0.5, 0, 0, 0, 0]);
    });

    it('reorders +Y (bottom-up) scanlines', () => {
        const img = decodeHdr(hdr('+Y 2 +X 1', [128, 0, 0, 129, 0, 128, 0, 129]));
        expect([...img.data]).to.deep.equal([0, 1, 0, 1, 0, 0]);
    });
});
