import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import type { Page } from '@playwright/test';

import { byName, bytes, calculateMeta, type Case, CASES, dropFile, getField, ids, oracleReupload, oracleUpload, pastedCopy, pipelineGetMeta, PNG_RGB, project, reloadEditor, request, runCase, scrubFields, setField, setMeta, settle, unsetMeta } from './asset-meta.cases';
import { JOB_TEST_TIMEOUT } from '../../../lib/constants';
import { expect, test } from '../../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../../lib/pages/common';
import { fetchFile, parity, PARITY_TIMEOUT, spyServerWork } from '../../../lib/parity';
import { texture } from '../../fixtures/assets';

// plan 02 task 0 characterization of today's server meta. the baseline golden is the oracle
// task 11 holds the client path to. task 8 shipped the upload wiring that adds noMeta/clientMeta,
// so the upload/reupload fidelity `fields` comparisons leave those out (their `assets` stay
// valid); task 9 made the button client-fill, so the get-meta oracle test is gone and the
// fresh-upload quirk test now pins the client fill

const GOLDEN = new URL('./asset-meta.golden.json', import.meta.url);
const RECORD = !!process.env.PARITY_RECORD;
const read = () => (existsSync(GOLDEN) ? JSON.parse(readFileSync(GOLDEN, 'utf8')) as Record<string, unknown> : {});
const golden = RECORD ? {} : read();

// a golden entry held to a projection that left the file's bytes out (Case.reencoded)
const like = (value: unknown, want: unknown) => {
    if (!Array.isArray(value) || !Array.isArray(want)) {
        return want;
    }
    return want.map((w, i) => (value[i] && !('hash' in value[i]) ? Object.fromEntries(Object.entries(w).filter(([k]) => k !== 'size' && k !== 'hash')) : w));
};

/** Holds a result to the server baseline recorded on main; PARITY_RECORD=1 records it instead. */
const pin = (id: string, value: unknown, record = RECORD) => {
    if (record) {
        golden[id] = value;
        return;
    }
    expect(value, `${id} differs from the recorded server baseline`).toEqual(like(value, golden[id]));
};

/** A pasted copy of png-rgb (see pastedCopy) with its meta removed, filled again by CALCULATE META. */
const getMetaCase = async (page: Page, before?: () => Promise<void>) => {
    const run = await runCase(page, PNG_RGB);
    const { id } = await pastedCopy(page, Number(run.list.find(a => a.type === 'texture')!.id));
    await unsetMeta(page, id);
    await before?.();
    await calculateMeta(page, id);
    const others = (await ids(page)).filter(i => i !== id);
    return { id, assets: project(await settle(page, others, { count: 1, wants: ['texture'] }), ['texture']) };
};

/** png-rgb with user compression and interlaced settings, then a different png dropped over it. */
const reuploadCase = async (page: Page) => {
    const run = await runCase(page, PNG_RGB);
    const first = run.list.find(a => a.type === 'texture')!;
    const id = Number(first.id);
    await setMeta(page, id, { 'compress.basis': true, interlaced: true });
    const others = (await ids(page)).filter(i => i !== id);
    await dropFile(page, { name: run.name, mimeType: 'image/png', buffer: texture({ width: 8, height: 8, alpha: true, format: 'png' }) });
    return { id, assets: project(await settle(page, others, { count: 1, wants: ['texture'], from: first.file.hash }), ['texture']) };
};

/**
 * The candidate's upload fields without the ones it adds by design, each checked here: plan 02's
 * noMeta and clientMeta for the inputs the editor describes itself, and the texture import (plans 03
 * and 04), which converts and thumbnails a dropped texture in the editor and names the file part.
 * The oracle sends none of them.
 */
