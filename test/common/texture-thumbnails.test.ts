import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
    THUMBNAIL_SIZES,
    createThumbnailQueue,
    decodeRgbm,
    isRemoteWrite,
    wantsClientThumbnails
} from '../../src/common/texture-thumbnails';

const asset = (data: Record<string, unknown>) => ({ get: (path: string) => data[path] });
const blob = (n: number) => new Blob([new Uint8Array([n])]);
const buffers = () => THUMBNAIL_SIZES.map(({ size }) => new Uint8Array([size]).buffer);
const tick = () => new Promise((r) => setTimeout(r, 10));

describe('texture thumbnails', () => {
    it('uses the texture-thumbnails job sizes, largest first', () => {
        expect(THUMBNAIL_SIZES).to.deep.equal([
            { name: 'xlarge', size: 512 },
            { name: 'large', size: 256 },
            { name: 'medium', size: 128 },
            { name: 'small', size: 64 }
        ]);
    });

    describe('decodeRgbm', () => {
        it('decodes like the texture-thumbnails job and makes the result opaque', () => {
            const px = new Uint8ClampedArray([255, 0, 0, 255, 16, 16, 16, 255, 16, 16, 16, 128, 200, 100, 50, 0]);
            expect(Array.from(decodeRgbm(px))).to.deep.equal([
                255, 0, 0, 255, 136, 136, 136, 255, 73, 73, 73, 255, 0, 0, 0, 255
            ]);
        });
    });

    describe('wantsClientThumbnails', () => {
        const file = new Blob([new Uint8Array([1])]);

        it('is true for noConvert texture and textureatlas uploads with a file', () => {
            expect(wantsClientThumbnails('texture', true, file)).to.equal(true);
            expect(wantsClientThumbnails('textureatlas', true, file)).to.equal(true);
        });

        it('is false without noConvert, since server conversion resets thumbnails itself', () => {
            expect(wantsClientThumbnails('texture', false, file)).to.equal(false);
        });

        it('is false for other types or no file', () => {
            expect(wantsClientThumbnails('font', true, file)).to.equal(false);
            expect(wantsClientThumbnails('texture', true, new Blob([]))).to.equal(false);
            expect(wantsClientThumbnails('texture', true, undefined)).to.equal(false);
        });

        it('is false when the caller already owns thumbnails (noThumbnails)', () => {
            expect(wantsClientThumbnails('texture', true, file, true)).to.equal(false);
        });
    });

    describe('isRemoteWrite', () => {
        it('is true while observer sync applies a remote op', () => {
            expect(isRemoteWrite({ sync: { enabled: false } })).to.equal(true);
        });

        it('is false for local changes or unsynced observers', () => {
            expect(isRemoteWrite({ sync: { enabled: true } })).to.equal(false);
            expect(isRemoteWrite({})).to.equal(false);
        });
    });

    describe('createThumbnailQueue', () => {
        it('uploads one jpeg per size and passes rgbm through', async () => {
            const calls: [number, boolean][] = [];
            let uploaded: { id: number; thumbs: Record<string, Blob> };
            const enqueue = createThumbnailQueue({
                generate: async (buffer, rgbm) => {
                    calls.push([new Uint8Array(buffer)[0], rgbm]);
                    return buffers();
                },
                upload: async (id, thumbs) => {
                    uploaded = { id, thumbs };
                },
                fallback: () => expect.fail('unexpected fallback')
            });

            await enqueue(asset({ id: 7, 'data.rgbm': true }), blob(9));

            expect(calls).to.deep.equal([[9, true]]);
            expect(uploaded.id).to.equal(7);
            expect(Object.keys(uploaded.thumbs)).to.deep.equal(['xlarge', 'large', 'medium', 'small']);
            expect(uploaded.thumbs.small.type).to.equal('image/jpeg');
            expect(new Uint8Array(await uploaded.thumbs.small.arrayBuffer())[0]).to.equal(64);
        });

        it("an explicit rgbm overrides the asset's data.rgbm", async () => {
            const calls: boolean[] = [];
            const enqueue = createThumbnailQueue({
                generate: async (_buffer, rgbm) => {
                    calls.push(rgbm);
                    return buffers();
                },
                upload: async () => undefined,
                fallback: () => expect.fail('unexpected fallback')
            });

            await enqueue(asset({ id: 8, 'data.rgbm': true }), blob(1), false);
            await enqueue(asset({ id: 9 }), blob(1), true);

            expect(calls).to.deep.equal([false, true]);
        });

        it('falls back to the server job when generation fails', async () => {
            const fallbacks: number[] = [];
            const enqueue = createThumbnailQueue({
                generate: () => Promise.reject(new Error('decode failed')),
                upload: () => expect.fail('unexpected upload'),
                fallback: (id) => fallbacks.push(id)
            });

            await enqueue(asset({ id: 3 }), blob(1));

            expect(fallbacks).to.deep.equal([3]);
        });

        it('falls back to the server job when the upload is rejected', async () => {
            const fallbacks: number[] = [];
            const enqueue = createThumbnailQueue({
                generate: async () => buffers(),
                upload: () => Promise.reject(new Error('400')),
                fallback: (id) => fallbacks.push(id)
            });

            await enqueue(asset({ id: 4 }), blob(1));

            expect(fallbacks).to.deep.equal([4]);
        });

        it('runs one texture at a time', async () => {
            let release: () => void;
            const gate = new Promise<void>((r) => (release = r));
            const started: number[] = [];
            const enqueue = createThumbnailQueue({
                generate: async (buffer) => {
                    const n = new Uint8Array(buffer)[0];
                    started.push(n);
                    if (n === 1) {
                        await gate;
                    }
                    return buffers();
                },
                upload: async () => undefined,
                fallback: () => undefined
            });

            const a = enqueue(asset({ id: 1 }), blob(1));
            const b = enqueue(asset({ id: 2 }), blob(2));
            await tick();
            expect(started).to.deep.equal([1]);

            release();
            await Promise.all([a, b]);
            expect(started).to.deep.equal([1, 2]);
        });

        it('keeps going after a failure', async () => {
            const uploads: number[] = [];
            const enqueue = createThumbnailQueue({
                generate: (buffer) =>
                    new Uint8Array(buffer)[0] === 1 ? Promise.reject(new Error('boom')) : Promise.resolve(buffers()),
                upload: async (id) => {
                    uploads.push(id);
                },
                fallback: () => undefined
            });

            await Promise.all([enqueue(asset({ id: 1 }), blob(1)), enqueue(asset({ id: 2 }), blob(2))]);

            expect(uploads).to.deep.equal([2]);
        });
    });
});
