import type { Page } from '@playwright/test';

import { CASES, type Case, diff, type Driver, graph, image, type Image, isImage, type Node, ORACLE_DRIVER, pipelineSettings, sameBytes, summary, type Tolerance, UI_DRIVER } from './texture-convert.cases';
import { expect, test } from '../../../lib/fixtures';
import { EditorShell, type ProjectState } from '../../../lib/pages/common';
import { parity, PARITY_TIMEOUT, type ServerSpy } from '../../../lib/parity';
import { uniqueName } from '../../../lib/utils';

// plan 04 task 0 characterization of today's server texture import. the baseline snapshots,
// recorded through ORACLE_DRIVER, are the oracle task 11's differential holds the client path to.
// task 9 retired the ui-vs-oracle fidelity describe: the ui now converts in the editor

type Fact = { names: string[]; images?: Record<string, Partial<Image>>; check?: (at: (name: string) => Node) => void };

// today's server behaviour, asserted outright; the snapshot pins every other field and byte
const FACTS: Record<string, Fact> = {
    'png-npot-pow2': { names: ['<p>.png'], images: { '<p>.png': { format: 'png', width: 16, height: 16 } } },
    'png-npot-no-pow2': { names: ['<p>.png'], images: { '<p>.png': { width: 20, height: 12 } } },
    'png-pow2-alpha': { names: ['<p>.png'], images: { '<p>.png': { width: 16, height: 16, channels: 4 } } },
    'png-16bit': {
        names: ['<p>.png'],
        images: { '<p>.png': { format: 'png', width: 16, height: 16, channels: 3 } },
        check: at => expect(at('<p>.png').asset.meta.depth).toBe(8)
    },
    'png-normal-map': { names: ['<p>.png'], check: at => expect(at('<p>.png').asset.meta.compress.normals).toBe(true) },
    'jpeg-npot-pow2': { names: ['<p>.jpg'], images: { '<p>.jpg': { format: 'jpeg', width: 16, height: 16, channels: 3 } } },
    'jpeg-pow2-no-pow2': { names: ['<p>.jpg'], images: { '<p>.jpg': { width: 16, height: 16 } } },
    'webp-npot-pow2': { names: ['<p>.webp'], images: { '<p>.webp': { format: 'webp', width: 16, height: 16 } } },
    'webp-pow2-no-pow2': { names: ['<p>.webp'], images: { '<p>.webp': { format: 'webp', width: 16, height: 16 } } },

    // observed: once sharp processes a greyscale input (resize, greyscale()) it writes 3 channels;
    // only an untouched one stays single-channel (huge-server-only)
    'png-grey-npot-pow2': { names: ['<p>.png'], images: { '<p>.png': { format: 'png', width: 16, height: 16, channels: 3 } } },
    'png16-grey': {
        names: ['<p>.png'],
        images: { '<p>.png': { format: 'png', width: 16, height: 16, channels: 3 } },
        check: at => expect(at('<p>.png').asset.meta.depth).toBe(8)
    },
    'png-16bit-npot-pow2': {
        names: ['<p>.png'],
        images: { '<p>.png': { format: 'png', width: 16, height: 16, channels: 3 } },
        check: at => expect(at('<p>.png').asset.meta.depth).toBe(8)
    },
    'tga-grey-pow2': { names: ['<p>.jpeg', '<p>.tga'], images: { '<p>.jpeg': { format: 'jpeg', width: 16, height: 16, channels: 3 } } },
    'bmp-grey-paletted': { names: ['<p>.bmp', '<p>.jpeg'], images: { '<p>.jpeg': { format: 'jpeg', width: 16, height: 16, channels: 3 } } },
    'tga-opaque-pow2': {
        names: ['<p>.jpeg', '<p>.tga'],
        images: { '<p>.jpeg': { format: 'jpeg', width: 16, height: 16, channels: 3 } },
        check: (at) => {
            expect(at('<p>.tga').source).toBe(true);
            expect(at('<p>.jpeg').sourceOf).toBe('<p>.tga');
            expect(at('<p>.jpeg').parent).toBe(null);
        }
    },
    'tga-alpha-no-pow2': { names: ['<p>.png', '<p>.tga'], images: { '<p>.png': { format: 'png', width: 20, height: 12, channels: 4 } } },
    'bmp-pow2': { names: ['<p>.bmp', '<p>.jpeg'], images: { '<p>.jpeg': { format: 'jpeg', width: 16, height: 16, channels: 3 } } },
    'hdr-rgbm': {
        names: ['<p>.hdr', '<p>.png'],

        // rgbm output is never resized
        images: { '<p>.png': { format: 'png', width: 20, height: 12, channels: 4 } },
        check: at => expect(at('<p>.png').asset.data.rgbm).toBe(true)
    },
    'exr-rgbm': {
        names: ['<p>.exr', '<p>.png'],
        images: { '<p>.png': { format: 'png', width: 20, height: 12, channels: 4 } },
        check: at => expect(at('<p>.png').asset.data.rgbm).toBe(true)
    },

    // flips and decoders show in the pinned bytes; these pin the shapes around them
    'tga-top-left': { names: ['<p>.png', '<p>.tga'], images: { '<p>.png': { format: 'png', width: 20, height: 12, channels: 4 } } },
    'tga-rle': { names: ['<p>.png', '<p>.tga'], images: { '<p>.png': { format: 'png', width: 20, height: 12, channels: 4 } } },

    // a 32-bit tga whose alpha is 255 throughout reads as opaque, so it goes to jpeg
    'tga-opaque-alpha': {
        names: ['<p>.jpeg', '<p>.tga'],
        images: { '<p>.jpeg': { format: 'jpeg', width: 20, height: 12, channels: 3 } },
        check: at => expect(at('<p>.tga').asset.meta.alpha).toBe(false)
    },
    'bmp-top-down': { names: ['<p>.bmp', '<p>.jpeg'], images: { '<p>.jpeg': { format: 'jpeg', width: 20, height: 12, channels: 3 } } },
    'bmp-paletted': { names: ['<p>.bmp', '<p>.jpeg'], images: { '<p>.jpeg': { format: 'jpeg', width: 20, height: 12, channels: 3 } } },
    ...Object.fromEntries(['hdr-rle', 'hdr-flip-y', 'hdr-flip-x', 'hdr-transposed'].map(n => [n, {
        names: ['<p>.hdr', '<p>.png'],
        images: { '<p>.png': { format: 'png', width: 20, height: 12, channels: 4 } },
        check: (at: (name: string) => Node) => expect(at('<p>.png').asset.data.rgbm).toBe(true)
    }])),

    // the target takes the source's type, and the preload the upload asked for
    'tga-atlas': {
        names: ['<p>.jpeg', '<p>.tga'],
        check: at => expect([at('<p>.tga').type, at('<p>.jpeg').type]).toEqual(['textureatlas', 'textureatlas'])
    },
    'tga-no-preload': {
        names: ['<p>.jpeg', '<p>.tga'],
        check: at => expect([at('<p>.tga').asset.preload, at('<p>.jpeg').asset.preload]).toEqual([false, false])
    },
    'gif-server-only': { names: ['<p>.gif'] },
    'tiff-server-only': { names: ['<p>.jpeg', '<p>.tif'], images: { '<p>.jpeg': { format: 'jpeg', width: 1, height: 1 } } },
    'huge-server-only': { names: ['<p>.png'], images: { '<p>.png': { width: 4100, height: 4100, channels: 1 } } },
    'huge-pow2-server-only': { names: ['<p>.png'], images: { '<p>.png': { width: 4096, height: 4096, channels: 3 } } },
    'tiff16-rgbm-server-only': {
        names: ['<p>.png', '<p>.tif'],
        images: { '<p>.png': { format: 'png', width: 1, height: 1, channels: 4 } },
        check: at => expect(at('<p>.png').asset.data.rgbm).toBe(true)
    },

    // stale-meta skip (texture-convert/app.js:539-545): the target's meta already says 16×16, so the new 18×14 source isn't resized
    'tga-reupload-refreshes-target': { names: ['<p>.jpeg', '<p>.tga'], images: { '<p>.jpeg': { width: 18, height: 14 } } },
    'tga-unrelated-in-place-reupload': { names: ['<p>.jpeg', '<p>.tga'], images: { '<p>.jpeg': { width: 18, height: 14 } } },
    'tga-in-folder': {
        names: ['<p>-dir', '<p>.jpeg', '<p>.tga'],
        check: at => expect([at('<p>.tga').parent, at('<p>.jpeg').parent]).toEqual(['<p>-dir', '<p>-dir'])
    },
    'tga-in-folder-unrelated-reupload': {
        names: ['<p>-dir', '<p>.jpeg', '<p>.tga'],
        images: { '<p>.jpeg': { width: 18, height: 14 } },
        check: at => expect(at('<p>.jpeg').parent).toBe('<p>-dir')
    },
    'tga-moved-target-related': {
        names: ['<p>-moved', '<p>.jpeg', '<p>.tga'],
        images: { '<p>.jpeg': { width: 18, height: 14 } },
        check: at => expect(at('<p>.jpeg').parent).toBe('<p>-moved')
    },

    // without related search the moved target isn't found, so a fresh one appears at the root
    'tga-moved-target-unrelated': { names: ['<p>-moved', '<p>.jpeg', '<p>.jpeg', '<p>.tga'] },

    // the server looks targets up by name, so a renamed target is orphaned and a new one is made
    'tga-renamed-target-reupload': {
        names: ['<p>-renamed.jpeg', '<p>.jpeg', '<p>.tga'],
        images: { '<p>-renamed.jpeg': { width: 16, height: 16 }, '<p>.jpeg': { width: 16, height: 16 } }
    },

    // re-import refreshes the renamed target itself, keeping its name; stale-meta skip again (20×12)
    'tga-renamed-target-reimport': { names: ['<p>-renamed.jpeg', '<p>.tga'], images: { '<p>-renamed.jpeg': { width: 20, height: 12 } } },
    'png-reimport-after-pow2-on': { names: ['<p>.png'], images: { '<p>.png': { width: 16, height: 16 } } },

    // a source re-import finds its target by name: refreshed without the resize, or made again once deleted
    'tga-source-reimport-after-pow2-off': { names: ['<p>.jpeg', '<p>.tga'], images: { '<p>.jpeg': { width: 20, height: 12 } } },
    'tga-source-reimport-target-deleted': {
        names: ['<p>.jpeg', '<p>.tga'],
        images: { '<p>.jpeg': { width: 16, height: 16 } },
        check: at => expect(at('<p>.jpeg').sourceOf).toBe('<p>.tga')
    },

    // the server compresses a separate target after converting it (texture-convert/app.js:757)
    'tga-target-basis-reupload': { names: ['<p>.jpeg', '<p>.tga'], check: at => expect(at('<p>.jpeg').variants).toEqual(['basis']) },
    'png-in-place-basis-reupload': { names: ['<p>.png'], check: at => expect(at('<p>.png').variants).toEqual(['basis']) }
};

