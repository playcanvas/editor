import { expect } from 'chai';
import { describe, it } from 'mocha';

import { redactText, sanitize } from '../../src/common/redact';

describe('sanitize', () => {
    it('masks secret-looking keys and recurses into plain objects and arrays', () => {
        const out = sanitize({
            password: 'p',
            nested: [{ access_token: 't', ok: 1 }],
            Authorization: 'Bearer x'
        }) as Record<string, unknown>;
        expect(out.password).to.equal('********');
        expect(out.Authorization).to.equal('********');
        expect((out.nested as Record<string, unknown>[])[0]).to.deep.equal({ access_token: '********', ok: 1 });
    });

    it('marks circular references instead of recursing forever', () => {
        const a: Record<string, unknown> = { name: 'a' };
        a.self = a;
        expect((sanitize(a) as Record<string, unknown>).self).to.equal('[Circular]');
    });

    it('leaves class instances untouched', () => {
        const err = new Error('boom');
        expect(sanitize(err)).to.equal(err);
        expect(sanitize(new Date(0))).to.be.instanceOf(Date);
    });

    it('returns primitives as-is', () => {
        expect(sanitize('x')).to.equal('x');
        expect(sanitize(3)).to.equal(3);
        expect(sanitize(null)).to.equal(null);
    });
});

describe('redactText', () => {
    it('redacts JWTs', () => {
        expect(redactText('token eyJhbGci.eyJzdWIi.SflKxwRJ done')).to.equal('token <jwt> done');
    });

    it('redacts bearer tokens and auth headers', () => {
        expect(redactText('sent Bearer abc.def')).to.equal('sent Bearer <redacted>');
        expect(redactText('Cookie=session=1; other')).to.equal('Cookie: <redacted>; other');
        // bearer is stripped first so the header pass never sees the raw token
        expect(redactText('Authorization: Bearer abc.def')).to.not.include('abc.def');
    });

    it('redacts token-like query parameters including camelCase accessToken', () => {
        expect(redactText('https://x/api?accessToken=abc&access_token=def&id=5')).to.equal(
            'https://x/api?accessToken=<redacted>&access_token=<redacted>&id=5'
        );
    });

    it('leaves ordinary text alone', () => {
        expect(redactText('failed to load asset 42')).to.equal('failed to load asset 42');
    });
});
