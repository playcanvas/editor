import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
    compressFormats,
    compressJob,
    importTexture,
    isTarget,
    keepsFilename,
    queue
} from '../../../src/editor/assets/texture-import';

const obs = (data: Record<string, any>) => ({
    get: (p: string) => p.split('.').reduce((o: any, k) => o?.[k], data)
});

const PNG16 = { format: 'png', type: 'TrueColor', width: 16, height: 16, alpha: false, depth: 8 };
const PNG20 = { ...PNG16, width: 20, height: 12 };
const TGA = { format: 'tga', type: 'TrueColor', width: 16, height: 16, alpha: false, depth: 8 };
const TGA20 = { ...TGA, width: 20, height: 12 };
const EXR = { format: 'exr', type: 'TrueColor', width: 16, height: 16, alpha: false, depth: 32 };
const HDR = { ...EXR, format: 'hdr' };
const OUT = { format: 'jpeg', type: 'TrueColor', width: 16, height: 16, alpha: false, depth: 8 };
const BASIS = { compress: { basis: true } };

// metas are plan 02 answers in call order (source, then output); null means "leave it to the server".
// the worker's decision meta describes the source the same way unless a test says otherwise
const setup = (metas: any[], over: Record<string, any> = {}) => {
    const decision = metas[0] && !(metas[0] instanceof Error) ? metas[0] : null;
    const calls: string[] = [];
    const uploads: any[] = [];
    const thumbs: Blob[] = [];
    const rgbms: (boolean | undefined)[] = [];
    const names: string[] = [];
    const converts: any[] = [];
    const settles: any[] = [];
    const compresses: any[] = [];
    let id = 100;
    const deps = {
        meta: async (_f: Blob, name: string) => {
            names.push(name);
            const m = metas.shift();
            return m instanceof Error ? Promise.reject(m) : m;
        },
        sourceMeta: async () => decision,
        convert: async (_b: ArrayBuffer, _m: any, options: any) => {
            converts.push(options);
            return { file: new Uint8Array([1, 2, 3]).buffer };
        },
        upload: async (a: any) => {
            uploads.push(a);
            calls.push('upload');
            return id++;
        },
        observer: async (i: number) => obs({ id: i }),
        settle: async (_a: any, size: number, dims: any) => {
            settles.push({ size, dims });
            calls.push('settle');
        },
        findTarget: () => null,
        get: () => null,
        thumbnails: async (_a: any, b: Blob, rgbm?: boolean) => {
            thumbs.push(b);
            rgbms.push(rgbm);
            calls.push('thumbs');
        },
        compress: (a: any, src: number, size?: any) => {
            compresses.push({ id: a.get('id'), src, size });
            calls.push('compress');
        },
        ...over
    };
    return { deps, calls, uploads, thumbs, rgbms, names, converts, settles, compresses };
};

// tga/bmp/exr: plan 02 answers null for the source, the worker supplies decision meta
const tgaSource = { sourceMeta: async () => TGA };

// without plan 02's client meta the server's meta job describes every upload
const NO_02 = { meta: undefined };

const withCompress = { observer: async (i: number) => obs({ id: i, meta: BASIS }) };

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);
const args = (over: Record<string, any> = {}) => ({
    file: file('a.png'),
    type: 'texture',
    parent: null,
    existing: null,
    pow2: true,
    related: true,
    preload: true,
    ...over
});

