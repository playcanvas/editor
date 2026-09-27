import { expect } from 'chai';
import { describe, it } from 'mocha';
import ShareDB from 'sharedb';

import { RealtimeScene } from '../../../src/editor-api/realtime/scene';

// a loaded scene over an in-memory backend, and a second client to read what the server has
const setup = async () => {
    const backend = new ShareDB();
    const doc = backend.connect().get('scenes', '1');
    await new Promise<void>((resolve, reject) => doc.create({ entities: { root: { children: [] } } }, (err: unknown) => (err ? reject(err) : resolve())));
    const scene = new RealtimeScene(1, null, null);
    Object.assign(scene, { _document: doc, _loaded: true });
    const read = () =>
        new Promise<any>((resolve) => {
            const other = backend.connect().get('scenes', '1');
            other.fetch(() => resolve(other.data));
        });
    const flushed = () => new Promise<void>((resolve) => doc.whenNothingPending(() => resolve()));
    return { doc, scene, read, flushed };
};

const add = (scene: RealtimeScene, id: string) => {
    scene.submitOp({ p: ['entities', id], oi: { name: id, children: [] } });
    scene.submitOp({ p: ['entities', 'root', 'children', 0], li: id });
};

describe('RealtimeScene batch', () => {
    it('queues the ops of a batch as one op with every component, in order', async () => {
        const { doc, scene, read, flushed } = await setup();
        const res = scene.batch(() => {
            add(scene, 'a');
            add(scene, 'b');
            return 7;
        });
        expect(res).to.equal(7);
        expect(doc.preventCompose).to.equal(false);
        expect(doc.pendingOps).to.have.length(1);
        expect(doc.pendingOps[0].op).to.have.length(4);
        await flushed();
        const data = await read();
        expect(data.entities.root.children).to.deep.equal(['b', 'a']);
        expect(data.entities.a).to.deep.equal({ name: 'a', children: [] });
        expect(data.entities.b).to.deep.equal({ name: 'b', children: [] });
    });

    it('matches what composing each op gives', async () => {
        const run = async (batched: boolean) => {
            const { scene, read, flushed } = await setup();
            const ops = () => ['a', 'b', 'c'].forEach((id) => add(scene, id));
            if (batched) {
                scene.batch(ops);
            } else {
                ops();
            }
            await flushed();
            return read();
        };
        expect(await run(true)).to.deep.equal(await run(false));
    });

    it('still ends when the function throws', async () => {
        const { doc, scene, read, flushed } = await setup();
        expect(() =>
            scene.batch(() => {
                add(scene, 'a');
                throw new Error('boom');
            })
        ).to.throw('boom');
        await Promise.resolve();
        expect(doc.preventCompose).to.equal(false);
        expect(doc.pendingOps).to.have.length(1);
        await flushed();
        expect((await read()).entities.root.children).to.deep.equal(['a']);
    });
});
