import { expect } from 'chai';
import { describe, it } from 'mocha';

import { parsePort } from '../../../src/editor/mcp/port';

describe('parsePort', () => {
    it('accepts ports from 1 to 65535', () => {
        expect(parsePort('52000')).to.equal(52000);
        expect(parsePort('1')).to.equal(1);
        expect(parsePort('65535')).to.equal(65535);
        expect(parsePort(' 8080 ')).to.equal(8080);
    });

    it('accepts a stored number', () => {
        expect(parsePort(52000)).to.equal(52000);
    });

    it('rejects ports out of range, which new WebSocket() throws on', () => {
        // values seen in Sentry: a 52000 typo and two other out-of-range ports
        expect(parsePort('520000')).to.equal(null);
        expect(parsePort('400000')).to.equal(null);
        expect(parsePort('5475445')).to.equal(null);
        expect(parsePort('65536')).to.equal(null);
        expect(parsePort('0')).to.equal(null);
        expect(parsePort(-1)).to.equal(null);
    });

    it('rejects anything that is not a whole number', () => {
        expect(parsePort('')).to.equal(null);
        expect(parsePort('52000abc')).to.equal(null);
        expect(parsePort('5e4')).to.equal(null);
        expect(parsePort('52000.5')).to.equal(null);
        expect(parsePort(52000.5)).to.equal(null);
        expect(parsePort(null)).to.equal(null);
        expect(parsePort(undefined)).to.equal(null);
    });
});
