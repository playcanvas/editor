import { JOB_TIMEOUT } from '../../../lib/constants';
import { expect, test } from '../../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../../lib/pages/common';
import { parity, PARITY_TIMEOUT, type ServerSpy } from '../../../lib/parity';
import {
    BACKEND_LIMIT,
    buildBig,
    buildDuplicateScripts,
    canonical,
    CASES,
    existing,
    expectInstance,
    findTree,
    historyStep,
    instantiate,
    instantiateOnBackend,
    joinScene,
    leaveScene,
    makeParent,
    overrideCount,
    readTemplate,
    readTree,
    removeEntity,
    revertAll,
    selectedIds,
    tokenize,
    treeIds
} from '../../../lib/template-matrix';

const SKIP = 'needs a second testSuite account cookie';

// fixed tokens for ids each leg makes the same way but under different guids
const known = (parent: { id: string; children: string[] }, outside: string[] = []) => ({
    [parent.id]: 'PARENT',
    ...Object.fromEntries(parent.children.map((id, i) => [id, `KID${i}`])),
    ...Object.fromEntries(outside.map((id, i) => [id, `OUTSIDE${i}`]))
});

const norm = (value: unknown, ids: Record<string, string>) => tokenize(canonical(value), ids);

/** Counts the template-instance jobs this leg's own spy saw. */
const frameCount = async (spy: ServerSpy) => (await spy.pipeline()).filter(m => m.name === 'template-instance').length;