let baseline: ProjectState;

let restoreSettings: Record<string, boolean> | null = null;

const hooks = () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    test.afterEach(async ({ editorPage }) => {
        const before = restoreSettings;
        restoreSettings = null;
        if (before) {
            await pipelineSettings(editorPage, before);
        }
        await new EditorShell(editorPage).restore(baseline);
    });
};

test.describe('texture-convert: server baseline', () => {
    hooks();

    for (const c of CASES) {
        test(c.name, async ({ editorPage }, info) => {
            test.setTimeout(PARITY_TIMEOUT);
            info.snapshotSuffix = '';
            const p = uniqueName(`tc-${c.name}`);
            restoreSettings = await pipelineSettings(editorPage, { searchRelatedAssets: true, ...c.settings });

            // oracle-driven so the golden survives plans 02-04 switching the ui over
            await c.run(editorPage, p, ORACLE_DRIVER);
            const nodes = await graph(editorPage, p);
            for (const n of nodes.filter(x => x.file)) {
                await info.attach(n.name, { body: n.file! });
            }

            const fact = FACTS[c.name];
            const at = (name: string) => {
                const hit = nodes.find(n => n.name === name);
                expect(hit, `${name} exists`).toBeTruthy();
                return hit!;
            };
            expect(nodes.map(n => n.name)).toEqual(fact.names);
            for (const [name, want] of Object.entries(fact.images ?? {})) {
                expect(image(at(name)), name).toMatchObject(want);
            }
            fact.check?.(at);
            if (c.kept) {
                expect(sameBytes(at(c.kept.name).file, await c.kept.input(editorPage)), `${c.kept.name} kept the uploaded bytes`).toBe(true);
            }
            expect(`${JSON.stringify(summary(nodes), null, 4)}\n`).toMatchSnapshot(`${c.name}.json`);
        });
    }
});

