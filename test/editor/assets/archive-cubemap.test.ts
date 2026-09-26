import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildArchive } from '../../../src/editor/assets/archive/entries';

import { BRANCH, fake, lookup, sky, url } from './archive-fixtures';

describe('buildArchive cubemap', () => {
    it('matches the cubemap-archive layout', () => {
        const [err, plan] = buildArchive(fake(sky), lookup, BRANCH);
        expect(err).to.equal(null);
        expect(plan.name).to.equal('Sky.zip');
        expect(plan.entries).to.deep.equal([
            { path: '40/albedo.png', id: 40, url: url(40, 'albedo.png'), size: 100 },
            { path: '41/sheen.png', id: 41, url: url(41, 'sheen.png'), size: 50 },
            { path: '50/sky.dds', id: 50, url: url(50, 'sky.dds'), size: 400 },
            {
                path: '50/Sky.json',
                json: {
                    textures: ['../40/albedo.png', '../40/albedo.png', null, '../41/sheen.png', 404, null],
                    prefiltered: 'sky.dds'
                }
            }
        ]);
    });

    it('omits the prefiltered file when the cubemap has none', () => {
        const [, plan] = buildArchive(fake({ ...sky, file: null }), lookup, BRANCH);
        expect(plan.entries.map((e) => e.path)).to.deep.equal(['40/albedo.png', '41/sheen.png', '50/Sky.json']);
        expect(plan.entries[2].json).to.not.have.property('prefiltered');
    });

    it('sanitizes the name like sanitize-filename', () => {
        const [, plan] = buildArchive(fake({ ...sky, name: 'Sky: "day"?' }), lookup, BRANCH);
        expect(plan.name).to.equal('Sky day.zip');
        expect(plan.entries.at(-1).path).to.equal('50/Sky day.json');
    });

    it('fails without textures', () => {
        expect(buildArchive(fake({ ...sky, data: {} }), lookup, BRANCH)[0]).to.equal('Asset 50 has no textures');
        expect(buildArchive(fake({ ...sky, data: { textures: [null, null] } }), lookup, BRANCH)[0]).to.equal(
            'No textures found for asset 50'
        );
        // missing and source-only faces resolve to nothing
        expect(buildArchive(fake({ ...sky, data: { textures: [404, 42] } }), lookup, BRANCH)[0]).to.equal(
            'No textures found for asset 50'
        );
    });
});
