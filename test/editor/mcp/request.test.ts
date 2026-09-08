import { expect } from 'chai';
import { describe, it } from 'mocha';

import { message } from '../../../src/editor/mcp/request';

describe('message', () => {
    it('reports a rejection with no reason', () => {
        expect(message(undefined)).to.equal('Unknown error (no reason provided).');
        expect(message(null)).to.equal('Unknown error (no reason provided).');
    });

    it('unwraps errors, strings and error-shaped objects', () => {
        expect(message(new Error('boom'))).to.equal('boom');
        expect(message('boom')).to.equal('boom');
        expect(message({ message: 'boom' })).to.equal('boom');
        expect(message({ error: 'boom' })).to.equal('boom');
        expect(message({ response: { message: 'boom' } })).to.equal('boom');
    });
});