const candidate = (fields: Record<string, string> | null, c: Case) => {
    const { noMeta, clientMeta, noConvert, noThumbnails, ...rest } = scrubFields(fields) ?? {};
    expect(noMeta, 'noMeta on the candidate upload').toBe(c.client ? 'true' : undefined);
    expect(!!clientMeta, 'clientMeta on the candidate upload').toBe(c.client);
    const imported = c.kind === 'drop' && c.serverType === 'texture';
    expect(noConvert, 'noConvert on the candidate upload').toBe(imported ? 'true' : undefined);
    expect(noThumbnails, 'noThumbnails on the candidate upload').toBe(imported ? 'true' : undefined);
    if (imported) {
        expect(rest.filename, 'the imported file part').toBe(rest.name);
        delete rest.filename;
    }
    return fields && rest;
};

/**
 * The candidate asks for the basis compress itself (plan 04), so the page sees its variant write
 * rejected: basisCompression.js stores quality and compressionMode in file.variants.basis, which the
 * asset schema doesn't declare (invalid:unknown on the server path too, where the page never hears of it).
 */
const allowBasisVariant = (errors: { allow: (re: RegExp) => void }) => {
    errors.allow(/pipeline job rejected and reverted: invalid:unknown/);
    errors.allow(/A change was rejected by the server and reverted \(unknown\)/);
};

const partition = <T>(list: T[], pick: (v: T) => boolean) => [list.filter(pick), list.filter(v => !pick(v))];

/** Scrubs the volatile asset id out of captured meta pipeline messages. */
const scrubId = (msgs: { name: string; data: any }[]) => msgs.map(m => ({ name: m.name, data: { ...m.data, id: '<id>' } }));

let baseline: ProjectState;

test.describe('asset meta: server baseline', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    test.afterAll(() => {
        if (RECORD) {
            // each worker (and a restarted one) records a subset, so merge rather than overwrite
            writeFileSync(GOLDEN, `${JSON.stringify({ ...read(), ...golden }, null, 4)}\n`);
        }
    });

    for (const c of CASES) {
        test(c.id, async ({ editorPage }) => {
            test.setTimeout(JOB_TEST_TIMEOUT);
            const run = await runCase(editorPage, c);
            pin(c.id, project(run.list, c.wants, RECORD ? c.stable !== false : bytes(c)));
        });
    }

    test('get-meta', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        await reloadEditor(editorPage);
        pin('get-meta', (await getMetaCase(editorPage)).assets);
    });

    // task 9: the button fills meta in the editor, so the collab file cache no longer drops Get
    // Meta on a fresh upload, and no meta job is sent
    test('get-meta: a fresh upload is filled by the editor', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        await reloadEditor(editorPage);
        const run = await runCase(editorPage, PNG_RGB);
        const fresh = Number(run.list.find(a => a.type === 'texture')!.id);
        await unsetMeta(editorPage, fresh);
        const spy = await spyServerWork(editorPage);
        await calculateMeta(editorPage, fresh);
        const others = (await ids(editorPage)).filter(i => i !== fresh);
        const assets = project(await settle(editorPage, others, { count: 1, wants: ['texture'] }).finally(() => spy.stop()), ['texture']);
        expect((await spy.pipeline()).filter(m => m.name === 'meta')).toEqual([]);
        pin('get-meta', assets, false);
    });

    test('reupload', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        pin('reupload', (await reuploadCase(editorPage)).assets);
    });
});

