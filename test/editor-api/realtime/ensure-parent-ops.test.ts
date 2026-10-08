import { expect } from 'chai';
import { describe, it } from 'mocha';

import { ensureParentOps } from '../../../src/editor-api/realtime/ensure-parent-ops';

const RID = 'entity-1';
const mappingPath = ['entities', RID, 'components', 'model', 'mapping'];

// snapshot shape matching a legacy model entity with no material overrides
const noMapping = () => ({ entities: { [RID]: { components: { model: { type: 'asset', asset: 1 } } } } });

describe('ensureParentOps', () => {
    it('passes through ops that are not inserts', () => {
        const op = { p: [...mappingPath, '5'], od: 1 };
        expect(ensureParentOps(noMapping(), op)).to.deep.equal([op]);
    });

    it('prepends an empty-object create when the parent is missing on the backend', () => {
        const op = { p: [...mappingPath, '5'], oi: 2 };
        expect(ensureParentOps(noMapping(), op)).to.deep.equal([
            { p: mappingPath, oi: {} },
            op
        ]);
    });

    it('leaves the leaf op alone when the parent already exists', () => {
        const data = { entities: { [RID]: { components: { model: { mapping: { 3: 1 } } } } } };
        const op = { p: [...mappingPath, '5'], oi: 2 };
        expect(ensureParentOps(data, op)).to.deep.equal([op]);
    });

    it('creates a missing list parent as an array for list inserts', () => {
        const op = { p: ['entities', RID, 'components', 'model', 'layers', 0], li: 0 };
        expect(ensureParentOps(noMapping(), op)).to.deep.equal([
            { p: ['entities', RID, 'components', 'model', 'layers'], oi: [] },
            op
        ]);
    });

    it('creates every missing ancestor in top-down order', () => {
        const data = { entities: { [RID]: {} } };
        const op = { p: [...mappingPath, '5'], oi: 2 };
        expect(ensureParentOps(data, op)).to.deep.equal([
            { p: ['entities', RID, 'components'], oi: {} },
            { p: ['entities', RID, 'components', 'model'], oi: {} },
            { p: mappingPath, oi: {} },
            op
        ]);
    });
});
