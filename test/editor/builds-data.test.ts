import { expect } from 'chai';
import { describe, it } from 'mocha';

import { diffBuilds } from '../../src/editor/pickers/builds-data';

describe('diffBuilds', () => {
    it('isolates a status update without removing sibling rows', () => {
        const before = [
            { id: 1, task: { status: 'complete' } },
            { id: 2, task: { status: 'running' } },
            { id: 3, task: { status: 'complete' } }
        ];
        const after = before.map((app) =>
            app.id === 2 ? { ...app, task: { status: 'complete' }, completed_at: '2026-08-10T12:00:00Z' } : app
        );

        const diff = diffBuilds(before, after);
        expect([...diff.changed]).to.deep.equal([2]);
        expect([...diff.ids]).to.deep.equal([1, 2, 3]);
    });
});
