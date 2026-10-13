import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isDeepEqual, isSchemaDeepEqual } from '../../../src/editor/templates/deep-equal-compare';

describe('isDeepEqual null vs absent', () => {
    it('keeps null distinct from an absent key by default', () => {
        expect(isDeepEqual({ a: 1, b: null }, { a: 1 })).to.equal(false);
        expect(isDeepEqual({ a: 1 }, { a: 1, b: null })).to.equal(false);
    });

    it('equates null and absence only at fixed catalog paths', () => {
        const paths: string[] = [];
        const schema = {
            isNullDefault: (_root: unknown, path: string[]) => {
                const key = path.join('.');
                paths.push(key);
                return key === 'entities.entity.components.testcomponent.entityRef';
            },
            resolvePath: () => null
        };
        const root = {};
        const fixed = { components: { testcomponent: { entityRef: null } } };
        const absent = { components: { testcomponent: {} } };
        const path = ['entities', 'entity'];
        expect(isSchemaDeepEqual(fixed, absent, schema, root, path)).to.equal(true);
        expect(isSchemaDeepEqual(absent, fixed, schema, root, path)).to.equal(true);
        expect(
            isSchemaDeepEqual(
                { components: { script: { scripts: { rotate: { attributes: { target: null } } } } } },
                { components: { script: { scripts: { rotate: { attributes: {} } } } } },
                schema,
                root,
                path
            )
        ).to.equal(false);
        expect(paths).to.include('entities.entity.components.script.scripts.rotate.attributes.target');
    });

    it('still reports a genuine missing-value difference', () => {
        expect(isDeepEqual({ a: 1, b: 2 }, { a: 1 })).to.equal(false);
        expect(isDeepEqual({ a: 1, b: null }, { a: 1, b: 2 })).to.equal(false);
    });

    it('does not conflate null with other values', () => {
        const all = () => true;
        expect(isDeepEqual({ a: null }, { a: 0 }, all)).to.equal(false);
        expect(isDeepEqual({ a: null }, { a: false }, all)).to.equal(false);
        expect(isDeepEqual({ a: null }, { a: [] }, all)).to.equal(false);
    });
});

describe('isSchemaDeepEqual absent vs default', () => {
    // model.mapping defaults to {} at a fixed path; its keys sit in an open map
    const schema = {
        isNullDefault: () => false,
        resolvePath: (_root: unknown, path: string[]) => {
            const key = path.join('.');
            if (key === 'entities.entity.components.model.mapping') {
                return { default: {}, hasDefault: true, open: false };
            }
            if (key.startsWith('entities.entity.components.model.mapping.')) {
                return { default: undefined, hasDefault: false, open: true };
            }
            return null;
        }
    };
    const path = ['entities', 'entity'];
    const model = (fields: object) => ({ components: { model: { asset: 1, ...fields } } });

    it('equates an absent field with its schema default', () => {
        expect(isSchemaDeepEqual(model({ mapping: {} }), model({}), schema, {}, path)).to.equal(true);
        expect(isSchemaDeepEqual(model({}), model({ mapping: {} }), schema, {}, path)).to.equal(true);
    });

    it('still reports an absent field against a non-default value', () => {
        expect(isSchemaDeepEqual(model({ mapping: { 0: 5 } }), model({}), schema, {}, path)).to.equal(false);
        expect(isSchemaDeepEqual(model({ mapping: null }), model({}), schema, {}, path)).to.equal(false);
    });

    it('does not equate absent open map keys', () => {
        expect(isSchemaDeepEqual(model({ mapping: { 0: 5 } }), model({ mapping: {} }), schema, {}, path)).to.equal(
            false
        );
    });
});