describe('importTexture', () => {
    it('falls back without uploading when meta fails', async () => {
        const t = setup([new Error('bad')]);
        expect(await importTexture(t.deps, args())).to.equal(false);
        expect(t.uploads).to.have.length(0);
    });

    it('falls back when neither meta source can describe the file', async () => {
        const t = setup([null]);
        expect(await importTexture(t.deps, args({ file: file('a.avif') }))).to.equal(false);
        expect(t.uploads).to.have.length(0);
    });

    it('falls back when the worker cannot describe the file', async () => {
        const t = setup([null], { sourceMeta: () => Promise.reject(new Error('unsupported tga')) });
        expect(await importTexture(t.deps, args({ file: file('a.tga') }))).to.equal(false);
        expect(t.uploads).to.have.length(0);
    });

    it('falls back for formats the worker cannot decode', async () => {
        const t = setup([{ ...PNG16, format: 'tiff', depth: 16 }]);
        expect(await importTexture(t.deps, args({ file: file('a.tif') }))).to.equal(false);
        expect(t.uploads).to.have.length(0);
    });

    it('falls back without uploading when the worker fails', async () => {
        const t = setup([PNG20], { convert: () => Promise.reject(new Error('wasm 404')) });
        expect(await importTexture(t.deps, args())).to.equal(false);
        expect(t.uploads).to.have.length(0);
    });

    it('uploads an in-place texture untouched when nothing needs processing', async () => {
        const t = setup([PNG16]);
        const a = args();
        expect(await importTexture(t.deps, a)).to.equal(true);
        expect(t.converts).to.have.length(0);
        expect(t.uploads).to.have.length(1);
        expect(t.uploads[0]).to.include({ noConvert: true, noMeta: true, noThumbnails: true, clientMeta: PNG16 });
        expect(t.uploads[0].file.size).to.equal(a.file.size);

        // no compression settings on the asset, so nothing to queue
        expect(t.calls).to.deep.equal(['upload', 'settle', 'thumbs']);

        // an in-place texture thumbnails from its own file, so plan 03 follows the asset's data.rgbm
        expect(t.rgbms).to.deep.equal([undefined]);
    });

    it('compresses an in-place texture with compression enabled, like the server', async () => {
        // texture-convert/app.js:688-707: finish() queues compress when source and target are the same asset
        const existing = obs({ id: 60, name: 'a.png', type: 'texture', path: [] });
        const t = setup([PNG20, PNG16], withCompress);
        expect(await importTexture(t.deps, args({ existing }))).to.equal(true);
        expect(t.calls).to.deep.equal(['upload', 'settle', 'thumbs', 'compress']);
        expect(t.compresses).to.deep.equal([{ id: 100, src: 100, size: { width: 16, height: 16 } }]);
    });

    it('uploads the resized file for an npot in-place texture', async () => {
        const t = setup([PNG20]);
        expect(await importTexture(t.deps, args())).to.equal(true);
        expect(t.converts[0].size).to.deep.equal({ width: 16, height: 16 });
        expect(t.uploads[0].file.size).to.equal(3);

        // like texture-convert in place: the uploaded file's meta with the new size written over it
        expect(t.names).to.deep.equal(['a.png']);
        expect(t.uploads[0].clientMeta).to.deep.equal({ ...PNG20, width: 16, height: 16 });
        expect(t.settles).to.deep.equal([{ size: 3, dims: { width: 16, height: 16 } }]);
    });

    it('describes a depth-converted in-place texture as 8-bit, like texture-convert', async () => {
        const t = setup([{ ...PNG16, depth: 16, srgb: false }]);
        expect(await importTexture(t.deps, args())).to.equal(true);
        expect(t.converts[0]).to.include({ depthConvert: true });
        expect(t.uploads[0].clientMeta).to.deep.equal({ ...PNG16, depth: 8, srgb: false });
    });

    it('decides from the worker meta alone, so a profile it flags stays on the server', async () => {
        const t = setup([PNG20], { sourceMeta: async () => ({ ...PNG20, icc: true }) });
        expect(await importTexture(t.deps, args())).to.equal(false);
        expect(t.uploads).to.have.length(0);
    });

    it('creates a source and a jpeg target for a tga', async () => {
        const t = setup([null, OUT], tgaSource);
        const parent = obs({ id: 7, path: [3] });
        expect(await importTexture(t.deps, args({ file: file('rock.tga'), parent }))).to.equal(true);
        expect(t.names).to.deep.equal(['rock.tga', 'rock.jpeg']);
        expect(t.uploads).to.have.length(2);

        // the source keeps its server meta job: worker decision meta is never stored
        expect(t.uploads[0]).to.include({ name: 'rock.tga', noConvert: true, noThumbnails: true });
        expect(t.uploads[0]).to.not.have.any.keys('noMeta', 'clientMeta', 'meta');
        expect(t.uploads[1]).to.include({
            name: 'rock.jpeg',
            filename: 'rock.jpeg',
            parent: '7',
            source_asset_id: '100',
            type: 'texture',
            data: null,
            clientMeta: OUT,
            noMeta: true,
            noConvert: true,
            noThumbnails: true
        });
        expect(t.uploads[1].asset).to.equal(null);

        // the create's meta stays createTarget's source meta seed, whatever plan 02 says
        expect(t.uploads[1].meta).to.deep.equal({ ...TGA, srgb: true });
    });

    it('without plan 02, converts a tga and leaves meta to the server', async () => {
        const t = setup([], { ...tgaSource, ...NO_02, sourceMeta: async () => TGA20 });
        expect(await importTexture(t.deps, args({ file: file('rock.tga') }))).to.equal(true);
        expect(t.uploads).to.have.length(2);
        for (const u of t.uploads) {
            expect(u).to.include({ noConvert: true, noThumbnails: true });
            expect(u).to.not.have.any.keys('noMeta');
        }
        expect(t.uploads[0]).to.not.have.any.keys('meta');

        // createTarget's source meta: alpha seeds meta.compress.alpha, srgb data.srgb
        expect(t.uploads[1].meta).to.deep.equal({ ...TGA20, srgb: true });

        // the server meta job fills the target's meta; wait for the size the conversion produced
        expect(t.settles).to.deep.equal([{ size: 3, dims: { width: 16, height: 16 } }]);
        expect(t.calls).to.deep.equal(['upload', 'upload', 'settle', 'thumbs']);
    });

    it('without plan 02, converts png, jpeg and webp from the worker decision meta', async () => {
        for (const format of ['png', 'jpeg', 'webp']) {
            const t = setup([], { ...NO_02, sourceMeta: async () => ({ ...PNG20, format }) });
            expect(await importTexture(t.deps, args({ file: file(`a.${format}`) }))).to.equal(true);
            expect(t.converts).to.deep.equal([{ format, size: { width: 16, height: 16 } }]);
            expect(t.uploads).to.have.length(1);
            expect(t.uploads[0]).to.include({ noConvert: true, noThumbnails: true, name: `a.${format}` });
            expect(t.uploads[0]).to.not.have.any.keys('noMeta', 'clientMeta', 'meta');
        }
    });

    it('without plan 02, an hdr target gets the float source meta, so data.srgb ends up false', async () => {
        const t = setup([], {
            meta: undefined,
            sourceMeta: async () => HDR,
            convert: async () => ({ file: new Uint8Array(3).buffer, preview: new Uint8Array(5).buffer })
        });
        expect(await importTexture(t.deps, args({ file: file('env.hdr') }))).to.equal(true);
        expect(t.uploads[1]).to.include({ name: 'env.png' });
        expect(t.uploads[1].data).to.deep.equal({ rgbm: true });
        expect(t.uploads[1].meta).to.deep.equal({ ...HDR, srgb: false });
    });

    it('converts hdr and exr, thumbnailing the target from the tonemapped preview like the server', async () => {
        for (const [name, m] of [
            ['env.hdr', HDR],
            ['sky.exr', EXR]
        ] as const) {
            const t = setup([], {
                ...NO_02,
                sourceMeta: async () => m,
                convert: async () => ({ file: new Uint8Array(3).buffer, preview: new Uint8Array(5).buffer })
            });
            expect(await importTexture(t.deps, args({ file: file(name) })), name).to.equal(true);
            expect(t.uploads.map((u) => u.noThumbnails)).to.deep.equal([true, true]);
            expect(t.thumbs.map((b) => b.size)).to.deep.equal([5]);
            expect(t.rgbms).to.deep.equal([false]);
        }
    });

    it('leaves a colour-profiled file that needs processing to the server', async () => {
        const t = setup([], { ...NO_02, sourceMeta: async () => ({ ...PNG20, icc: true }) });
        expect(await importTexture(t.deps, args())).to.equal(false);
        expect(t.converts).to.have.length(0);
        expect(t.uploads).to.have.length(0);

        // untouched, the profile stays in the uploaded bytes on both paths
        const u = setup([], { ...NO_02, sourceMeta: async () => ({ ...PNG16, icc: true }) });
        expect(await importTexture(u.deps, args())).to.equal(true);
        expect(u.converts).to.have.length(0);
        expect(u.uploads).to.have.length(1);
    });

    it('leaves a file dropped over a target to the server, which regenerates it from its source', async () => {
        const existing = obs({ id: 41, name: 'a.png', type: 'texture', source_asset_id: '40', path: [] });
        let described = false;
        const t = setup([PNG20], {
            get: (id: string) => (id === '40' ? obs({ id: 40, type: 'texture' }) : null),
            sourceMeta: async () => {
                described = true;
                return PNG20;
            }
        });
        expect(await importTexture(t.deps, args({ existing }))).to.equal(false);
        expect(t.uploads).to.have.length(0);
        expect(described).to.equal(false);

        // a source of another type (a font's atlas) or a deleted one leaves it in place, like the server
        for (const get of [() => obs({ id: 40, type: 'font' }), () => null]) {
            const u = setup([PNG20, PNG16], { get });
            expect(await importTexture(u.deps, args({ existing }))).to.equal(true);
            expect(u.uploads).to.have.length(1);
        }
    });

    it('sends name and parent on a re-upload like uploadToFolder and finds the target in the new folder', async () => {
        // a tga dropped into its target's folder while the source lives elsewhere: the server moves the source
        const existing = obs({ id: 40, name: 'Rock.tga', type: 'texture', path: [5] });
        const parent = obs({ id: 9, path: [3] });
        const looked: any[] = [];
        const t = setup([null, OUT], {
            ...tgaSource,
            findTarget: (src: any, name: string, related: boolean) => {
                looked.push({ path: src.path, name, related });
                return null;
            }
        });
        const a = args({ file: file('rock.tga'), existing, parent, related: false, preload: false });
        expect(await importTexture(t.deps, a)).to.equal(true);
        expect(t.uploads[0]).to.include({ asset: existing, name: 'rock.tga', parent });
        expect(looked).to.deep.equal([
            { path: [3, 9], name: 'rock.jpeg', related: false },
            { path: [3, 9], name: 'rock.jpeg', related: false }
        ]);

        // the new target goes beside the moved source; an update sends no preload, which the server defaults to true
        expect(t.uploads[1]).to.include({ parent: '9', preload: true });

        // an in-place re-upload sends them too
        const png = obs({ id: 60, name: 'A.png', type: 'texture', path: [] });
        const u = setup([PNG20, PNG16]);
        await importTexture(u.deps, args({ existing: png, parent: null }));
        expect(u.uploads[0]).to.include({ asset: png, name: 'a.png', parent: null });
    });

    it('re-import never renames or moves the asset', async () => {
        const existing = obs({ id: 60, name: 'a.png', type: 'texture', path: [4] });
        const t = setup([PNG20, PNG16]);
        await importTexture(t.deps, args({ existing, skipSource: true }));
        expect(t.uploads).to.have.length(1);
        expect(t.uploads[0]).to.not.have.any.keys('name', 'parent');
    });

    it('marks an hdr target rgbm and thumbnails from the preview', async () => {
        const t = setup([HDR, { ...OUT, format: 'png' }], {
            convert: async () => ({ file: new Uint8Array(3).buffer, preview: new Uint8Array(5).buffer })
        });
        expect(await importTexture(t.deps, args({ file: file('env.hdr') }))).to.equal(true);

        // plan 02 describes .hdr, so the source replaces its meta job too
        expect(t.uploads[0]).to.include({ name: 'env.hdr', noMeta: true, clientMeta: HDR });
        expect(t.names).to.deep.equal(['env.hdr', 'env.png']);
        expect(t.uploads[1]).to.deep.include({ noMeta: true, clientMeta: { ...OUT, format: 'png' } });
        expect(t.uploads[1].meta).to.deep.equal({ ...HDR, srgb: false });
        expect(t.uploads[1]).to.include({ name: 'env.png' });
        expect(t.uploads[1].data).to.deep.equal({ rgbm: true });
        expect(t.thumbs[0].size).to.equal(5);

        // the preview is already tonemapped; the target's data.rgbm must not decode it again
        expect(t.rgbms).to.deep.equal([false]);
    });

    it('never resizes an rgbm target, so it settles on the source size', async () => {
        const t = setup([], {
            meta: undefined,
            sourceMeta: async () => ({ ...EXR, width: 20, height: 12 }),
            convert: async (_b: ArrayBuffer, _m: any, o: any) => {
                t.converts.push(o);
                return { file: new Uint8Array(3).buffer, preview: new Uint8Array(5).buffer };
            }
        });
        expect(await importTexture(t.deps, args({ file: file('sky.exr') }))).to.equal(true);
        expect(t.converts[0]).to.include({ rgbm: true });
        expect(t.uploads[1]).to.include({ name: 'sky.png' });
        expect(t.uploads[1].data).to.deep.equal({ rgbm: true });
        expect(t.settles[0].dims).to.deep.equal({ width: 20, height: 12 });
    });

    it('updates an existing target without renaming or moving it', async () => {
        const target = obs({ id: 55, name: 'renamed.jpeg', path: [9] });
        const t = setup([null, OUT], { ...tgaSource, findTarget: () => target });
        await importTexture(t.deps, args({ file: file('rock.tga') }));
        expect(t.uploads[1].asset).to.equal(target);
        expect(t.uploads[1]).to.not.have.any.keys('name', 'parent', 'source_asset_id', 'data');
    });

    it('re-import refreshes the given target, keeps its filename and leaves the source alone', async () => {
        const source = obs({ id: 40, name: 'rock.tga', type: 'texture', path: [] });
        const target = obs({ id: 41, name: 'renamed.jpeg', file: { filename: 'renamed.jpeg' } });
        const t = setup([null, OUT], tgaSource);
        await importTexture(t.deps, args({ file: file('rock.tga'), existing: source, target, skipSource: true }));
        expect(t.uploads).to.have.length(1);
        expect(t.uploads[0].asset).to.equal(target);
        expect(t.uploads[0]).to.include({ filename: 'renamed.jpeg' });
    });

    it('re-import of an in-place texture with nothing to do only re-thumbnails, like the server', async () => {
        const existing = obs({ id: 60, name: 'a.png', type: 'texture', path: [] });
        const t = setup([PNG16]);
        await importTexture(t.deps, args({ existing, skipSource: true }));
        expect(t.uploads).to.have.length(0);
        expect(t.calls).to.deep.equal(['settle', 'thumbs']);
    });

    it('compresses a target from its source only after the new file has settled', async () => {
        const t = setup([null, OUT], { ...tgaSource, ...withCompress });
        await importTexture(t.deps, args({ file: file('rock.tga') }));
        expect(t.calls.slice(-3)).to.deep.equal(['settle', 'thumbs', 'compress']);

        // startTextureCompressJob compresses the target from the source file
        expect(t.compresses).to.deep.equal([{ id: 101, src: 100, size: undefined }]);
    });

    it('skips the pow2 resize like the server when the existing target meta already has that size', async () => {
        // texture-convert/app.js:533 compares options.size with the existing target's meta
        const source = obs({ id: 40, name: 'rock.tga', type: 'texture', path: [] });
        const target = obs({ id: 41, meta: { width: 16, height: 16 } });
        const t = setup([null, OUT], {
            sourceMeta: async () => ({ ...TGA, width: 18, height: 14 }),
            findTarget: () => target
        });
        await importTexture(t.deps, args({ file: file('rock.tga'), existing: source }));
        expect(t.converts[0].size).to.equal(undefined);
        expect(t.uploads[1].asset).to.equal(target);
        expect(t.settles[0].dims).to.deep.equal({ width: 18, height: 14 });
    });

    it('still compresses to the pow2 size after the stale-size skip, like startTextureCompressJob', async () => {
        const source = obs({ id: 40, name: 'rock.tga', type: 'texture', path: [] });
        const target = obs({ id: 41, meta: { width: 16, height: 16 } });
        const t = setup([null, OUT], {
            ...withCompress,
            sourceMeta: async () => ({ ...TGA, width: 18, height: 14 }),
            findTarget: () => target
        });
        await importTexture(t.deps, args({ file: file('rock.tga'), existing: source }));
        expect(t.converts[0].size).to.equal(undefined);
        expect(t.compresses).to.deep.equal([{ id: 101, src: 100, size: { width: 16, height: 16 } }]);
    });

    it('still resizes when the existing target meta differs from the pow2 size', async () => {
        const source = obs({ id: 40, name: 'rock.tga', type: 'texture', path: [] });
        const target = obs({ id: 41, meta: { width: 18, height: 14 } });
        const t = setup([null, OUT], {
            sourceMeta: async () => ({ ...TGA, width: 18, height: 14 }),
            findTarget: () => target
        });
        await importTexture(t.deps, args({ file: file('rock.tga'), existing: source }));
        expect(t.converts[0].size).to.deep.equal({ width: 16, height: 16 });
    });
});

