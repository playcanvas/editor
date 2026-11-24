import { Observer } from '@playcanvas/observer';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';

import { trackMigration } from '../../src/common/migration-metrics';

describe('trackMigration', () => {
    const g = globalThis as Record<string, unknown>;
    let names: string[];

    beforeEach(() => {
        names = [];
        g.metrics = { increment: ({ metricsName }: { metricsName: string }) => names.push(metricsName) };
    });

    afterEach(() => {
        delete g.metrics;
    });

    it('counts a migration that adds or changes a value', () => {
        const doc = new Observer({ a: 1, nested: { b: 1 } });
        const tracked = trackMigration('test.write', doc);
        doc.set('nested.b', 2);
        tracked();
        expect(names).to.deep.equal(['editor.migrate.test.write']);
    });

    it('ignores a migration that only removes fields or changes nothing', () => {
        const doc = new Observer({ a: 1, legacy: true });
        const tracked = trackMigration('test.unset', doc);
        doc.unset('legacy');
        doc.set('a', 1);
        tracked();
        expect(names).to.deep.equal([]);
    });

    it('reports each kind once per page load', () => {
        for (let i = 0; i < 2; i++) {
            const doc = new Observer({});
            const tracked = trackMigration('test.once', doc);
            doc.set('a', i);
            tracked();
        }
        expect(names).to.deep.equal(['editor.migrate.test.once']);
    });

    it('does nothing without metrics', () => {
        delete g.metrics;
        const doc = new Observer({});
        const tracked = trackMigration('test.off', doc);
        doc.set('a', 1);
        tracked();
        expect(names).to.deep.equal([]);
    });
});