// plan 04 task 11: the candidate ui path against ORACLE_DRIVER, both on this page. plan 02 makes the
// candidate's meta for the files it reads and plan 03 its thumbnails

type Uploads = Awaited<ReturnType<ServerSpy['uploads']>>;

type Run = { nodes: Node[]; uploads: Uploads; pipeline: Awaited<ReturnType<ServerSpy['pipeline']>> };

const WORKER = '**/js/texture-convert.worker.js';

// the global constraints parity target; lossy outputs are held to the resample bound
const WITHIN: Record<Tolerance, (d: { mean: number; max: number }) => boolean> = {
    exact: d => d.max === 0,
    resampled: d => d.mean <= 2,
    depth: d => d.max <= 1,
    lossy: d => d.mean <= 2
};

// texture uploads only: textures append pow2, a folder create does not
const textures = (r: Run) => r.uploads.filter(u => 'pow2' in u.fields);

// what plan 02's assets:meta:texture describes; everything else keeps the server's meta job
const CLIENT_META = /\.(?:png|jpe?g|webp|hdr)$/i;

/** One leg of one case: its steps through `driver`, then the graph and what the page sent. */
const execute = (page: Page, c: Case, driver: Driver, block = false) => async (spy: ServerSpy): Promise<Run> => {
    if (block) {
        await page.route(WORKER, r => r.fulfill({ status: 404, body: '' }));
    }

    // one base for both legs: scrub() cuts names to <base>, so per-leg bases never compare equal
    const p = uniqueName(`tc-${c.name}`);
    const before = await pipelineSettings(page, { searchRelatedAssets: true, ...c.settings });
    restoreSettings = before;
    await c.run(page, p, driver);
    const nodes = await graph(page, p);
    restoreSettings = null;
    await pipelineSettings(page, before);
    if (block) {
        await page.unroute(WORKER);
    }
    return { nodes, uploads: await spy.uploads(), pipeline: await spy.pipeline() };
};

