import fs from 'node:fs';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
    canConvert,
    isInPlace,
    MAX_BYTES,
    needsProcess,
    targetName,
    textureOptions
} from '../../src/texture-convert/options';

const cases = JSON.parse(fs.readFileSync('test/fixtures/texture-convert/texture-options-cases.json', 'utf8'));

describe('textureOptions', () => {
    for (const c of cases) {
        it(c.name, () => {
            expect(textureOptions(c.meta, c.pow2)).to.deep.equal(c.expected);
        });
    }

    it('is null without meta', () => {
        expect(textureOptions(null, true)).to.equal(null);
    });

    it('does not mutate a jpg meta', () => {
        const meta = { format: 'jpg', width: 8, height: 8, depth: 8 };
        textureOptions(meta, false);
        expect(meta.format).to.equal('jpg');
    });
});

describe('canConvert', () => {
    const meta = (format: string, width = 64, height = 64, depth = 8) => ({
        format,
        width,
        height,
        depth,
        alpha: false
    });
    const ok = (m: ReturnType<typeof meta>, bytes = 1024) => canConvert(m, textureOptions(m, true), bytes);

    it('accepts every client source format', () => {
        for (const f of ['png', 'jpeg', 'jpg', 'webp', 'tga', 'bmp']) {
            expect(ok(meta(f)), f).to.equal(true);
        }
        expect(ok(meta('hdr', 64, 64, 32))).to.equal(true);
        expect(ok(meta('exr', 64, 64, 32))).to.equal(true);
    });

    it('leaves a colour-profiled file to the server only when it needs processing', () => {
        expect(ok({ ...meta('png', 20, 12), icc: true } as any)).to.equal(false);
        expect(ok({ ...meta('png', 64, 64, 16), icc: true } as any)).to.equal(false);
        expect(ok({ ...meta('jpeg'), icc: true } as any)).to.equal(true);
    });

    it('leaves gif, avif, tiff and dds to the server', () => {
        expect(ok(meta('gif'))).to.equal(false);
        expect(ok(meta('avif'))).to.equal(false);
        expect(ok(meta('tiff', 64, 64, 16))).to.equal(false);
        expect(ok(meta('dds'))).to.equal(false);
    });

    it('leaves an 8k hdr panorama to the server', () => {
        expect(ok(meta('hdr', 8192, 4096, 32))).to.equal(false);
    });

    it('checks the pow2 target size, not just the source', () => {
        // 4096x3000 rounds to 4096x4096 (at the cap); 5800 rounds up to 8192 (over it)
        expect(ok(meta('png', 4096, 3000))).to.equal(true);
        expect(ok(meta('png', 5800, 4096))).to.equal(false);
    });

    it('leaves files over the byte cap to the server', () => {
        expect(ok(meta('png'), MAX_BYTES + 1)).to.equal(false);
    });

    it('rejects meta without dimensions', () => {
        expect(canConvert({ format: 'png', depth: 8 }, { format: 'png' }, 10)).to.equal(false);
    });
});

describe('isInPlace / needsProcess / targetName', () => {
    it('treats png→png as in place and tga→jpeg as a target', () => {
        expect(isInPlace({ format: 'png' }, { format: 'png' })).to.equal(true);
        expect(isInPlace({ format: 'jpg' }, { format: 'jpeg' })).to.equal(true);
        expect(isInPlace({ format: 'tga' }, { format: 'jpeg' })).to.equal(false);
    });

    it('needs processing only for a resize or depth convert', () => {
        expect(needsProcess({ format: 'png' })).to.equal(false);
        expect(needsProcess({ format: 'png', size: { width: 2, height: 2 } })).to.equal(true);
        expect(needsProcess({ format: 'png', depthConvert: true })).to.equal(true);
    });

    it('names the target like path.parse(name).name + format', () => {
        expect(targetName('rock.tga', 'jpeg')).to.equal('rock.jpeg');
        expect(targetName('a.b.hdr', 'png')).to.equal('a.b.png');
        expect(targetName('rock', 'png')).to.equal('rock.png');
        expect(targetName('.tga', 'jpeg')).to.equal('.tga.jpeg');
    });
});
