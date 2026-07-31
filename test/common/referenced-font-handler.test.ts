import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isReferencedFont, normalizeFontJson } from '../../src/common/referenced-font-handler';

describe('isReferencedFont', () => {
    it('true when data has a jsonAsset field (even null)', () => {
        expect(isReferencedFont({ data: { jsonAsset: 5 } })).to.equal(true);
        expect(isReferencedFont({ data: { jsonAsset: null } })).to.equal(true);
    });
    it('false for server fonts (no jsonAsset field)', () => {
        expect(isReferencedFont({ data: { chars: {}, info: {} } })).to.equal(false);
        expect(isReferencedFont({ data: null })).to.equal(false);
        expect(isReferencedFont({})).to.equal(false);
    });
});

describe('normalizeFontJson', () => {
    const valid = {
        version: 3,
        info: { face: 'unisans', maps: [{ width: 512, height: 512 }] },
        chars: { A: { id: 65, map: 0 } }
    };

    it('passes a v3 descriptor through untouched', () => {
        const [err, data] = normalizeFontJson(valid);
        expect(err).to.equal(null);
        expect(data).to.equal(valid);
    });

    it('pins the version when missing so pc.Font does not rewrite info.maps', () => {
        const noVersion = { info: valid.info, chars: valid.chars };
        const [err, data] = normalizeFontJson(noVersion);
        expect(err).to.equal(null);
        expect(data.version).to.equal(3);
        expect(data.info.maps).to.deep.equal([{ width: 512, height: 512 }]);
        // must not write into the json asset resource
        expect(noVersion).to.not.have.property('version');
    });

    it('pins the version when below 2, keeping the declared maps', () => {
        const [err, data] = normalizeFontJson({ ...valid, version: 1 });
        expect(err).to.equal(null);
        expect(data.version).to.equal(3);
        expect(data.info.maps).to.deep.equal([{ width: 512, height: 512 }]);
    });

    it('leaves a v2 descriptor at its own version', () => {
        const [err, data] = normalizeFontJson({ ...valid, version: 2 });
        expect(err).to.equal(null);
        expect(data.version).to.equal(2);
    });

    it('rejects a missing or non-object descriptor', () => {
        expect(normalizeFontJson(null)[0]).to.be.a('string');
        expect(normalizeFontJson(undefined)[0]).to.be.a('string');
        expect(normalizeFontJson('{}')[0]).to.be.a('string');
    });

    it('rejects a descriptor with no info.maps array', () => {
        expect(normalizeFontJson({ ...valid, info: { face: 'x' } })[0]).to.be.a('string');
        expect(normalizeFontJson({ ...valid, info: { maps: [] } })[0]).to.be.a('string');
        expect(normalizeFontJson({ ...valid, info: { maps: 1 } })[0]).to.be.a('string');
        expect(normalizeFontJson({ ...valid, info: undefined })[0]).to.be.a('string');
    });

    it('rejects a descriptor with no chars', () => {
        expect(normalizeFontJson({ ...valid, chars: {} })[0]).to.be.a('string');
        expect(normalizeFontJson({ ...valid, chars: null })[0]).to.be.a('string');
    });

    it('rejects chars keyed by codepoint instead of letter', () => {
        expect(normalizeFontJson({ ...valid, chars: { 65: { id: 65 } } })[0]).to.be.a('string');
    });

    it('accepts a digits-only font, whose letter keys are themselves digits', () => {
        const [err] = normalizeFontJson({ ...valid, chars: { 7: { id: 55 }, 8: { id: 56 } } });
        expect(err).to.equal(null);
    });

    it('accepts chars with no id, which carry no keying evidence', () => {
        const [err] = normalizeFontJson({ ...valid, chars: { A: { map: 0 } } });
        expect(err).to.equal(null);
    });
});
