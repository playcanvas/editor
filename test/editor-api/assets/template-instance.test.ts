import fs from 'node:fs';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildInstance, nest } from '../../../src/editor-api/assets/template-instance';

const DIR = 'test/editor-api/assets/fixtures/template-instance';
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/g;

// top-level entity fields of these components in @pc-shared/schemas (editorType 'entity')
const FIELDS: Record<string, string[]> = { button: ['imageEntity'], render: ['rootBone'] };

const load = (name: string) => JSON.parse(fs.readFileSync(`${DIR}/${name}`, 'utf8'));
const { template, scriptAttrs } = load('template.json');
const ctx = {
    entityFields: (c: string) => FIELDS[c] || [],
    scriptAttrs: (s: string) => scriptAttrs[s]
};

// swap generated guids for the same @src / +key tokens gen.mjs uses
const normalize = (res: any) => {
    const tok: Record<string, string> = {};
    for (const k in res.srcToDst) tok[res.srcToDst[k]] = `@${k}`;
    for (const k in res.extra) tok[res.extra[k]] = `+${k}`;
    return JSON.parse(JSON.stringify(res.entities).replace(UUID, (id) => tok[id] || id));
};

describe('buildInstance', () => {
    it('matches the pipeline template-instance output', () => {
        expect(normalize(buildInstance(template, 'PARENT', ctx))).to.deep.equal(load('expected.json'));
    });

    it('does not mutate the template data', () => {
        const before = JSON.stringify(template);
        buildInstance(template, 'PARENT', ctx);
        expect(JSON.stringify(template)).to.equal(before);
    });

    it('gives every call fresh ids', () => {
        expect(buildInstance(template, 'P', ctx).rootId).to.not.equal(buildInstance(template, 'P', ctx).rootId);
    });

    it('returns null when the template has no root', () => {
        const entities = { a: { resource_id: 'a', parent: 'x', children: [], components: {} } };
        expect(buildInstance({ id: 1, name: 't', entities }, 'P', ctx)).to.equal(null);
    });
});

describe('nest', () => {
    it('nests children in order and drops missing or repeated ids', () => {
        const entities = {
            r: { resource_id: 'r', children: ['a', null, 'gone', 'b'] },
            a: { resource_id: 'a', children: ['r'] },
            b: { resource_id: 'b', children: [] }
        };
        expect(nest(entities, 'r')).to.deep.equal({
            resource_id: 'r',
            children: [
                { resource_id: 'a', children: [] },
                { resource_id: 'b', children: [] }
            ]
        });
    });
});