// lossy and resampled outputs differ in bytes by design; compare() diffs their pixels instead
const dropFileHashes = (asset: Record<string, any>) => {
    const file = asset.file;
    if (!file) {
        return asset;
    }
    const variants = file.variants && Object.fromEntries(Object.entries(file.variants).map(([k, v]: [string, any]) => [k, v && typeof v === 'object' ? { ...v, hash: '<hash>', size: '<size>' } : v]));
    return { ...asset, file: { ...file, hash: '<hash>', size: '<size>', ...(variants ? { variants } : {}) } };
};

// in-place-meta: for an in-place texture it resized or depth-converted, the server writes width, height and
// depth over the original file's meta (texture-convert/app.js:688-700); the client's upload gets meta from
// the 8-bit rgb file it made, so srgb and type describe that. neither is shown or read (data.srgb is what
// the engine uses, and hasAlpha reads the same); plan 02's client meta closes the gap
const withoutFileColour = ({ meta: { srgb, type, ...meta } = {}, ...asset }: Record<string, any>) => ({ ...asset, meta });

// what parity() compares: every normalized asset field except raw bytes of re-encoded files
const structural = (c: Case) => (r: Run) => r.nodes.map(({ file, asset, ...n }) => {
    if (n.source || c.kept?.name === n.name) {
        return { ...n, asset };
    }
    const processed = !n.sourceOf && !!c.tolerance?.[n.name];
    return { ...n, asset: dropFileHashes(processed ? withoutFileColour(asset) : asset) };
});

/** Candidate files against the oracle's: sources byte for byte, images within their tolerance. */
const compare = async (page: Page, tolerance: Case['tolerance'], server: Node[], client: Node[]) => {
    for (const [i, s] of server.entries()) {
        const cf = client[i].file;
        const sf = s.file;
        expect(!!cf, `${s.name} has a file`).toBe(!!sf);
        if (!sf || !cf) {
            continue;
        }
        if (!isImage(s)) {
            expect(sameBytes(cf, sf), `${s.name} bytes`).toBe(true);
            continue;
        }
        const d = await diff(page, sf, cf);
        expect(d.b, `${s.name} image shape`).toEqual(d.a);
        const t = tolerance?.[s.name] ?? 'exact';
        expect(WITHIN[t](d), `${s.name} pixels (${t}): mean ${d.mean}, max ${d.max}`).toBe(true);
    }
};

/**
 * Where the work ran: the candidate opts every supported upload out of server conversion and
 * thumbnails, the oracle and every fallback never do. Every candidate upload of a file plan 02
 * reads, fallbacks included, carries its meta; the oracle never does.
 */
