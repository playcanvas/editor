import { expect } from 'chai';
import { describe, it } from 'mocha';

import { archiveSize, buildArchive, planDownload } from '../../../src/editor/assets/archive/entries';

import { albedo, BRANCH, car, fake, lookup, steel } from './archive-fixtures';

const BIG = 1e9;

describe('planDownload', () => {
    it('sums known file sizes', () => {
        expect(archiveSize(buildArchive(fake(car), lookup, BRANCH)[1])).to.equal(1550);
    });

    it('zips archivable targets on the client', () => {
        const res = planDownload(fake(car), lookup, BRANCH, BIG);
        expect(res.mode).to.equal('client');
    });

    it('decides synchronously so the fallback keeps the click gesture', () => {
        expect(planDownload(fake(car), lookup, BRANCH, BIG)).to.not.be.instanceOf(Promise);
        expect(planDownload(fake(car), lookup, BRANCH, 10)).to.not.be.instanceOf(Promise);
    });

    it('falls back to the server job above the cap', () => {
        expect(planDownload(fake(car), lookup, BRANCH, 1549)).to.deep.equal({ mode: 'server' });
    });

    it('leaves source assets and other types to the server', () => {
        expect(planDownload(fake({ ...steel, source: true }), lookup, BRANCH, BIG)).to.deep.equal({ mode: 'server' });
        expect(planDownload(fake(albedo), lookup, BRANCH, BIG)).to.deep.equal({ mode: 'server' });
        expect(planDownload(fake({ ...albedo, type: 'toString' }), lookup, BRANCH, BIG)).to.deep.equal({ mode: 'server' });
    });

    it('reports planner errors', () => {
        expect(planDownload(fake({ ...steel, data: null }), lookup, BRANCH, BIG)).to.deep.equal({
            mode: 'error',
            error: 'Asset 30 has no data'
        });
    });
});