test.describe('asset meta: oracle fidelity (main)', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    for (const c of CASES) {
        test(`${c.id}: oracle upload matches today's UI upload`, async ({ editorPage }) => {
            test.setTimeout(PARITY_TIMEOUT);
            const { server, client } = await parity({
                server: {
                    page: editorPage,
                    run: async (spy) => {
                        const run = await oracleUpload(editorPage, c);
                        return { assets: project(run.list, c.wants, bytes(c)), fields: scrubFields(await byName(spy, run.name)), pipeline: scrubId(await spy.pipeline()) };
                    }
                },
                client: {
                    page: editorPage,
                    run: async (spy) => {
                        const run = await runCase(editorPage, c);
                        return { assets: project(run.list, c.wants, bytes(c)), fields: candidate(await byName(spy, run.name), c), pipeline: scrubId(await spy.pipeline()) };
                    }
                }
            });

            // the spy saw each leg's upload, so equal fields aren't two misses
            expect(server.fields?.type).toBe(c.serverType);
            expect(client.fields?.type).toBe(c.serverType);
        });
    }

    test('reupload oracle matches today\'s UI re-upload', async ({ editorPage, errors }) => {
        test.setTimeout(PARITY_TIMEOUT);
        allowBasisVariant(errors);
        const put = (id: number) => (u: { method: string; url: string }) => u.method === 'PUT' && u.url.endsWith(`/assets/${id}`);
        const { server, client } = await parity({
            server: {
                page: editorPage,
                run: async (spy) => {
                    const run = await runCase(editorPage, PNG_RGB);
                    const first = run.list.find(a => a.type === 'texture')!;
                    const id = Number(first.id);
                    await setMeta(editorPage, id, { 'compress.basis': true, interlaced: true });
                    const others = (await ids(editorPage)).filter(i => i !== id);
                    await oracleReupload(editorPage, id, run.name, 'image/png', texture({ width: 8, height: 8, alpha: true, format: 'png' }));
                    const assets = project(await settle(editorPage, others, { count: 1, wants: ['texture'], from: first.file.hash }), ['texture']);
                    return { assets, fields: scrubFields(await request(spy, put(id))), pipeline: scrubId(await spy.pipeline()) };
                }
            },
            client: {
                page: editorPage,
                run: async (spy) => {
                    const { id, assets } = await reuploadCase(editorPage);
                    // the texture import (plan 04) asks for the basis compress the server chains inside its convert job
                    const [sent, rest] = partition(scrubId(await spy.pipeline()), m => m.name === 'compress');
                    expect(sent.map(m => m.data.data.options.formats)).toEqual([['basis']]);
                    return { assets, fields: candidate(await request(spy, put(id)), PNG_RGB), pipeline: rest };
                }
            }
        });

        // an update sends no type field, so check the pow2 every texture update carries
        expect(server.fields?.pow2).toBeDefined();
        expect(client.fields?.pow2).toBeDefined();
    });
});

// plan 02 task 11: the candidate ui path against the backend oracle (plain rest, which never sends
// noMeta), both on this page and both pinned to the golden recorded on main

// meta each kind's method reproduces from the file alone; the rest is the asset's own state
const KIND: Record<string, string> = { texture: 'texture', textureatlas: 'texture', model: 'model', gsplat: 'gsplat', animation: 'animation' };
const SERVER_ONLY = ['.tga', '.bmp'];
const HOSTILE = JSON.stringify({ format: 'png', type: 'TrueColor', width: 1e9, height: 4, alpha: false, depth: 8, srgb: true, interlaced: false, compress: { normals: false } });

