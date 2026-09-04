import fs from 'node:fs';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ASSET_TEXTUREATLAS } from 'playcanvas';

const SOURCE = fs.readFileSync('src/editor/inspector/asset.ts', 'utf8');

describe('asset inspector type contract', () => {
    for (const [map, cls] of [
        ['assetInspectors', 'TextureAssetInspector'],
        ['assetInspectorPreviews', 'TextureAssetInspectorPreview']
    ]) {
        it(`registers ${cls} under the canonical asset type`, () => {
            expect(SOURCE).to.include(`${map}.set('${ASSET_TEXTUREATLAS}', ${cls})`);
        });
    }

    it('normalizes older schema catalogs without modifying their type list', () => {
        expect(SOURCE).to.include(
            "this._assetTypes = editor.call('schema:assets:list').map((type) => type.toLowerCase())"
        );
    });
});
