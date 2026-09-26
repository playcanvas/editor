import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildArchive } from '../../../src/editor/assets/archive/entries';

import { BRANCH, fake, legacyFont, lookup, refFont, url } from './archive-fixtures';

describe('buildArchive font', () => {
    it('matches the legacy font-archive layout', () => {
        const [err, plan] = buildArchive(fake(legacyFont), lookup, BRANCH);
        expect(err).to.equal(null);
        expect(plan.name).to.equal('Arial.zip');
        expect(plan.entries).to.deep.equal([
            { path: '5001/arial.png', id: 10, url: url(10, 'arial.png'), size: 70 },
            { path: '5001/arial1.png', id: 10, url: url(10, 'arial1.png'), size: undefined },
            { path: '5001/arial.json', json: legacyFont.data }
        ]);
    });

    it('packs a single page when maps is empty', () => {
        const [, plan] = buildArchive(fake({ ...legacyFont, data: { info: { maps: [] } } }), lookup, BRANCH);
        expect(plan.entries.map((e) => e.path)).to.deep.equal(['5001/arial.png', '5001/arial.json']);
    });

    it('keeps an extensionless name (the job would produce .zip)', () => {
        expect(buildArchive(fake({ ...legacyFont, name: 'Arial' }), lookup, BRANCH)[1].name).to.equal('Arial.zip');
    });

    it('derives an extensionless file base like the job', () => {
        const [, plan] = buildArchive(fake({ ...legacyFont, file: { filename: 'arial', size: 70 } }), lookup, BRANCH);
        expect(plan.entries.map((e) => e.path)).to.deep.equal(['5001/.png', '5001/1.png', '5001/.json']);
    });

    it('matches the referenced font-archive layout', () => {
        const [err, plan] = buildArchive(fake(refFont), lookup, BRANCH);
        expect(err).to.equal(null);
        expect(plan.name).to.equal('unisans.zip');
        expect(plan.entries).to.deep.equal([
            { path: '6001/unisans.json', id: 21, url: url(21, 'unisans.json'), size: 300 },
            { path: '6001/unisans.png', id: 22, url: url(22, 'unisans.png'), size: 500 },
            { path: '6001/unisans1.png', id: 23, url: url(23, 'unisans1.png'), size: 600 }
        ]);
    });

    it('fails when a referenced part is missing', () => {
        const missingPage = fake({ ...refFont, data: { jsonAsset: 21, textureAssets: [22, 404] } });
        expect(buildArchive(missingPage, lookup, BRANCH)[0]).to.equal(
            "One or more of the font's texture assets are missing or have no file"
        );
        const noPages = fake({ ...refFont, data: { jsonAsset: 21, textureAssets: [] } });
        expect(buildArchive(noPages, lookup, BRANCH)[0]).to.equal(
            "One or more of the font's texture assets are missing or have no file"
        );
        const missingJson = fake({ ...refFont, data: { jsonAsset: 404, textureAssets: [22] } });
        expect(buildArchive(missingJson, lookup, BRANCH)[0]).to.equal("The font's JSON asset is missing or has no file");
    });

    it('fails without a font file', () => {
        expect(buildArchive(fake({ ...legacyFont, file: null }), lookup, BRANCH)[0]).to.equal('Cannot find font file');
    });
});