describe('isTarget', () => {
    const src = { id: 40, type: 'texture', path: [1, 2] };
    const asset = (over: Record<string, any> = {}) =>
        obs({ source_asset_id: '40', name: 'rock.jpeg', type: 'texture', path: [5], ...over });

    it('matches source, name and type anywhere when searching related assets', () => {
        expect(isTarget(asset(), src, 'rock.jpeg', true)).to.equal(true);
    });

    it('needs the same folder when not searching related assets', () => {
        expect(isTarget(asset(), src, 'rock.jpeg', false)).to.equal(false);
        expect(isTarget(asset({ path: [1, 2] }), src, 'rock.jpeg', false)).to.equal(true);
    });

    it('rejects a different type or name', () => {
        expect(isTarget(asset({ type: 'textureatlas' }), src, 'rock.jpeg', true)).to.equal(false);
        expect(isTarget(asset(), src, 'rock.png', true)).to.equal(false);
    });
});

describe('compressFormats', () => {
    it('lists the enabled formats', () => {
        expect(compressFormats(obs({ meta: { compress: { basis: true, dxt: false, etc2: true } } }))).to.deep.equal([
            'etc2',
            'basis'
        ]);
    });
});

describe('keepsFilename', () => {
    it('holds when a rest update stores the file under the same name', () => {
        expect(keepsFilename(obs({ name: 'rock.jpeg', file: { filename: 'rock.jpeg' } }))).to.equal(true);

        // the update route appends the file's lowercased extension to a name without it
        expect(keepsFilename(obs({ name: 'rock', file: { filename: 'rock.jpeg' } }))).to.equal(true);
        expect(keepsFilename(obs({ name: 'rock', file: { filename: 'rock.JPEG' } }))).to.equal(false);
    });

    it('fails for an asset renamed away from its file', () => {
        expect(keepsFilename(obs({ name: 'stone.jpeg', file: { filename: 'rock.jpeg' } }))).to.equal(false);
    });
});

