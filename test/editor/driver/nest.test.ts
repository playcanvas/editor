import { Observer } from '@playcanvas/observer';
import { expect } from 'chai';
import { afterEach, describe, it } from 'mocha';
import ShareDB from 'sharedb';

import { ObserverSync } from '../../../src/common/observer-sync';
import { nestEdits } from '../../../src/editor/driver/nest';
import type {} from '../../../types.d.ts';

const call = (fn) => new Promise((resolve, reject) => fn((err, value) => (err ? reject(err) : resolve(value))));

const LAYERS = { 0: { name: 'World' }, 4: { name: 'UI' } };

describe('nestEdits', () => {
    const item = new Observer({ layers: LAYERS, layerOrder: [{ layer: 0, transparent: false, enabled: true }] });
    const has = (path: string) => item.has(path);

    it('keeps edits whose parent exists', () => {
        const edits = [
            { path: 'layers.0.name', op: 'set', value: 'Main' },
            { path: 'layers.1000', op: 'set', value: { name: 'Water' } },
            { path: 'layerOrder.0.enabled', op: 'set', value: false },
            { path: 'layers.5.name', op: 'unset' }
        ];
        expect(nestEdits(has, edits)).to.deep.equal(edits);
    });

    it('merges leaves under a missing parent into one set of that parent', () => {
        expect(
            nestEdits(has, [
                { path: 'layers.1000.name', op: 'set', value: 'Water' },
                { path: 'layers.0.name', op: 'set', value: 'Main' },
                { path: 'layers.1000.opaqueSortMode', op: 'set', value: 2 },
                { path: 'extra.a.b', op: 'set', value: 1 }
            ])
        ).to.deep.equal([
            { path: 'layers.1000', op: 'set', value: { name: 'Water', opaqueSortMode: 2 } },
            { path: 'layers.0.name', op: 'set', value: 'Main' },
            { path: 'extra', op: 'set', value: { a: { b: 1 } } }
        ]);
    });
});

describe('settings edits under a missing parent', () => {
    let backend;

    afterEach(async () => {
        await call((done) => backend.close(done));
    });

    const sync = async (nest: boolean) => {
        backend = new ShareDB();
        const doc = backend.connect().get('settings', 'project');
        const remote = backend.connect().get('settings', 'project');
        await call((done) => doc.create({ layers: LAYERS }, done));
        await call((done) => doc.subscribe(done));
        await call((done) => remote.subscribe(done));

        const item = new Observer(structuredClone(doc.data));
        item.sync = new ObserverSync({ item, prefix: [] });
        const pending = [];
        // rejected ops settle with their error so the remote state can be compared
        item.sync.on('op', (op) => pending.push(call((done) => doc.submitOp([op], done)).catch((err) => err)));

        const edits = [
            { path: 'layers.1000.name', op: 'set', value: 'Water' },
            { path: 'layers.1000.opaqueSortMode', op: 'set', value: 2 }
        ];
        (nest ? nestEdits((path) => item.has(path), edits) : edits).forEach(({ path, value }) => item.set(path, value));
        await Promise.all(pending);
        await call((done) => remote.fetch(done));
        return remote.data.layers[1000];
    };

    it('loses the layer when leaves are written directly', async () => {
        expect(await sync(false)).to.equal(undefined);
    });

    it('persists the layer when nested', async () => {
        expect(await sync(true)).to.deep.equal({ name: 'Water', opaqueSortMode: 2 });
    });
});
