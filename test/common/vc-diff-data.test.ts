import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildNameIndex, valueKind } from '../../src/editor/pickers/version-control/vc-diff-data';

describe('buildNameIndex', () => {
    it('collects asset, entity, layer and batch group names from both checkpoints', () => {
        const index = buildNameIndex({
            srcCheckpoint: {
                assets: { '10': 'brick.png' },
                scenes: { '1': { 'guid-a': 'Root' } },
                settings: { layers: { '5': 'World' }, batchGroups: { '7': { name: 'UI Batch' } } }
            },
            dstCheckpoint: {
                assets: { '11': 'old.png' },
                scenes: { '2': { 'guid-b': 'Camera' } },
                settings: {}
            }
        });
        expect(index.asset.get('10')).to.equal('brick.png');
        expect(index.asset.get('11')).to.equal('old.png');
        expect(index.entity.get('guid-a')).to.equal('Root');
        expect(index.entity.get('guid-b')).to.equal('Camera');
        expect(index.layer.get('5')).to.equal('World');
        expect(index.batchGroup.get('7')).to.equal('UI Batch');
    });

    it('prefers src names over dst names for the same id', () => {
        const index = buildNameIndex({
            srcCheckpoint: { assets: { '10': 'renamed.png' }, scenes: {}, settings: {} },
            dstCheckpoint: { assets: { '10': 'original.png' }, scenes: {}, settings: {} }
        });
        expect(index.asset.get('10')).to.equal('renamed.png');
    });

    it('tolerates missing checkpoints', () => {
        const index = buildNameIndex({});
        expect(index.asset.size).to.equal(0);
        expect(index.entity.size).to.equal(0);
    });

    it('reads entity names nested under the scenes entities key (real payload shape)', () => {
        const index = buildNameIndex({
            srcCheckpoint: { assets: {}, scenes: { '1': { entities: { 'guid-a': 'Root' } } }, settings: {} }
        });
        expect(index.entity.get('guid-a')).to.equal('Root');
    });

    it('prefers src entity names over dst for the same guid', () => {
        const index = buildNameIndex({
            srcCheckpoint: { assets: {}, scenes: { '1': { entities: { 'guid-a': 'Renamed' } } }, settings: {} },
            dstCheckpoint: { assets: {}, scenes: { '1': { entities: { 'guid-a': 'Original' } } }, settings: {} }
        });
        expect(index.entity.get('guid-a')).to.equal('Renamed');
    });

    it('accepts string-shaped batch groups', () => {
        const index = buildNameIndex({
            srcCheckpoint: { assets: {}, scenes: {}, settings: { batchGroups: { '7': 'UI Batch' } } }
        });
        expect(index.batchGroup.get('7')).to.equal('UI Batch');
    });
});

describe('valueKind', () => {
    it('classifies missing values', () => {
        expect(valueKind('', 'a.b', undefined)).to.equal('missing');
        expect(valueKind('', 'a.b', null)).to.equal('missing');
    });

    it('classifies primitives', () => {
        expect(valueKind('', 'enabled', true)).to.equal('boolean');
        expect(valueKind('', 'intensity', 2.5)).to.equal('number');
        expect(valueKind('', 'name', 'Spot Light')).to.equal('string');
    });

    it('classifies reference types from the merge api', () => {
        expect(valueKind('asset', 'cookie', 42)).to.equal('asset');
        expect(valueKind('entity', 'target', 'guid-a')).to.equal('entity');
        expect(valueKind('layer', 'layers.0', 5)).to.equal('layer');
        expect(valueKind('batchGroup', 'group', 7)).to.equal('batchGroup');
        expect(valueKind('array:asset', 'textures', [1, 2])).to.equal('array:asset');
        expect(valueKind('array:sublayer', 'sublayers', [])).to.equal('array:sublayer');
    });

    it('classifies colors by type and by path heuristic', () => {
        expect(valueKind('rgb', 'color', [1, 0, 0])).to.equal('color');
        expect(valueKind('rgba', 'color', [1, 0, 0, 1])).to.equal('color');
        expect(valueKind('', 'diffuseTint', [0.5, 0.5, 0.5])).to.equal('color');
    });

    it('classifies vectors as numeric arrays of 2-4 without a color-ish path', () => {
        expect(valueKind('vec3', 'velocity', [0, 3, 0])).to.equal('vector');
        expect(valueKind('', 'offset', [1, 2])).to.equal('vector');
    });

    it('classifies curves and gradients', () => {
        const curve = { keys: [0, 1, 0.5, 2] };
        const colorSet = { keys: [[0, 0], [0, 0.5], [0, 1]] };
        expect(valueKind('curve', 'scaleGraph', curve)).to.equal('curve');
        expect(valueKind('curveset', 'scaleGraph2', { keys: [[0, 1], [0, 2]] })).to.equal('curve');
        expect(valueKind('curveset', 'colorGraph', colorSet)).to.equal('gradient');
        // array-of-curves shape
        expect(valueKind('curveset', 'colorGraph', [{ keys: [0, 0] }, { keys: [0, 0] }, { keys: [0, 1] }])).to.equal('gradient');
    });

    it('falls back to json for objects and object kind for unrenderable type', () => {
        expect(valueKind('', 'data', { foo: 1 })).to.equal('json');
        expect(valueKind('object', 'data', { foo: 1 })).to.equal('object');
    });

    it('keeps explicit json type even for curve-shaped values', () => {
        expect(valueKind('json', 'data', { keys: [0, 1] })).to.equal('json');
        expect(valueKind('json', 'data', { keys: [] })).to.equal('json');
    });

    it('does not classify off-size or non-numeric arrays as vectors', () => {
        expect(valueKind('', 'values', [1])).to.equal('json');
        expect(valueKind('', 'values', [1, 2, 3, 4, 5])).to.equal('json');
        expect(valueKind('', 'flags', [true, false])).to.equal('json');
    });
});
