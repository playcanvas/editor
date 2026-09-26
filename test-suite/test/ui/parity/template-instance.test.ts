import { JOB_TIMEOUT } from '../../../lib/constants';
import { expect, test } from '../../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../../lib/pages/common';
import { HierarchyPanel } from '../../../lib/pages/hierarchy';
import { Templates } from '../../../lib/pages/templates';
import { parity, PARITY_TIMEOUT, spyServerWork, type ServerSpy } from '../../../lib/parity';
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

// every case in this matrix is a supported input, so the editor builds it locally and never
// queues the backend job (converted from 1 by the task that shipped the client path)
const FRAMES = 0;

test.describe('template-instance (server baseline)', () => {
    let baseline: ProjectState;
    let spies: ServerSpy[];
    let guest: number | null = null;

    test.beforeEach(async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        baseline = await new EditorShell(editorPage).snapshot();
        spies = [];
    });

    // spies, the guest and the project are handed back whatever the test did
    test.afterEach(async ({ editorPage, collaborator, project }) => {
        const errors: unknown[] = [];
        await Promise.all(spies.map(spy => spy.stop())).catch(error => errors.push(error));
        const id = guest;
        guest = null;
        if (id !== null && collaborator) {
            await leaveScene(editorPage, collaborator, project, id).catch(error => errors.push(error));
        }
        await new EditorShell(editorPage).restore(baseline).catch(error => errors.push(error));
        if (errors.length) {
            throw new AggregateError(errors, 'template-instance baseline cleanup failed');
        }
    });

    for (const c of CASES) {
        test(`instance matches its template: ${c.name}`, async ({ editorPage }) => {
            const built = await c.build(editorPage);
            const parent = await makeParent(editorPage);
            const spy = await spyServerWork(editorPage);
            spies.push(spy);
            const [root] = await instantiate(editorPage, built.assets, parent.id);

            expectInstance(await readTree(editorPage, root), await readTemplate(editorPage, built.assets[0]), parent.id, built.outside);
            expect(await overrideCount(editorPage, root)).toBe(0);
            expect((await spy.pipeline()).filter(m => m.name === 'template-instance')).toHaveLength(FRAMES);
        });
    }

    test('inserts at index 0 without an index, and at the index given', async ({ editorPage }) => {
        const built = await CASES[0].build(editorPage);
        const parent = await makeParent(editorPage, 2);
        const [first] = await instantiate(editorPage, built.assets, parent.id);
        const [second] = await instantiate(editorPage, built.assets, parent.id, { index: 2 });

        expect((await readTree(editorPage, parent.id)).children.map(e => e.resource_id))
        .toEqual([first, parent.children[0], second, parent.children[1]]);
    });

    test('instantiates several templates in one call, in asset order from the index', async ({ editorPage }) => {
        const a = await CASES[0].build(editorPage);
        const b = await CASES[1].build(editorPage);
        const parent = await makeParent(editorPage, 2);
        const spy = await spyServerWork(editorPage);
        spies.push(spy);
        const roots = await instantiate(editorPage, [...a.assets, ...b.assets], parent.id, { index: 1 });
        const tree = await readTree(editorPage, parent.id);

        expect(tree.children.map(e => e.resource_id)).toEqual([parent.children[0], ...roots, parent.children[1]]);
        expectInstance(tree.children[1], await readTemplate(editorPage, a.assets[0]), parent.id, a.outside);
        expectInstance(tree.children[2], await readTemplate(editorPage, b.assets[0]), parent.id, b.outside);
        expect((await spy.pipeline()).filter(m => m.name === 'template-instance')).toHaveLength(FRAMES);
    });

    test('resolves with the new roots and selects them when asked', async ({ editorPage }) => {
        const a = await CASES[0].build(editorPage);
        const b = await CASES[1].build(editorPage);
        const parent = await makeParent(editorPage);
        const roots = await instantiate(editorPage, [...a.assets, ...b.assets], parent.id, { select: true });

        expect((await readTree(editorPage, parent.id)).children.map(e => e.resource_id)).toEqual(roots);
        expect(await selectedIds(editorPage)).toEqual(roots);
    });

    test('undo removes the whole instance and redo brings back an equal one', async ({ editorPage }) => {
        const built = await CASES[1].build(editorPage);
        const tpl = await readTemplate(editorPage, built.assets[0]);
        const parent = await makeParent(editorPage);
        const [root] = await instantiate(editorPage, built.assets, parent.id);
        const ids = treeIds(await readTree(editorPage, root));

        await historyStep(editorPage, 'undo');
        await expect.poll(() => existing(editorPage, ids)).toEqual([]);

        // a redo may bring the instance back under fresh ids (the backend's does), so wait for any new root
        await historyStep(editorPage, 'redo');
        await expect.poll(async () => (await readTree(editorPage, parent.id)).children.length, { timeout: JOB_TIMEOUT }).toBe(1);
        const [again] = (await readTree(editorPage, parent.id)).children;
        expectInstance(again, tpl, parent.id, built.outside);
    });

    test('the inspector shows no overrides on a new instance', async ({ editorPage }) => {
        const built = await CASES[3].build(editorPage);
        const parent = await makeParent(editorPage);
        const [root] = await instantiate(editorPage, built.assets, parent.id);

        await new HierarchyPanel(editorPage).setSelection([root]);
        await expect(new Templates(editorPage).overrides).toHaveText('No Overrides');
    });

    test('a collaborator sees the same instance', async ({ editorPage, collaborator, project }) => {
        test.skip(!collaborator, SKIP);
        const joined = await joinScene(editorPage, collaborator!, project);
        guest = joined.id;
        const built = await CASES[4].build(editorPage);
        const parent = await makeParent(editorPage);
        const [root] = await instantiate(editorPage, built.assets, parent.id);
        const host = await readTree(editorPage, root);

        await expect.poll(() => findTree(joined.page, root), { timeout: JOB_TIMEOUT }).toEqual(host);
    });

    test('a template over the backend limit goes to the backend', async ({ editorPage }) => {
        const built = await buildBig(editorPage, BACKEND_LIMIT);
        const parent = await makeParent(editorPage);
        const spy = await spyServerWork(editorPage);
        spies.push(spy);
        const [root] = await instantiate(editorPage, built.assets, parent.id);

        expectInstance(await readTree(editorPage, root), await readTemplate(editorPage, built.assets[0]), parent.id, built.outside);
        expect((await spy.pipeline()).filter(m => m.name === 'template-instance')).toHaveLength(1);
    });

    test('revert all restores a deleted child through the backend', async ({ editorPage }) => {
        const built = await CASES[1].build(editorPage);
        const tpl = await readTemplate(editorPage, built.assets[0]);
        const parent = await makeParent(editorPage);
        const [root] = await instantiate(editorPage, built.assets, parent.id);
        const b = (await readTree(editorPage, root)).children.find(e => e.name === 'B')!;
        await removeEntity(editorPage, b.resource_id);
        expect(await overrideCount(editorPage, root)).toBe(1);

        const spy = await spyServerWork(editorPage);
        spies.push(spy);
        const reverted = await revertAll(editorPage, root);
        await expect.poll(async () => {
            const tree = await findTree(editorPage, reverted);
            return tree ? treeIds(tree).length : 0;
        }, { timeout: JOB_TIMEOUT })
        .toBe(Object.keys(tpl.entities).length);

        expectInstance(await readTree(editorPage, reverted), tpl, parent.id, built.outside);
        expect(await overrideCount(editorPage, reverted)).toBe(0);
        expect((await spy.pipeline()).filter(m => m.name === 'template-instance')).toHaveLength(1);
    });

    test('a script name defined by two assets goes to the backend and keeps one of its readings', async ({ editorPage }) => {
        const built = await buildDuplicateScripts(editorPage);
        const tpl = await readTemplate(editorPage, built.assets[0]);
        const parent = await makeParent(editorPage);
        const spy = await spyServerWork(editorPage);
        spies.push(spy);
        const [root] = await instantiate(editorPage, built.assets, parent.id);
        const tree = await readTree(editorPage, root);

        // createTemplate picks a reading too: as a number it stores the source entity's id, not the
        // template's. the server then remaps it as an entity (template id -> root, else null) or keeps it
        const [[id, src]] = Object.entries(tpl.entities);
        const stored = src.components.script.scripts[built.script].attributes.target;
        expect([stored === id ? root : null, stored]).toContain(tree.components.script.scripts[built.script].attributes.target);
        expect((await spy.pipeline()).filter(m => m.name === 'template-instance')).toHaveLength(1);
    });
});

