import { expect } from 'chai';
import { describe, it } from 'mocha';
import fs from 'node:fs';

describe('legacy lightmap purge', () => {
    it('drains all four legacy spellings', () => {
        const source = fs.readFileSync('src/editor/entities/entities-migrations.ts', 'utf8');
        const match = source.match(/LEGACY_LIGHTMAP_PROPERTIES\s*=\s*\[([^\]]*)\]/);
        expect(match, 'LEGACY_LIGHTMAP_PROPERTIES not found').to.not.equal(null);
        const names = match![1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
        expect(names.sort()).to.deep.equal(
            ['castShadowsLightMap', 'lightMapSizeMultiplier', 'lightMapped', 'static'].sort()
        );
    });
});
