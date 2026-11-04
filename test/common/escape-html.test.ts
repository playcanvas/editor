import { expect } from 'chai';
import { describe, it } from 'mocha';

import { escapeHtml, isHttpUrl } from '../../src/common/utils';

describe('escapeHtml', () => {
    it('leaves plain text unchanged', () => {
        expect(escapeHtml('Box [entity]')).to.equal('Box [entity]');
        expect(escapeHtml('How fast it moves')).to.equal('How fast it moves');
    });

    it('escapes markup and quotes', () => {
        expect(escapeHtml('<img src onerror="x()">')).to.equal('&#60;img src onerror=&#34;x()&#34;&#62;');
        expect(escapeHtml("a & b's")).to.equal('a &#38; b&#39;s');
    });

    it('treats missing values as empty', () => {
        expect(escapeHtml(undefined)).to.equal('');
        expect(escapeHtml(null)).to.equal('');
    });
});

describe('isHttpUrl', () => {
    it('accepts http and https urls', () => {
        expect(isHttpUrl('https://example.test/jane')).to.equal(true);
        expect(isHttpUrl('HTTP://example.test')).to.equal(true);
    });

    it('rejects other schemes and non-strings', () => {
        expect(isHttpUrl('javascript:alert(1)')).to.equal(false);
        expect(isHttpUrl(' javascript:alert(1)')).to.equal(false);
        expect(isHttpUrl('data:text/html,x')).to.equal(false);
        expect(isHttpUrl('//example.test')).to.equal(false);
        expect(isHttpUrl(undefined)).to.equal(false);
    });
});