// server-owned fields the method never reports (interlaced, compression choices, user mapping)
const OWNED = ['interlaced', 'compress', 'userMapping'];
const omit = (o: Record<string, any>, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

// the create route, with or without a query string
const CREATE = /\/api\/assets(\?|$)/;
const WORKER = '**/js/asset-meta.worker.js';

type Leg = { assets: unknown; golden: unknown; sent: Record<string, string> | null };

/** One leg of a case: the oracle's plain rest create, or the candidate ui. */
const leg = (page: Page, c: (typeof CASES)[number], ui: boolean) => async (spy: Awaited<ReturnType<typeof spyServerWork>>): Promise<Leg> => {
    const run = ui ? await runCase(page, c) : await oracleUpload(page, c);
    return { assets: project(run.list, c.wants, c.reencoded ? 'source' : true), golden: project(run.list, c.wants, bytes(c, ui)), sent: await byName(spy, run.name) };
};

test.describe('asset meta: server oracle vs. client', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        await new EditorShell(editorPage).restore(baseline);
    });

    for (const c of CASES) {
        test(`${c.id}: client matches the server oracle and main`, async ({ editorPage }) => {
            test.setTimeout(PARITY_TIMEOUT);
            const { server, client } = await parity({
                server: { page: editorPage, run: leg(editorPage, c, false) },
                client: { page: editorPage, run: leg(editorPage, c, true) }
            }, { normalize: r => r.assets });

            // both legs also match the golden task 0 recorded on main
            pin(c.id, server.golden, false);
            pin(c.id, client.golden, false);

            // where the work ran: the candidate sends noMeta and its meta exactly for the inputs
            // plan 02 describes; the oracle never does
            expect(server.sent?.type).toBe(c.serverType);
            expect(server.sent?.noMeta).toBeUndefined();
            expect(client.sent?.noMeta).toBe(c.client ? 'true' : undefined);
            if (c.client) {
                expect(JSON.parse(client.sent!.clientMeta)).toEqual(expect.any(Object));
            }
        });

        test(`${c.id}: the editor method reproduces the server meta from the same bytes`, async ({ editorPage }) => {
            test.setTimeout(JOB_TEST_TIMEOUT);
            const run = await oracleUpload(editorPage, c);
            for (const a of run.list.filter(a => c.wants.includes(a.type))) {
                // texture-meta read the upload, then an in-place convert replaced the file and wrote only
                // width, height and depth over the meta (texture-convert/app.js:674-700)
                const inPlace = !a.source && !!c.reencoded && a.file.filename.toLowerCase().endsWith(c.ext);
                const bytes = inPlace ? await c.bytes(editorPage) : await fetchFile(editorPage, Number(a.id));
                const owned = inPlace ? [...OWNED, 'width', 'height', 'depth'] : OWNED;
                const computed = await editorPage.evaluate(([kind, b64, filename]) => {
                    const data = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
                    return window.editor.call(`assets:meta:${kind}`, new Blob([data]), filename);
                }, [KIND[a.type], bytes.toString('base64'), a.file.filename] as const) as Record<string, any> | null;
                if (SERVER_ONLY.some(e => a.file.filename.toLowerCase().endsWith(e))) {
                    expect(computed, a.file.filename).toBeNull();
                    continue;
                }
                expect(omit(computed ?? {}, owned), a.file.filename).toEqual(omit(a.meta, owned));

                // the server only writes compress.normals where the asset already had compress settings
                if (KIND[a.type] === 'texture' && a.meta.compress && 'normals' in a.meta.compress) {
                    expect(computed?.compress.normals, a.file.filename).toBe(a.meta.compress.normals);
                }
            }
        });
    }

    test('get-meta: client fill matches the server job', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        await reloadEditor(editorPage);
        const { server, client } = await parity({
            server: {
                page: editorPage,
                run: async (spy) => {
                    const run = await runCase(editorPage, PNG_RGB);
                    const { id } = await pastedCopy(editorPage, Number(run.list.find(a => a.type === 'texture')!.id));
                    await unsetMeta(editorPage, id);
                    const from = (await spy.pipeline()).length;
                    await pipelineGetMeta(editorPage, id);
                    const others = (await ids(editorPage)).filter(i => i !== id);
                    const assets = project(await settle(editorPage, others, { count: 1, wants: ['texture'] }), ['texture']);
                    return { assets, sent: (await spy.pipeline()).slice(from).filter(m => m.name === 'meta').length };
                }
            },
            client: {
                page: editorPage,
                run: async (spy) => {
                    // only count what Get Meta sends, not the upload before it
                    let from = 0;
                    const { assets } = await getMetaCase(editorPage, async () => {
                        from = (await spy.pipeline()).length;
                    });
                    return { assets, sent: (await spy.pipeline()).slice(from).filter(m => m.name === 'meta').length };
                }
            }
        }, { normalize: r => r.assets });
        pin('get-meta', server.assets, false);
        expect(server.sent).toBe(1);
        expect(client.sent).toBe(0);
    });

    test('reupload: compression settings and interlaced survive the client path', async ({ editorPage, errors }) => {
        test.setTimeout(PARITY_TIMEOUT);
        allowBasisVariant(errors);
        const { server, client } = await parity({
            server: {
                page: editorPage,
                run: async () => {
                    const run = await runCase(editorPage, PNG_RGB);
                    const first = run.list.find(a => a.type === 'texture')!;
                    const id = Number(first.id);
                    await setMeta(editorPage, id, { 'compress.basis': true, interlaced: true });
                    const others = (await ids(editorPage)).filter(i => i !== id);
                    await oracleReupload(editorPage, id, run.name, 'image/png', texture({ width: 8, height: 8, alpha: true, format: 'png' }));
                    const assets = project(await settle(editorPage, others, { count: 1, wants: ['texture'], from: first.file.hash }), ['texture']);
                    return { assets, sent: null as Record<string, string> | null };
                }
            },
            client: {
                page: editorPage,
                run: async (spy) => {
                    const { id, assets } = await reuploadCase(editorPage);
                    return { assets, sent: await request(spy, u => u.method === 'PUT' && u.url.endsWith(`/assets/${id}`)) };
                }
            }
        }, { normalize: r => r.assets });
        pin('reupload', server.assets, false);
        expect(client.sent?.noMeta).toBe('true');
    });

    test('hostile client meta is rejected and the server meta wins', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const rewritten: (string | null)[] = [];
        await editorPage.route(CREATE, async (route) => {
            const req = route.request();
            const type = req.headers()['content-type'] ?? '';
            const body = req.postDataBuffer();
            if (req.method() !== 'POST' || !body || getField(body, type, 'noMeta') !== 'true') {
                await route.fallback();
                return;
            }
            const next = setField(body, type, 'clientMeta', HOSTILE);
            rewritten.push(getField(next, type, 'clientMeta'));
            await route.fallback({ postData: next });
        });
        const run = await runCase(editorPage, PNG_RGB).finally(() => editorPage.unroute(CREATE));

        // the client path was taken, the bad meta reached the server, and the server's own meta won
        expect(rewritten).toEqual([HOSTILE]);
        pin(PNG_RGB.id, project(run.list, PNG_RGB.wants), false);
    });

    test('a worker that fails to load leaves meta to the server', async ({ editorPage, errors }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);

        // the blocked script load and WorkerClient's report of it
        errors.allow(/asset-meta\.worker/);
        errors.allow(/Failed to load resource: the server responded with a status of 404/);

        // a reload, because this page may already have the worker running
        await editorPage.route(WORKER, r => r.fulfill({ status: 404, body: '' }));
        await reloadEditor(editorPage);
        const spy = await spyServerWork(editorPage);
        const run = await runCase(editorPage, PNG_RGB).finally(() => editorPage.unroute(WORKER));
        const sent = await byName(spy, run.name);
        await spy.stop();

        expect(sent?.type).toBe('texture');
        expect(sent?.noMeta).toBeUndefined();
        pin(PNG_RGB.id, project(run.list, PNG_RGB.wants), false);
    });

    // negative control: a candidate whose method misreports srgb. its upload still validates, so only
    // parity() against the oracle can catch it
    test('parity catches client meta that disagrees with the server oracle', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        const c = CASES.find(x => x.id === 'png-grey')!;
        const broken = async (spy: Awaited<ReturnType<typeof spyServerWork>>) => {
            await editorPage.evaluate(() => {
                const e = window.editor as any;
                const orig = e.methods.get('assets:meta:texture');
                (window as any).__origMetaTexture = orig;
                e.methodRemove('assets:meta:texture');
                e.method('assets:meta:texture', (...args: unknown[]) => orig(...args).then((m: any) => m && { ...m, srgb: !m.srgb }));
            });
            return leg(editorPage, c, true)(spy).finally(() => editorPage.evaluate(() => {
                const e = window.editor as any;
                e.methodRemove('assets:meta:texture');
                e.method('assets:meta:texture', (window as any).__origMetaTexture);
                delete (window as any).__origMetaTexture;
            }));
        };
        await expect(parity({
            server: { page: editorPage, run: leg(editorPage, c, false) },
            client: { page: editorPage, run: broken }
        }, { normalize: r => r.assets })).rejects.toThrow(/the client result differs from the server's/);
    });
});
