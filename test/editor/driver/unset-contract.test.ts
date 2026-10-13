import { expect } from 'chai';
import { describe, it } from 'mocha';

import { resolveUnset } from '../../../src/editor/driver/unset';

describe('resolveUnset', () => {
    it('deletes on an open map path', () => {
        expect(resolveUnset({ hasDefault: false, default: undefined, open: true, optional: true })).to.deep.equal({
            op: 'unset'
        });
    });

    it('deletes on an open path even when a default exists', () => {
        expect(resolveUnset({ hasDefault: true, default: 1, open: true, optional: true })).to.deep.equal({
            op: 'unset'
        });
    });

    it('deletes a fixed optional field', () => {
        expect(resolveUnset({ hasDefault: false, default: undefined, open: false, optional: true })).to.deep.equal({
            op: 'unset'
        });
    });

    it('resets a fixed defaulted child beneath a dynamic record', () => {
        expect(resolveUnset({ hasDefault: true, default: 100, open: false, optional: false })).to.deep.equal({
            op: 'set',
            value: 100
        });
    });

    it('rejects a fixed required field that has no default', () => {
        expect(resolveUnset({ hasDefault: false, default: undefined, open: false, optional: false })).to.equal(null);
    });
});
