import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildArchive } from '../../../src/editor/assets/archive/entries';

import { BRANCH, fake, lookup, registry, steel, url } from './archive-fixtures';

describe('buildArchive material', () => {
    it('matches the material-archive layout', () => {
        const [err, plan] = buildArchive(fake(steel), lookup, BRANCH);
        expect(err).to.equal(null);
        expect(plan.name).to.equal('Steel.zip');
        expect(plan.entries).to.deep.equal([
            {
                path: '30/Steel.json',
                json: {
                    diffuseMap: '../40/albedo.png',
                    cubeMap: '../50/Sky.json',
                    // material-archive only prunes falsy map refs, and leaves maps outside its list raw
                    opacity: 0,
                    useMetalness: false,
                    sheenMap: 41,
                    mapping_format: 'path'
                }
            },
            { path: '50/sky.dds', id: 50, url: url(50, 'sky.dds'), size: 400 },
            {
                path: '50/Sky.json',
                json: {
                    textures: ['../40/albedo.png', '../40/albedo.png', null, '../41/sheen.png', 404, null],
                    prefiltered: 'sky.dds'
                }
            },
            { path: '40/albedo.png', id: 40, url: url(40, 'albedo.png'), size: 100 },
            { path: '41/sheen.png', id: 41, url: url(41, 'sheen.png'), size: 50 }
        ]);
    });

    it('keeps a dotted name whole', () => {
        const [, plan] = buildArchive(fake({ ...steel, name: 'steel.v2' }), lookup, BRANCH);
        expect(plan.name).to.equal('steel.v2.zip');
        expect(plan.entries[0].path).to.equal('30/steel.v2.json');
    });

    it('fails without data', () => {
        expect(buildArchive(fake({ ...steel, data: null }), lookup, BRANCH)[0]).to.equal('Asset 30 has no data');
    });

    it('never puts asset names in error text', () => {
        const [err] = buildArchive(fake({ ...steel, name: '<img src=x onerror=alert(1)>', data: null }), lookup, BRANCH);
        expect(err).to.not.include('<');
    });

    it('drops a texture that has no file (deviation 3: the job crashes there)', () => {
        const bare = { id: 43, type: 'texture', source: false, name: 'Bare', file: null };
        const [, plan] = buildArchive(fake({ ...steel, data: { diffuseMap: 43 } }), registry(bare), BRANCH);
        expect(plan.entries).to.deep.equal([{ path: '30/Steel.json', json: { mapping_format: 'path' } }]);
    });
});
