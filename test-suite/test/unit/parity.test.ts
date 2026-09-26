import { expect, test } from '@playwright/test';
import { strToU8, zipSync } from 'fflate';

import { normalizeAsset, normalizeTree, readZip, scrub } from '../../lib/parity';
import { uniqueName } from '../../lib/utils';

test('scrub preserves numeric and hyphenated bases across repeated names and keys', () => {
    for (const base of ['16', 'tex-16', 'tex-16-32', 'tex-16-normal']) {
        for (let i = 0; i < 2; i++) {
            const name = `${uniqueName(base)}.png`;
            expect(scrub({ [name]: name })).toEqual({ [`<${base}>.png`]: `<${base}>.png` });
        }
    }
    expect(scrub(`${uniqueName('tex-16')}.png, ${uniqueName('tex-32')}.png`)).toBe('<tex-16>.png, <tex-32>.png');
});

test.describe('normalizeAsset', () => {
    test('drops volatile fields and reduces run-unique names', () => {
        const name = uniqueName('tex');
        const asset = {
            id: 5,
            uniqueId: 9,
            item_id: '5',
            createdAt: '2026-09-23T00:00:00Z',
            modifiedAt: '2026-09-23T00:00:01Z',
            task: null,
            taskInfo: null,
            name: `${name}.png`,
            type: 'texture',
            path: [3, 4],
            source_asset_id: 7,
            has_thumbnail: true,
            thumbnails: { s: '/api/assets/5/thumbnail/small', xl: '/api/assets/5/thumbnail/xlarge' },
            file: { filename: `${name}.png`, hash: 'abc', size: 3, url: '/api/assets/5/file/x.png', variants: { basis: { url: '/v', size: 2 } } },
            data: { rgbm: false }
        };

        expect(normalizeAsset(asset)).toEqual({
            name: '<tex>.png',
            type: 'texture',
            path: ['<folder>', '<folder>'],
            source_asset_id: '<source>',
            has_thumbnail: true,
            thumbnails: { s: '<url>', xl: '<url>' },
            file: { filename: '<tex>.png', hash: 'abc', size: 3, variants: { basis: { size: 2 } } },
            data: { rgbm: false }
        });

        // the input is never mutated
        expect(asset.id).toBe(5);
        expect(asset.file.url).toBe('/api/assets/5/file/x.png');
    });

    test('keeps a null source and an empty path as they are', () => {
        expect(normalizeAsset({ id: 1, name: 'a', path: [], source_asset_id: null })).toEqual({ name: 'a', path: [], source_asset_id: null });
    });

    test('reduces bytes to a digest', () => {
        const a = normalizeAsset({ bytes: Buffer.from([1, 2, 3]) });
        const b = normalizeAsset({ bytes: Buffer.from([1, 2, 4]) });
        expect(a.bytes).toMatch(/^sha256:[0-9a-f]{64}:3$/);
        expect(a.bytes).not.toEqual(b.bytes);
    });
});

test.describe('normalizeTree', () => {
    const entities = () => [
        { resource_id: 'p', parent: null, children: ['r'], name: 'holder' },
        {
            resource_id: 'r',
            parent: 'p',
            children: ['a', 'b'],
            name: uniqueName('ent'),
            template_id: 12,
            template_ent_ids: { r: 't1', a: 't2', b: 't3' },
            components: { script: { scripts: { s: { attributes: { external: 'p' } } } } }
        },
        {
            resource_id: 'a',
            parent: 'r',
            children: [],
            components: { button: { imageEntity: 'b' }, script: { scripts: { s: { attributes: { target: ['a', 'x'] } } } } }
        },
        { resource_id: 'b', parent: 'r', children: [] },
        { resource_id: 'x', parent: null, children: [] }
    ];

    test('tokenizes subtree ids, references and template keys in pre-order', () => {
        expect(normalizeTree(entities(), 'r')).toEqual([
            {
                resource_id: '<e0>',
                parent: '<parent>',
                children: ['<e1>', '<e2>'],
                name: '<ent>',
                template_id: 12,
                template_ent_ids: { '<e0>': 't1', '<e1>': 't2', '<e2>': 't3' },
                components: { script: { scripts: { s: { attributes: { external: 'p' } } } } }
            },
            {
                resource_id: '<e1>',
                parent: '<e0>',
                children: [],
                components: { button: { imageEntity: '<e2>' }, script: { scripts: { s: { attributes: { target: ['<e1>', 'x'] } } } } }
            },
            { resource_id: '<e2>', parent: '<e0>', children: [] }
        ]);
    });

    test('keeps child order significant', () => {
        const swapped = entities();
        swapped[1].children = ['b', 'a'];
        expect(normalizeTree(swapped, 'r')).not.toEqual(normalizeTree(entities(), 'r'));
    });

    test('throws on a child missing from the list', () => {
        const broken = entities().filter(e => e.resource_id !== 'b');
        expect(() => normalizeTree(broken, 'r')).toThrow('entity b (child of r) is not in the list');
    });
});

test.describe('readZip', () => {
    test('returns every entry by path', () => {
        const zip = Buffer.from(zipSync({ 'a.json': strToU8('{"k":1}'), 'dir/b.bin': new Uint8Array([1, 2]) }));
        const entries = readZip(zip);
        expect(Object.keys(entries).sort()).toEqual(['a.json', 'dir/b.bin']);
        expect(entries['a.json'].toString()).toBe('{"k":1}');
        expect([...entries['dir/b.bin']]).toEqual([1, 2]);
    });
});
