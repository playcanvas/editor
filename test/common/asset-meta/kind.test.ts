import { expect } from 'chai';
import { describe, it } from 'mocha';

import { metaKind } from '../../../src/common/asset-meta/kind';

const file = new Blob(['x']);

describe('metaKind', () => {
    it('maps uploads that run a server meta job', () => {
        expect(metaKind({ type: 'texture', file })).to.equal('texture');
        expect(metaKind({ type: 'textureatlas', file })).to.equal('texture');
        expect(metaKind({ type: 'model', file })).to.equal('model');
        expect(metaKind({ type: 'gsplat', file })).to.equal('gsplat');
    });

    it('skips uploads without a file and other types', () => {
        expect(metaKind({ type: 'texture' })).to.equal(null);
        expect(metaKind({ type: 'scene', file })).to.equal(null);
        expect(metaKind({ type: 'animation', file })).to.equal(null);
    });

    it('leaves meta the caller already computed alone (noMeta, e.g. plan 04)', () => {
        expect(metaKind({ type: 'texture', file, noMeta: true })).to.equal(null);
        expect(metaKind({ type: 'textureatlas', file, noMeta: true })).to.equal(null);
    });
});
