import { expect } from 'chai';
import { describe, it } from 'mocha';

import { countToHuman } from '../../src/common/utils';

describe('countToHuman', () => {
    it('keeps small counts whole', () => {
        expect(countToHuman(0)).to.equal('0');
        expect(countToHuman(999)).to.equal('999');
    });

    it('shortens to one decimal, dropping a trailing .0', () => {
        expect(countToHuman(1000)).to.equal('1K');
        expect(countToHuman(9200)).to.equal('9.2K');
        expect(countToHuman(1_500_000)).to.equal('1.5M');
        expect(countToHuman(2_500_000_000)).to.equal('2.5B');
    });

    it('rounds up into the next unit instead of showing 1000K', () => {
        expect(countToHuman(999_950)).to.equal('1M');
    });

    it('treats a missing count as zero', () => {
        expect(countToHuman(undefined as unknown as number)).to.equal('0');
    });
});