describe('compressJob', () => {
    const COMPRESS = {
        basis: true,
        dxt: false,
        alpha: true,
        pvrBpp: 4,
        normals: false,
        quality: 128,
        compressionMode: 'etc'
    };

    // the asset observers by id: uploads over an asset answer with its own id, like the rest api
    const store = (...list: ReturnType<typeof obs>[]) => {
        const all = new Map(list.map((a) => [`${a.get('id')}`, a]));
        const sent: any[] = [];
        return {
            sent,
            deps: {
                upload: async (a: any) => (a.asset ? a.asset.get('id') : 100),
                observer: async (i: number) => all.get(`${i}`),
                get: (i: number | string) => all.get(`${i}`) ?? null,
                compress: (a: any, src: number, size?: any) => sent.push(compressJob(a, all.get(`${src}`), size))
            }
        };
    };

    it('compresses an in-place texture from its own file at the pow2 size, like startTextureCompressJob', async () => {
        const png = obs({
            id: 60,
            uniqueId: '1060',
            name: 'a.png',
            type: 'texture',
            path: [],
            file: { filename: 'a.png' },
            data: { mipmaps: true },
            meta: { compress: COMPRESS, alpha: false, type: 'TrueColorAlpha' }
        });
        const s = store(png);
        const t = setup([PNG20, PNG16], s.deps);
        expect(await importTexture(t.deps, args({ existing: png }))).to.equal(true);
        expect(s.sent).to.deep.equal([
            {
                source: 1060,
                asset: 1060,
                filename: 'a.png',
                options: {
                    formats: ['basis'],
                    alpha: true,
                    pvrBpp: 4,
                    mipmaps: true,
                    normals: false,
                    resize: { width: 16, height: 16 },
                    quality: 128,
                    compressionMode: 'etc',
                    noFlip: true
                }
            }
        ]);
    });

    it('compresses a separate target from the source file, with alpha only when the target has it', async () => {
        const src = obs({
            id: 40,
            uniqueId: '1040',
            name: 'rock.tga',
            type: 'texture',
            path: [],
            file: { filename: 'rock.tga' }
        });
        const target = obs({
            id: 41,
            uniqueId: '1041',
            name: 'rock.jpeg',
            type: 'texture',
            file: { filename: 'rock.jpeg' },
            data: { mipmaps: false },
            meta: { compress: COMPRESS, alpha: false, type: 'TrueColor', width: 20, height: 12 }
        });
        const s = store(src, target);
        const t = setup([null, OUT], {
            ...tgaSource,
            ...s.deps,
            sourceMeta: async () => TGA20,
            findTarget: () => target
        });
        expect(await importTexture(t.deps, args({ file: file('rock.tga'), existing: src }))).to.equal(true);
        expect(s.sent).to.deep.equal([
            {
                source: 1040,
                asset: 1041,
                filename: 'rock.tga',
                options: {
                    formats: ['basis'],
                    alpha: false,
                    pvrBpp: 4,
                    mipmaps: false,
                    normals: false,
                    resize: { width: 16, height: 16 },
                    quality: 128,
                    compressionMode: 'etc',
                    noFlip: true
                }
            }
        ]);
    });
});

describe('queue', () => {
    const tick = () => new Promise((r) => setTimeout(r, 0));

    it('runs at most n jobs at once in call order, and a failed job frees its slot', async () => {
        const run = queue(2);
        const started: number[] = [];
        const finish: ((ok: boolean) => void)[] = [];
        const job = (i: number) => () =>
            new Promise<number>((resolve, reject) => {
                started.push(i);
                finish[i] = (ok) => (ok ? resolve(i) : reject(new Error(`job ${i}`)));
            });
        const out = [0, 1, 2, 3].map((i) => run(job(i)).catch((e: Error) => e.message));
        await tick();
        expect(started).to.deep.equal([0, 1]);
        finish[0](false);
        await tick();
        expect(started).to.deep.equal([0, 1, 2]);
        finish[2](true);
        await tick();
        expect(started).to.deep.equal([0, 1, 2, 3]);
        finish[1](true);
        finish[3](true);
        expect(await Promise.all(out)).to.deep.equal(['job 0', 1, 2, 3]);
    });
});
