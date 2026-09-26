import { expect } from 'chai';
import { unzipSync } from 'fflate';
import { describe, it } from 'mocha';

import { zipFiles } from '../../../src/editor/assets/archive/zip';

const enc = new TextEncoder();

// compression method of the first local file header: 0 stored, 8 deflate
const method = (zip: Uint8Array) => zip[8] | (zip[9] << 8);

describe('zipFiles', () => {
    it('round-trips nested and unicode paths', () => {
        const files = [
            { path: '40/albedo.png', data: new Uint8Array([137, 80, 78, 71]) },
            { path: 'My Model.mapping.json', data: enc.encode('{"mapping":[]}') },
            { path: '31/Stähl.json', data: enc.encode('{}') }
        ];
        const back = unzipSync(zipFiles(files));
        expect(Object.keys(back).sort()).to.deep.equal(['31/Stähl.json', '40/albedo.png', 'My Model.mapping.json']);
        expect(back['40/albedo.png']).to.deep.equal(new Uint8Array([137, 80, 78, 71]));
        expect(new TextDecoder().decode(back['My Model.mapping.json'])).to.equal('{"mapping":[]}');
    });

    it('stores already-compressed images and deflates json', () => {
        expect(method(zipFiles([{ path: 'a/x.png', data: new Uint8Array(64) }]))).to.equal(0);
        expect(method(zipFiles([{ path: 'a/x.json', data: enc.encode('{"a":1}'.repeat(20)) }]))).to.equal(8);
    });

    it('zips an empty list', () => {
        expect(Object.keys(unzipSync(zipFiles([])))).to.deep.equal([]);
    });
});