const ranOn = (run: Run, client: boolean, compress: boolean, candidate = client) => {
    const sent = textures(run);
    expect(sent.length).toBeGreaterThan(0);
    for (const u of sent) {
        expect(u.fields.noConvert === 'true', `${u.method} ${u.url} noConvert`).toBe(client);
        const meta = candidate && CLIENT_META.test(u.fields.filename ?? u.fields.name ?? '');
        expect(u.fields.noMeta === 'true' && !!u.fields.clientMeta, `${u.method} ${u.url} noMeta`).toBe(meta);

        expect(u.fields.noThumbnails === 'true', `${u.method} ${u.url} noThumbnails`).toBe(client);
    }
    const names = run.pipeline.map(m => m.name);
    expect(names).not.toContain('convert');
    expect(names).not.toContain('thumbnails');

    // the server chains compress inside its job; the client asks for it once the file settles
    expect(names.includes('compress'), 'compress requested by the editor').toBe(client && compress);
};

test.describe('texture-convert: candidate vs. server oracle', () => {
    test.beforeEach(async ({ editorPage }) => {
        baseline = await new EditorShell(editorPage).snapshot();
    });

    // a case that throws mid-way must not leak its settings or worker block into the next
    test.afterEach(async ({ editorPage }) => {
        await editorPage.unroute(WORKER);
        const before = restoreSettings;
        restoreSettings = null;
        if (before) {
            await pipelineSettings(editorPage, before);
        }
        await new EditorShell(editorPage).restore(baseline);
    });

    for (const c of CASES) {
        test(c.name, async ({ editorPage }) => {
            test.setTimeout(PARITY_TIMEOUT);
            const { server, client } = await parity({
                server: { page: editorPage, run: execute(editorPage, c, ORACLE_DRIVER) },
                client: { page: editorPage, run: execute(editorPage, c, UI_DRIVER) }
            }, { normalize: structural(c) });
            await compare(editorPage, c.tolerance, server.nodes, client.nodes);
            ranOn(server, false, false);
            ranOn(client, !c.serverOnly, !!c.compress, true);
        });
    }

    // a worker that never loads leaves exactly what the server makes; the oracle leg never touches it
    for (const name of ['png-npot-pow2', 'tga-opaque-pow2']) {
        test(`${name} with the worker blocked`, async ({ editorPage, errors }) => {
            test.setTimeout(PARITY_TIMEOUT);

            // the blocked script load and WorkerClient's report of it
            errors.allow(/texture-convert\.worker/);
            errors.allow(/Failed to load resource: the server responded with a status of 404/);
            const c = CASES.find(x => x.name === name)!;
            const { server, client } = await parity({
                server: { page: editorPage, run: execute(editorPage, c, ORACLE_DRIVER, true) },
                client: { page: editorPage, run: execute(editorPage, c, UI_DRIVER, true) }
            }, { normalize: structural(c) });

            // both sides are server output here, so pixels match exactly
            await compare(editorPage, {}, server.nodes, client.nodes);
            ranOn(client, false, false, true);
        });
    }

    // negative control: a candidate whose target create sends data the real code never does. the case's
    // FACTS never read data and compare() only sees pixels, so only parity() itself can catch it
    test('parity catches a candidate that disagrees with the server oracle', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        const c = CASES.find(x => x.name === 'tga-opaque-pow2')!;
        const broken = async (spy: ServerSpy) => {
            await editorPage.evaluate(() => {
                const e = window.editor as any;
                const orig = e.methods.get('assets:uploadFile');
                (window as any).__origUploadFile = orig;
                e.methodRemove('assets:uploadFile');

                // only a fresh target create carries source_asset_id
                e.method('assets:uploadFile', (args: any, fn: any) => orig(args.source_asset_id && args.noConvert ? { ...args, data: { ...args.data, mipmaps: false } } : args, fn));
            });
            return execute(editorPage, c, UI_DRIVER)(spy).finally(() => editorPage.evaluate(() => {
                const e = window.editor as any;
                e.methodRemove('assets:uploadFile');
                e.method('assets:uploadFile', (window as any).__origUploadFile);
                delete (window as any).__origUploadFile;
            }));
        };
        await expect(parity({
            server: { page: editorPage, run: execute(editorPage, c, ORACLE_DRIVER) },
            client: { page: editorPage, run: broken }
        }, { normalize: structural(c) })).rejects.toThrow(/the client result differs from the server's/);
    });
});