// gated while the public api still always reached the backend, so later differentials can
// trust instantiateOnBackend as their server leg
test.describe('template-instance (backend oracle fidelity)', () => {
    let baseline: ProjectState;

    test.beforeEach(async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test('instantiateOnBackend matched the public API before the client path shipped', async ({ editorPage }) => {
        // only meaningful while `instantiate` was itself the backend path; it now builds CASES[0] locally
        test.skip(true, 'superseded once the client path shipped');
        // no cross-references, so plain tokenize (no fixed `known` tokens) is enough
        const a = await CASES[0].build(editorPage);
        const b = await CASES[1].build(editorPage);
        const assets = [...a.assets, ...b.assets];
        const current = () => editorPage.evaluateHandle(() => (window.editor.api.globals as any).history.currentAction);

        const leg = (run: typeof instantiate) => async (spy: ServerSpy) => {
            const parent = await makeParent(editorPage, 2);
            const roots = await run(editorPage, assets, parent.id, { index: 1, select: true });
            const created = await selectedIds(editorPage);
            const before = await readTree(editorPage, parent.id);

            await historyStep(editorPage, 'undo');
            await expect.poll(() => existing(editorPage, before.children.filter(e => roots.includes(e.resource_id)).flatMap(treeIds))).toEqual([]);
            await historyStep(editorPage, 'redo');
            await expect.poll(async () => (await readTree(editorPage, parent.id)).children.length, { timeout: JOB_TIMEOUT }).toBe(4);
            const after = await readTree(editorPage, parent.id);
            const redone = await selectedIds(editorPage);

            // the job merges extraData into its task; this key is one it ignores
            const mark = await current();
            await run(editorPage, a.assets, parent.id, { extraData: { e2e: 'passthrough' }, history: false });
            expect(await editorPage.evaluate(m => (window.editor.api.globals as any).history.currentAction === m, mark), 'history: false adds no entry').toBe(true);
            await mark.dispose();
            const extra = await readTree(editorPage, parent.id);

            // jobId is a fresh 8-hex id per send
            const raw = (await spy.pipeline()).filter(m => m.name === 'template-instance');
            expect(raw, 'create, redo and the untracked call each send one job').toHaveLength(3);
            const pipeline = JSON.parse(JSON.stringify(raw).replace(/"jobId":"[0-9a-f]{8}"/g, '"jobId":"<jobId>"'));

            return tokenize(canonical({ pipeline, roots, selected: { created, redone }, before, after, extra }));
        };

        await parity({
            server: { page: editorPage, run: leg(instantiateOnBackend) },
            client: { page: editorPage, run: leg(instantiate) }
        });
    });
});
