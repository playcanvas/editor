import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isReferencedFont } from '../../src/common/referenced-font-handler';

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
