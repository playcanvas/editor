import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isImportedMaterial, hasUv1 } from '../../../src/editor/assets/asset-flags';
import { hasCustomAabb } from '../../../src/editor/inspector/components/aabb-utils';

describe('hasCustomAabb', () => {
    const entity = (value: unknown) => ({
        get: (path: string) => (path === 'components.render.aabbCenter' ? value : undefined)
    }) as any;

    it('is false when the field is null', () => {
        expect(hasCustomAabb(entity(null), 'render')).to.equal(false);
    });

    it('is false when the field is absent', () => {
        expect(hasCustomAabb(entity(undefined), 'render')).to.equal(false);
    });

    it('is true for a zero vector, which is a legitimate custom AABB', () => {
        expect(hasCustomAabb(entity([0, 0, 0]), 'render')).to.equal(true);
    });

    it('is true for a real vector', () => {
        expect(hasCustomAabb(entity([1, 2, 3]), 'render')).to.equal(true);
    });
});

describe('asset presence flags', () => {
    const asset = (map: Record<string, unknown>) => ({
        get: (p: string) => map[p],
        has: (p: string) => Object.hasOwn(map, p)
    }) as any;

    it('treats a zero attribute count as no UV1', () => {
        expect(hasUv1(asset({ 'meta.attributes.texCoord1': 0 }))).to.equal(false);
        expect(hasUv1(asset({ 'meta.attributes.texCoord1': 4 }))).to.equal(true);
        expect(hasUv1(asset({}))).to.equal(false);
    });

    it('still detects the GLB spelling in the open map', () => {
        expect(hasUv1(asset({ 'meta.attributes.TEXCOORD_1': 4 }))).to.equal(true);
    });

    it('distinguishes an imported material from a hand-made one', () => {
        expect(isImportedMaterial(asset({ 'meta.index': 0 }))).to.equal(true);  // index 0 is valid
        expect(isImportedMaterial(asset({ 'meta.index': null }))).to.equal(false);
        expect(isImportedMaterial(asset({}))).to.equal(false);
    });
});
