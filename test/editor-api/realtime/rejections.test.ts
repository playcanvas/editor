import { expect } from 'chai';
import { describe, it } from 'mocha';

import { batchRejections } from '../../../src/editor-api/realtime/rejections';

describe('batchRejections', () => {
    it('reports ops sharing one rejection once, and separate rejections separately', async () => {
        const reports: [unknown, object[]][] = [];
        const reject = batchRejections((err, ops) => reports.push([err, ops]));
        const a = new Error('invalid:delete');
        const b = new Error('invalid:type');
        reject(a, [{ p: ['x'] }]);
        reject(a, [{ p: ['y'] }, { p: ['z'] }]);
        reject(b, [{ p: ['w'] }]);
        expect(reports).to.have.length(0);

        await Promise.resolve();
        expect(reports).to.deep.equal([
            [a, [{ p: ['x'] }, { p: ['y'] }, { p: ['z'] }]],
            [b, [{ p: ['w'] }]]
        ]);
    });
});
