import { expect } from 'chai';
import { describe, it } from 'mocha';

import { loadFiles } from '../../../src/editor/assets/archive/load';

const res = (status: number, bytes = [1, 2, 3]) => ({
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: async () => new Uint8Array(bytes).buffer
});

describe('loadFiles', () => {
    it('encodes json entries and fetches file entries', async () => {
        const urls: string[] = [];
        const get = async (u: string) => {
            urls.push(u);
            return res(200);
        };
        const files = await loadFiles(
            {
                name: 'x.zip',
                entries: [
                    { path: 'a/x.json', json: { a: 1 } },
                    { path: 'a/n.json', json: null },
                    { path: 'b/y.png', id: 7, url: '/api/assets/7/file/y.png?branchId=b1' }
                ]
            },
            get
        );
        expect(urls).to.deep.equal(['/api/assets/7/file/y.png?branchId=b1']);
        expect(files).to.deep.equal([
            { path: 'a/x.json', data: new TextEncoder().encode('{"a":1}') },
            { path: 'a/n.json', data: new TextEncoder().encode('null') },
            { path: 'b/y.png', data: new Uint8Array([1, 2, 3]) }
        ]);
    });

    it('rejects with the numeric asset id and status on a failed file', async () => {
        const plan = { name: 'x.zip', entries: [{ path: 'b/<y>.png', id: 7, url: '/y' }] };
        const err = await loadFiles(plan, async () => res(403)).then(
            () => null,
            (e: Error) => e
        );
        expect(err.message).to.equal('A file of asset 7 could not be downloaded (403)');
    });
});
