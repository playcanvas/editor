import { expect } from 'chai';
import { describe, it } from 'mocha';

import { decodeHtmlEntities, escapeHtml, isHttpUrl } from '../../src/common/utils';

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

describe('decodeHtmlEntities', () => {
    it('decodes named and numeric entities', () => {
        expect(decodeHtmlEntities('Paste &amp; Go')).to.equal('Paste & Go');
        expect(decodeHtmlEntities('&lt;b&gt; &quot;x&quot; &#39;y&#x27;')).to.equal('<b> "x" \'y\'');
    });

    it('decodes one level only', () => {
        expect(decodeHtmlEntities('Paste &amp;amp;')).to.equal('Paste &amp;');
    });

    it('round-trips escaped text', () => {
        expect(decodeHtmlEntities(escapeHtml("a & <b>'s"))).to.equal("a & <b>'s");
    });

    it('leaves plain text, lone ampersands and unknown entities unchanged', () => {
        expect(decodeHtmlEntities('Rock & Roll')).to.equal('Rock & Roll');
        expect(decodeHtmlEntities('&bogus; &#0;')).to.equal('&bogus; &#0;');
    });

    it('treats missing values as empty', () => {
        expect(decodeHtmlEntities(undefined)).to.equal('');
        expect(decodeHtmlEntities(null)).to.equal('');
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
