import { expect } from 'chai';
import { describe, it } from 'mocha';

import { handleRequest } from '../../src/editor/mcp/request';

describe('handleRequest', () => {
    it('returns handler failures to the caller', async () => {
        const res = await handleRequest('{"id":1,"name":"fail","args":[]}', () => {
            throw new Error('broken');
        });
        expect(res).to.deep.equal({ id: 1, res: { error: 'broken' } });
    });

    it('returns rejected handler failures to the caller', async () => {
        const res = await handleRequest('{"id":2,"name":"fail","args":[]}', () =>
            Promise.reject(new Error('rejected'))
        );
        expect(res).to.deep.equal({ id: 2, res: { error: 'rejected' } });
    });

    it('preserves immediate handler errors such as unknown methods', async () => {
        const res = await handleRequest('{"id":3,"name":"missing","args":[]}', () => ({ error: 'Unknown method' }));
        expect(res).to.deep.equal({ id: 3, res: { error: 'Unknown method' } });
    });

    it('validates requests before dispatch', async () => {
        const res = await handleRequest('{"id":4,"name":"ping","args":null}', () => ({ data: 'pong' }));
        expect(res).to.deep.equal({ id: 4, res: { error: 'Invalid request args' } });
    });

    it('does not respond when malformed JSON has no request id', async () => {
        const res = await handleRequest('{', () => ({ data: 'pong' }));
        expect(res).to.have.property('error');
        expect(res).not.to.have.property('id');
    });
});
