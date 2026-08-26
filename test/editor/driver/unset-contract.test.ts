import { expect } from 'chai';
import { describe, it } from 'mocha';

import { resolveUnset } from '../../../src/editor/driver/unset';

describe('resolveUnset', () => {
    it('deletes on an open map path', () => {
        expect(resolveUnset({ hasDefault: false, default: undefined, open: true })).to.deep.equal({ op: 'unset' });
    });

    it('deletes on an open path even when a default exists', () => {
        expect(resolveUnset({ hasDefault: true, default: 1, open: true })).to.deep.equal({ op: 'unset' });
    });

    it('resets a fixed field to its default', () => {
        expect(resolveUnset({ hasDefault: true, default: null, open: false })).to.deep.equal({
            op: 'set',
            value: null
        });
    });

    it('deletes a fixed field that has no default', () => {
        expect(resolveUnset({ hasDefault: false, default: undefined, open: false })).to.deep.equal({ op: 'unset' });
    });
});
