import { expect } from 'chai';
import { describe, it } from 'mocha';

import { metaKind, metaWrites } from '../../../src/common/asset-meta/kind';

const file = new Blob(['x']);

const TEX = { format: 'png', type: 'TrueColor', width: 4, height: 2, alpha: false, depth: 8, srgb: true };

describe('metaKind', () => {
    it('maps uploads that run a server meta job', () => {
        expect(metaKind({ type: 'texture', file, noConvert: true })).to.equal('texture');
        expect(metaKind({ type: 'textureatlas', file, noConvert: true })).to.equal('texture');
        expect(metaKind({ type: 'model', file })).to.equal('model');
        expect(metaKind({ type: 'gsplat', file })).to.equal('gsplat');
    });

    it('skips uploads without a file and other types', () => {
        expect(metaKind({ type: 'texture', noConvert: true })).to.equal(null);
        expect(metaKind({ type: 'scene', file })).to.equal(null);
        expect(metaKind({ type: 'animation', file })).to.equal(null);
    });

    it('leaves a texture the server converts to the server, which reads its meta on arrival', () => {
        expect(metaKind({ type: 'texture', file })).to.equal(null);
        expect(metaKind({ type: 'textureatlas', file })).to.equal(null);
    });

    it('leaves meta a caller owns alone (noMeta)', () => {
        expect(metaKind({ type: 'texture', file, noConvert: true, noMeta: true })).to.equal(null);
        expect(metaKind({ type: 'model', file, noMeta: true })).to.equal(null);
    });
});

describe('metaWrites', () => {
    it('replaces a texture meta without compression settings, dropping the normal-map flag', () => {
        const meta = { ...TEX, interlaced: false, compress: { normals: true } };
        expect(metaWrites('texture', null, meta)).to.deep.equal([
            { path: 'meta', value: { ...TEX, interlaced: false } }
        ]);
    });

    it('keeps the compression settings and the interlaced setting of a texture that has them', () => {
        const prev = { width: 1, interlaced: true, compress: { dxt: true, normals: false } };
        const writes = metaWrites('textureatlas', prev, { ...TEX, compress: { normals: true } });
        expect(writes).to.deep.include({ path: 'meta.width', value: 4 });
        expect(writes).to.deep.include({ path: 'meta.interlaced', value: true });
        expect(writes).to.deep.include({ path: 'meta.compress.normals', value: true });
        expect(writes.map((w) => w.path)).to.not.include('meta');
        expect(writes.map((w) => w.path)).to.not.include('meta.compress');
    });

    it('never marks a float texture interlaced', () => {
        const [write] = metaWrites('texture', { interlaced: true }, { ...TEX, format: 'hdr', depth: 32 });
        expect((write.value as { interlaced: boolean }).interlaced).to.equal(false);
    });

    it('carries a model user mapping over', () => {
        const meta = { meshes: 1 };
        expect(metaWrites('model', { userMapping: { 0: 5 } }, meta)).to.deep.equal([
            { path: 'meta', value: { meshes: 1, userMapping: { 0: 5 } } }
        ]);
        expect(metaWrites('model', null, meta)).to.deep.equal([{ path: 'meta', value: meta }]);
    });

    it('replaces gsplat meta whole', () => {
        const meta = { format: 'PLY', count: 9 };
        expect(metaWrites('gsplat', { count: 1 }, meta)).to.deep.equal([{ path: 'meta', value: meta }]);
    });
});
