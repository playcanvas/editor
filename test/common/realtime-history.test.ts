import { History, Observer, ObserverHistory } from '@playcanvas/observer';
import { expect } from 'chai';
import { afterEach, describe, it } from 'mocha';
import ShareDB from 'sharedb';

import { ObserverSync } from '../../src/common/observer-sync';
import type {} from '../../types.d.ts';

const call = (fn) => new Promise((resolve, reject) => fn((err, value) => (err ? reject(err) : resolve(value))));

describe('realtime operation history', () => {
    let backend;

    afterEach(async () => {
        await call((done) => backend.close(done));
    });

    for (const tracked of [true, false]) {
        it(`receives backend defaults during a pending edit with history ${tracked ? 'enabled' : 'disabled'}`, async () => {
            backend = new ShareDB();
            const doc = backend.connect().get('tests', 'doc');
            const remote = backend.connect().get('tests', 'doc');
            await call((done) => doc.create({ name: 'old', legacy: true }, done));
            await call((done) => doc.subscribe(done));
            await call((done) => remote.subscribe(done));

            const item = new Observer(doc.data);
            const history = new History();
            if (tracked) item.history = new ObserverHistory({ item, history });
            const sync = new ObserverSync({ item, prefix: [] });
            item.sync = sync;
            let pending;
            let actions = 0;
            history.on('add', () => actions++);
            sync.on('op', (op) => {
                pending = call((done) => doc.submitOp([op], done));
            });
            doc.on('op', (ops, local) => {
                if (!local) ops.forEach((op) => sync.write(op));
            });

            let resume;
            const waiting = new Promise<void>((resolve) => {
                backend.use('submit', (req, next) => {
                    if (resume || req.op.op[0].p[0] !== 'name') return next();
                    resume = next;
                    resolve();
                });
            });
            item.set('name', 'new');
            await waiting;
            await call((done) => remote.submitOp({ p: ['template_id'], oi: null }, done));
            resume();
            await pending;

            expect(item.json()).to.deep.equal({ name: 'new', legacy: true, template_id: null });
            expect(doc.data).to.deep.equal(item.json());
            expect(remote.data).to.deep.equal(item.json());
            expect(actions).to.equal(tracked ? 1 : 0);
            if (tracked) {
                await history.undo();
                await pending;
                expect(item.get('name')).to.equal('old');
                expect(doc.data).to.deep.equal(item.json());
                expect(item.get('template_id')).to.equal(null);
                await history.redo();
                await pending;
                expect(item.get('name')).to.equal('new');
                expect(doc.data).to.deep.equal(item.json());
                expect(remote.data).to.deep.equal(item.json());
                expect(actions).to.equal(1);
            }
        });
    }
});
