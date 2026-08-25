import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isDeepEqual } from '../../../src/editor/templates/deep-equal-compare';

describe('isDeepEqual null vs absent', () => {
    it('treats an explicit null and an absent key as equal', () => {
        expect(isDeepEqual({ a: 1, b: null }, { a: 1 })).to.equal(true);
        expect(isDeepEqual({ a: 1 }, { a: 1, b: null })).to.equal(true);
    });

    it('still reports a genuine difference', () => {
        expect(isDeepEqual({ a: 1, b: 2 }, { a: 1 })).to.equal(false);
        expect(isDeepEqual({ a: 1, b: null }, { a: 1, b: 2 })).to.equal(false);
    });

    it('recurses through nested containers', () => {
        expect(isDeepEqual({ c: { x: 1, y: null } }, { c: { x: 1 } })).to.equal(true);
    });

    it('does not conflate null with a zero value', () => {
        expect(isDeepEqual({ a: null }, { a: 0 })).to.equal(false);
        expect(isDeepEqual({ a: null }, { a: false })).to.equal(false);
        expect(isDeepEqual({ a: null }, { a: [] })).to.equal(false);
    });
});
