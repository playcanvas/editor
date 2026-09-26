import { expect } from 'chai';
import { describe, it } from 'mocha';

import { encodeRGBM, flipRows, from16, pack, resizeRgba, tonemap, toRgbm } from '../../src/texture-convert/pixels';

const solid = (w: number, h: number, px: number[]) => ({
    data: new Uint8Array(Array.from({ length: w * h }, () => px).flat()),
    width: w,
    height: h
});

describe('flipRows', () => {
    it('reverses row order', () => {
        const img = { data: new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2]), width: 1, height: 2 };
        expect([...flipRows(img).data]).to.deep.equal([2, 2, 2, 2, 1, 1, 1, 1]);
    });
});

describe('from16', () => {
    it('expands grey+alpha and drops the low byte', () => {
        const img = from16({ data: new Uint16Array([0xff80, 0x1234]), width: 1, height: 1, channels: 2 });
        expect([...img.data]).to.deep.equal([0xff, 0xff, 0xff, 0x12]);
    });

    it('keeps rgb and fills alpha', () => {
        const img = from16({ data: new Uint16Array([0x0100, 0x0200, 0x0300]), width: 1, height: 1, channels: 3 });
        expect([...img.data]).to.deep.equal([1, 2, 3, 255]);
    });
});

describe('pack', () => {
    const px = new Uint8Array([10, 20, 30, 40]);

    it('keeps rgba as is', () => {
        expect(pack(px, true)).to.equal(px);
    });

    it('drops alpha', () => {
        expect([...pack(px, false)]).to.deep.equal([10, 20, 30]);
    });
});

describe('rgbm', () => {
    it('matches the server encoder', () => {
        const [r, g, b, a] = encodeRGBM(1, 1, 1);
        expect(r).to.be.closeTo(0.99609375, 1e-9);
        expect(g).to.be.closeTo(0.99609375, 1e-9);
        expect(b).to.be.closeTo(0.99609375, 1e-9);
        expect(a).to.be.closeTo(32 / 255, 1e-9);
    });

    it('truncates rgbm like the server buffer', () => {
        // 256 * 128/255 = 128.5: a Buffer (and Uint8Array) stores 128, a clamped array would store 129
        const px = { data: new Float32Array([16, 0, 0, 0, 0, 0]), width: 2, height: 1 };
        expect([...toRgbm(px)]).to.deep.equal([255, 0, 0, 128, 0, 0, 0, 1]);
    });

    it('tonemaps like the server preview', () => {
        const px = { data: new Float32Array([1, 1, 1, -1, 0, 0]), width: 2, height: 1 };
        expect([...tonemap(px)]).to.deep.equal([186, 186, 186, 0, 0, 0]);
    });
});

describe('resizeRgba', () => {
    it('returns the requested size', () => {
        const out = resizeRgba(solid(20, 12, [1, 2, 3, 255]), 16, 16);
        expect(out.width).to.equal(16);
        expect(out.height).to.equal(16);
        expect(out.data.length).to.equal(16 * 16 * 4);
    });

    it('keeps a solid image solid', () => {
        const out = resizeRgba(solid(20, 12, [200, 100, 50, 255]), 16, 16);
        for (let i = 0; i < out.data.length; i += 4) {
            expect([...out.data.subarray(i, i + 4)]).to.deep.equal([200, 100, 50, 255]);
        }
    });

    it('is the identity at the same size', () => {
        const img = { data: new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255]), width: 2, height: 1 };
        expect([...resizeRgba(img, 2, 1).data]).to.deep.equal([...img.data]);
    });

    // expected rows are sharp 0.33.5 (libvips 8.15.3) resize(w, h, { fit: 'fill' }) output
    const grey = (vals: number[]) => new Uint8Array(vals.flatMap((v) => [v, v, v, 255]));
    const red = (img: { data: Uint8Array }) => [...img.data].filter((_, i) => i % 4 === 0);

    it('upsizes like libvips, bicubic from the top-left pixel edge', () => {
        const out = resizeRgba({ data: grey([0, 50, 100, 150, 200, 250]), width: 6, height: 1 }, 8, 1);
        expect(red(out)).to.deep.equal([0, 9, 50, 88, 125, 163, 200, 241]);
    });

    it('downsizes like libvips, lanczos3 around pixel centres', () => {
        const out = resizeRgba({ data: grey([0, 50, 100, 150, 200, 250, 250, 200]), width: 8, height: 1 }, 6, 1);
        expect(red(out)).to.deep.equal([8, 75, 141, 211, 255, 211]);
    });

    it('shifts an unscaled axis by half a pixel when the other upsizes, like libvips', () => {
        const out = resizeRgba({ data: grey([0, 100, 200, 0, 100, 200]), width: 3, height: 2 }, 3, 3);
        expect(red(out)).to.deep.equal([0, 44, 156, 0, 44, 156, 0, 44, 156]);
    });

    it('does not bleed colour from transparent pixels', () => {
        // left half opaque red, right half fully transparent green
        const data = new Uint8Array(8 * 1 * 4);
        for (let x = 0; x < 8; x++) {
            data.set(x < 4 ? [255, 0, 0, 255] : [0, 255, 0, 0], x * 4);
        }
        const out = resizeRgba({ data, width: 8, height: 1 }, 4, 1);
        for (let i = 0; i < out.data.length; i += 4) {
            if (out.data[i + 3] > 0) {
                expect(out.data[i + 1], `green at ${i / 4}`).to.be.at.most(1);
            }
        }
    });
});
