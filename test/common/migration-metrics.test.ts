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

    describe('parity', () => {
        const parity = () => names.filter((n) => n.startsWith('editor.migrate.parity.'));

        it('counts a match when the shared migration writes the same', () => {
            const doc = new Observer({ type: 'script', data: {}, i18n: {} });
            const tracked = trackMigration('asset.script', doc);
            doc.set('data.loadingType', 0);
            tracked();
            expect(parity()).to.deep.equal(['editor.migrate.parity.match.asset.script']);
        });

        it('counts a mismatch with the first path that differs', () => {
            const doc = new Observer({ type: 'font', data: {}, i18n: {} });
            const tracked = trackMigration('asset.font', doc);
            doc.set('data.intensity', 1);
            tracked();
            expect(parity()).to.deep.equal(['editor.migrate.parity.mismatch.asset.font.data.intensity']);
        });

        it('counts a mismatch when only the shared migration writes', () => {
            const doc = new Observer({ type: 'cubemap', data: {} });
            const tracked = trackMigration('asset.cubemap', doc);
            tracked();
            expect(parity()).to.deep.equal(['editor.migrate.parity.mismatch.asset.cubemap.i18n']);
        });

        it('ignores fields the editor only drops locally', () => {
            const doc = new Observer({ type: 'json', data: {}, legacy: true });
            const tracked = trackMigration('asset.json', doc);
            doc.set('i18n', {});
            doc.unset('legacy');
            tracked();
            expect(parity()).to.deep.equal(['editor.migrate.parity.match.asset.json']);
        });

        it('skips documents neither migration touches', () => {
            const doc = new Observer({ type: 'script', data: { loadingType: 0 }, i18n: {} });
            const tracked = trackMigration('asset.script', doc);
            tracked();
            expect(parity()).to.deep.equal([]);
        });
    });
});