// the server leg sends today's backend job; the client leg takes the public api, which builds
// supported inputs in the editor and sends the rest to the same job
test.describe('template-instance parity', () => {
    let baseline: ProjectState;
    let guest: number | null = null;

    test.beforeEach(async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        baseline = await new EditorShell(editorPage).snapshot();
    });

    // the guest and the project are handed back whatever the test did
    test.afterEach(async ({ editorPage, collaborator, project }) => {
        const errors: unknown[] = [];
        const id = guest;
        guest = null;
        if (id !== null && collaborator) {
            await leaveScene(editorPage, collaborator, project, id).catch(error => errors.push(error));
        }
        await new EditorShell(editorPage).restore(baseline).catch(error => errors.push(error));
        if (errors.length) {
            throw new AggregateError(errors, 'template-instance parity cleanup failed');
        }
    });

    for (const c of CASES) {
        test(`client output equals server output: ${c.name}`, async ({ editorPage }) => {
            const built = await c.build(editorPage);
            const tpl = await readTemplate(editorPage, built.assets[0]);

            // each leg also meets the absolute rules on its own
            const leg = (run: typeof instantiate) => async (spy: ServerSpy) => {
                const parent = await makeParent(editorPage);
                const roots = await run(editorPage, built.assets, parent.id, { select: true });
                const [root] = roots;
                expectInstance(await readTree(editorPage, root), tpl, parent.id, built.outside);
                return {
                    frames: await frameCount(spy),
                    overrides: await overrideCount(editorPage, root),
                    out: norm({
                        roots,
                        children: (await readTree(editorPage, parent.id)).children.map(e => e.resource_id),
                        selected: await selectedIds(editorPage),
                        tree: await readTree(editorPage, root)
                    }, known(parent, built.outside))
                };
            };

            const { server, client } = await parity({
                server: { page: editorPage, run: leg(instantiateOnBackend) },
                client: { page: editorPage, run: leg(instantiate) }
            }, { normalize: r => r.out });

            expect({ server: server.frames, client: client.frames }).toEqual({ server: 1, client: 0 });
            expect({ server: server.overrides, client: client.overrides }).toEqual({ server: 0, client: 0 });
        });
    }

    test('client inserts at the same positions as the server', async ({ editorPage }) => {
        const a = await CASES[0].build(editorPage);
        const b = await CASES[1].build(editorPage);
        const leg = (run: typeof instantiate) => async () => {
            const parent = await makeParent(editorPage, 2);
            await run(editorPage, a.assets, parent.id);
            await run(editorPage, a.assets, parent.id, { index: 2 });
            await run(editorPage, [...a.assets, ...b.assets], parent.id, { index: 1 });
            return norm(await readTree(editorPage, parent.id), known(parent, [...a.outside, ...b.outside]));
        };

        await parity({
            server: { page: editorPage, run: leg(instantiateOnBackend) },
            client: { page: editorPage, run: leg(instantiate) }
        });
    });

    test('undo and redo leave the same scene on the client as on the server', async ({ editorPage }) => {
        const built = await CASES[1].build(editorPage);
        const leg = (run: typeof instantiate) => async () => {
            const parent = await makeParent(editorPage);
            const [root] = await run(editorPage, built.assets, parent.id, { select: true });
            const before = await readTree(editorPage, root);

            await historyStep(editorPage, 'undo');
            await expect.poll(() => existing(editorPage, treeIds(before))).toEqual([]);

            await historyStep(editorPage, 'redo');
            await expect.poll(async () => (await readTree(editorPage, parent.id)).children.length, { timeout: JOB_TIMEOUT }).toBe(1);
            const [after] = (await readTree(editorPage, parent.id)).children;
            await expect.poll(() => selectedIds(editorPage), { message: 'redo selects the instance again', timeout: JOB_TIMEOUT })
            .toEqual([after.resource_id]);
            const ids = known(parent, built.outside);

            // the backend redo mints fresh ids and the client's restores them, so each tree is
            // normalized on its own and id reuse is reported beside the compared value
            return {
                reused: treeIds(after).join() === treeIds(before).join(),
                out: { before: norm(before, ids), after: norm(after, ids) }
            };
        };

        const { server, client } = await parity({
            server: { page: editorPage, run: leg(instantiateOnBackend) },
            client: { page: editorPage, run: leg(instantiate) }
        }, { normalize: r => r.out });

        expect(client.out.after).toEqual(client.out.before);
        expect({ server: server.reused, client: client.reused }).toEqual({ server: false, client: true });
    });

    test('a collaborator sees the same instance from the client as from the server', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const joined = await joinScene(editorPage, collaborator!, project);
        guest = joined.id;
        const built = await CASES[4].build(editorPage);
        const leg = (run: typeof instantiate) => async () => {
            const parent = await makeParent(editorPage);
            const [root] = await run(editorPage, built.assets, parent.id);
            const host = await readTree(editorPage, root);
            await expect.poll(() => findTree(joined.page, root), { timeout: JOB_TIMEOUT }).toEqual(host);
            return norm(host, known(parent, built.outside));
        };

        await parity({
            server: { page: editorPage, run: leg(instantiateOnBackend) },
            client: { page: editorPage, run: leg(instantiate) }
        });
    });

    // the fallbacks below still take an independent backend send on the server leg, so a broken
    // client guard (e.g. an off-by-one on the limit) can't pass as the same code path run twice
    test('over the backend limit both legs send the job and build the same instance', async ({ editorPage }) => {
        const built = await buildBig(editorPage, BACKEND_LIMIT);
        const leg = (run: typeof instantiate) => async (spy: ServerSpy) => {
            const parent = await makeParent(editorPage);
            const [root] = await run(editorPage, built.assets, parent.id);
            return { frames: await frameCount(spy), out: norm(await readTree(editorPage, root), known(parent, built.outside)) };
        };

        const { server, client } = await parity({
            server: { page: editorPage, run: leg(instantiateOnBackend) },
            client: { page: editorPage, run: leg(instantiate) }
        }, { normalize: r => r.out });

        expect({ server: server.frames, client: client.frames }).toEqual({ server: 1, client: 1 });
    });

    test('revert all goes through the backend on both legs and restores the same tree', async ({ editorPage }) => {
        const built = await CASES[1].build(editorPage);

        // revertAll has one implementation and always carries extraData, so only the initial
        // instance differs between the legs
        const leg = (run: typeof instantiate) => async (spy: ServerSpy) => {
            const parent = await makeParent(editorPage);
            const [root] = await run(editorPage, built.assets, parent.id);
            const size = treeIds(await readTree(editorPage, root)).length;
            const b = (await readTree(editorPage, root)).children.find(e => e.name === 'B')!;
            await removeEntity(editorPage, b.resource_id);
            const deleted = await overrideCount(editorPage, root);

            const reverted = await revertAll(editorPage, root);
            await expect.poll(async () => {
                const tree = await findTree(editorPage, reverted);
                return tree ? treeIds(tree).length : 0;
            }, { timeout: JOB_TIMEOUT }).toBe(size);

            return {
                frames: await frameCount(spy),
                deleted,
                overrides: await overrideCount(editorPage, reverted),
                out: norm(await readTree(editorPage, reverted), known(parent, built.outside))
            };
        };

        const { server, client } = await parity({
            server: { page: editorPage, run: leg(instantiateOnBackend) },
            client: { page: editorPage, run: leg(instantiate) }
        }, { normalize: r => r.out });

        // the server leg's instance and its revert are two jobs; the client's instance is local
        expect({ server: server.deleted, client: client.deleted }).toEqual({ server: 1, client: 1 });
        expect({ server: server.frames, client: client.frames }).toEqual({ server: 2, client: 1 });
        expect({ server: server.overrides, client: client.overrides }).toEqual({ server: 0, client: 0 });
    });

    test('a script name defined twice uses the backend on both legs with the same result', async ({ editorPage }) => {
        const built = await buildDuplicateScripts(editorPage);
        const leg = (run: typeof instantiate) => async (spy: ServerSpy) => {
            const parent = await makeParent(editorPage);
            const [root] = await run(editorPage, built.assets, parent.id);
            return { frames: await frameCount(spy), out: norm(await readTree(editorPage, root), known(parent, built.outside)) };
        };

        const { server, client } = await parity({
            server: { page: editorPage, run: leg(instantiateOnBackend) },
            client: { page: editorPage, run: leg(instantiate) }
        }, { normalize: r => r.out });

        expect({ server: server.frames, client: client.frames }).toEqual({ server: 1, client: 1 });
    });

    // negative control: the client leg misreports selection order, which expectInstance doesn't
    // check, so only the harness's own diff can catch it
    test('the diff catches a selection-order mismatch expectInstance does not check', async ({ editorPage }) => {
        const a = await CASES[0].build(editorPage);
        const b = await CASES[1].build(editorPage);
        const leg = (run: typeof instantiate, corrupt: boolean) => async () => {
            const parent = await makeParent(editorPage, 2);
            const roots = await run(editorPage, [...a.assets, ...b.assets], parent.id, { select: true });
            const selected = await selectedIds(editorPage);

            // roots sort before selected, so a reversed selection gets different tokens
            return norm({ roots, selected: corrupt ? [...selected].reverse() : selected }, known(parent, [...a.outside, ...b.outside]));
        };

        await expect(parity({
            server: { page: editorPage, run: leg(instantiateOnBackend, false) },
            client: { page: editorPage, run: leg(instantiate, true) }
        })).rejects.toThrow(/the client result differs from the server's/);
    });
});
