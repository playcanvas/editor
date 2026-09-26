import fs from 'node:fs';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { buildInstance, nest } from '../../../src/editor-api/assets/template-instance';

const DIR = 'test/editor-api/assets/fixtures/template-instance';

// top-level entity fields of these components (schema editorType 'entity')
const FIELDS: Record<string, string[]> = { button: ['imageEntity'], render: ['rootBone'] };

const load = (name: string) => JSON.parse(fs.readFileSync(`${DIR}/${name}`, 'utf8'));
const { template, scriptAttrs } = load('template.json');
const ctx = {
    entityFields: (c: string) => FIELDS[c] || [],
    scriptAttrs: (s: string) => scriptAttrs[s]
};

describe('buildInstance', () => {
    it('remaps entity references to the new ids and drops ones outside the template', () => {
        const { rootId, entities, srcToDst } = buildInstance(template, 'PARENT', ctx);
        const root = entities[rootId];
        expect(root).to.include({ name: 'Crate', parent: 'PARENT', template_id: 42 });
        expect(root.children).to.deep.equal(['a', 'b', 'nested'].map((k) => srcToDst[k]));

        const a = entities[srcToDst.a].components;
        expect(a.button.imageEntity).to.equal(srcToDst.b);
        expect(a.render.rootBone).to.equal(null);

        const mover = entities[srcToDst.b].components.script.scripts.mover.attributes;
        expect(mover).to.deep.include({ target: srcToDst.a, targets: [srcToDst.b, null], cfgStr: 'a' });
        expect(mover.cfgs).to.deep.equal([{ ent: srcToDst.b }, { ent: null }]);
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
