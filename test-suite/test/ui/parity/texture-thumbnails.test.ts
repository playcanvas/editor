import { readFileSync } from 'node:fs';

import type { Page, TestInfo } from '@playwright/test';

import { join, revoke } from '../../../lib/collab';
import { JOB_TEST_TIMEOUT } from '../../../lib/constants';
import { expect, test } from '../../../lib/fixtures';
import { AssetWorkflows } from '../../../lib/pages/asset-workflows';
import { PARITY_TIMEOUT, imageDiff, normalizeAsset, parity, spyServerWork, type Mode, type ServerSpy } from '../../../lib/parity';
import {
    ALPHA,
    OPAQUE,
    OPAQUE8,
    RGBM,
    SIZES,
    SIZE_NAMES,
    capture,
    cells,
    expectGrid,
    flat,
    gradient,
    grid,
    oracleConvertUpload,
    oracleToggle,
    oracleUpload,
    pin,
    png,
    rgbm,
    toggle,
    upload,
    uploadViaPanel,
    waitChanged,
    waitThumbs,
    type Probe,
    type Shot,
    type Size
} from '../../../lib/thumbnails';
import { uniqueName } from '../../../lib/utils';
import { gif } from '../../fixtures/textures';

// pins the texture-thumbnails job's output. the probes and CASES stay the lasting oracle; plan 03 Task 8
// converted the rgbm toggle's job assertion and retired the upload and toggle gates. plan 04 Task 9
// Step 6 moved the convert gate onto a gif, which always falls back

const FONT = readFileSync(new URL('../../fixtures/files/courier-prime.ttf', import.meta.url));

type Upload = Awaited<ReturnType<ServerSpy['uploads']>>[number];

type Gate = {
    uploads: Upload[];
    requests: { method: string; url: string }[];
    pipeline: { name: string; data: unknown }[];
    frames: string[];
    doc: Record<string, unknown>;
    images: Shot['images'];
};

// the leg's asset id, wherever the page sent it
const tokenize = <T>(v: T, id: number) => JSON.parse(JSON.stringify(v), (_k, x) => {
    if (x === id || x === `${id}`) {
        return '<id>';
    }
    return typeof x === 'string' ? x.replaceAll(`/${id}/`, '/<id>/') : x;
}) as T;

// what a leg sent the backend, then the state and thumbnails it ended with
const gate = async (page: Page, spy: ServerSpy, id: number) => {
    const { doc, images } = await capture(page, id);
    const sent = tokenize({
        uploads: await spy.uploads(),
        requests: (await spy.requests()).filter(r => r.method !== 'GET'),
        pipeline: await spy.pipeline(),
        frames: await spy.frames()
    }, id);
    return { ...sent, doc: normalizeAsset(doc), images } satisfies Gate;
};

// plan 02 Task 8's upload hook adds noMeta/meta to the ui leg's request only, never to an oracle's
// below it; plan 02 owns that parity (and pins the doc's meta exactly, so the doc keeps it)
const withoutMeta = (v: Gate) => ({ ...v, uploads: v.uploads.map(({ fields: { noMeta, meta, ...fields }, ...u }) => ({ ...u, fields })) });

// smooth: a gradient, so the per-pixel max bound applies too (cell edges would drown it)
type Case = { name: string; type: 'texture' | 'textureatlas'; png: Buffer; probes: Probe[]; smooth?: boolean };

// one case per behaviour of pipeline/jobs/texture-thumbnails on a noConvert upload
const CASES: Case[] = [
    { name: 'opaque png', type: 'texture', png: grid(256, 256, 2, 2, OPAQUE), probes: cells(2, 2, OPAQUE) },
    { name: 'alpha png flattens onto black', type: 'texture', png: grid(256, 256, 2, 2, ALPHA), probes: cells(2, 2, ALPHA) },

    // fit: fill. contain would put black bars on the top and bottom rows, and cover would shift the columns
    { name: 'non-square png stretches to fill', type: 'texture', png: grid(400, 100, 4, 2, OPAQUE8), probes: cells(4, 2, OPAQUE8) },
    { name: 'tiny 2x2 png', type: 'texture', png: grid(2, 2, 2, 2, OPAQUE), probes: cells(2, 2, OPAQUE) },
    { name: 'large 2048x1024 png', type: 'texture', png: grid(2048, 1024, 2, 2, OPAQUE), probes: cells(2, 2, OPAQUE) },
    { name: 'smooth gradient', type: 'texture', png: gradient(1024, 512, false), probes: [{ at: [0.5, 0.5], rgb: [128, 128, 96] }], smooth: true },
    { name: 'alpha gradient flattens onto black', type: 'texture', png: gradient(256, 256, true), probes: [{ at: [0.5, 0.5], rgb: flat([128, 128, 96, 128]) }], smooth: true },
    { name: 'textureatlas', type: 'textureatlas', png: grid(256, 256, 2, 2, OPAQUE), probes: cells(2, 2, OPAQUE) }
];

test.describe('texture thumbnails: server baseline', () => {
    for (const c of CASES) {
        test(c.name, async ({ editorPage }) => {
            test.setTimeout(JOB_TEST_TIMEOUT);
            const name = `${uniqueName('thumb')}.png`;
            const id = await upload(editorPage, name, c.type, c.png);
            await pin(editorPage, id, await capture(editorPage, id), c.probes);
            await expectGrid(editorPage, name);
        });
    }

    test('a client-generated font atlas gets thumbnails', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const [, , texture] = await new AssetWorkflows(editorPage).upload({ name: `${uniqueName('font')}.ttf`, mimeType: 'font/ttf', buffer: FONT }, ['font', 'json', 'texture']);
        await waitThumbs(editorPage, texture.id);
        await pin(editorPage, texture.id, await capture(editorPage, texture.id), []);
    });

    test('toggling rgbm regenerates decoded thumbnails', async ({ editorPage }) => {
        test.setTimeout(3 * JOB_TEST_TIMEOUT);
        const id = await upload(editorPage, `${uniqueName('rgbm')}.png`, 'texture', grid(256, 256, 2, 2, RGBM));
        await pin(editorPage, id, await capture(editorPage, id), cells(2, 2, RGBM));

        const spy = await spyServerWork(editorPage);
        await pin(editorPage, id, await toggle(editorPage, id, true), cells(2, 2, RGBM, rgbm));
        await pin(editorPage, id, await toggle(editorPage, id, false), cells(2, 2, RGBM));
        await spy.stop();

        // the toggling tab now makes its own thumbnails; no job, one upload per toggle
        expect((await spy.pipeline()).filter(m => m.name === 'thumbnails')).toEqual([]);
        expect((await spy.uploads()).filter(u => u.method === 'POST' && /\/thumbnails\?branchId=/.test(u.url))).toHaveLength(2);
    });

    test('a converted upload gets thumbnails from the server', async ({ editorPage }) => {
        test.setTimeout(JOB_TEST_TIMEOUT);
        const id = await uploadViaPanel(editorPage, `${uniqueName('converted')}.png`, grid(256, 256, 2, 2, OPAQUE));
        await pin(editorPage, id, await capture(editorPage, id), cells(2, 2, OPAQUE));
    });
});

// fidelity gates: each oracle must send today's request and leave today's state
test.describe('texture thumbnails: backend oracles match the editor', () => {
    test('the convert oracle matches a panel upload', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        // a gif always falls back to the server (plan 04 canConvert), so the panel upload still sends
        // exactly the oracle's request
        const { server } = await parity({
            server: { page: editorPage, run: async spy => gate(editorPage, spy, await oracleConvertUpload(editorPage, `${uniqueName('convert-fidelity')}.gif`, gif())) },
            client: { page: editorPage, run: async spy => gate(editorPage, spy, await uploadViaPanel(editorPage, `${uniqueName('convert-fidelity')}.gif`, gif())) }
        }, { normalize: withoutMeta });

        expect(server.uploads).toHaveLength(1);
        expect(server.pipeline).toEqual([]);
    });
});

// Global Constraints: "What the same means for thumbnails"
const MEAN_TOL = 4;
const MAX_TOL = 40;

// imageDiff's mad averages all four rgba channels; jpegs are opaque, so the rgb mean is 4/3 of it
const rgbMean = (d: { mad: number }) => d.mad * 4 / 3;

const THUMBS = /\/api\/assets\/\d+\/thumbnails\?branchId=/;
const SKIP = 'needs a second testSuite account cookie';

// multipart requests (creates, thumbnail uploads) with their fields; url and its path both tried, since THUMBS carries a query
const sent = async (spy: ServerSpy, method: string, url: RegExp) => (await spy.uploads()).filter(r => r.method === method && (url.test(r.url) || url.test(r.url.split('?')[0])));

/** Who did the work: on the candidate leg of a noConvert upload the editor owns thumbnails, otherwise the job does. */
const expectUploads = async (spy: ServerSpy, mode: Mode, noConvert: boolean) => {
    const creates = (await sent(spy, 'POST', /\/api\/assets$/)).filter(r => r.fields.type === 'texture' || r.fields.type === 'textureatlas');
    expect(creates.length, 'texture creates').toBeGreaterThan(0);
    const client = mode === 'client' && noConvert;
    for (const { fields } of creates) {
        expect(fields.noConvert, `${mode} noConvert`).toBe(noConvert ? 'true' : undefined);
        expect(fields.noThumbnails, `${mode} noThumbnails`).toBe(client ? 'true' : undefined);
    }
    expect(await sent(spy, 'POST', THUMBS), `${mode} thumbnail uploads`).toHaveLength(client ? creates.length : 0);
    expect((await spy.pipeline()).filter(m => m.name === 'thumbnails'), `${mode} thumbnail jobs asked for`).toEqual([]);
};

/**
 * Per-size tolerance check. `parity()` already proved the document (and so the thumbnail url set)
 * match exactly; images never travel through that comparison since it is exact, not tolerant.
 */
const expectImages = async (page: Page, server: Record<Size, Buffer>, client: Record<Size, Buffer>, smooth = false) => {
    for (const size of SIZE_NAMES) {
        const d = await imageDiff(page, server[size], client[size]);
        expect([d.a, d.b].map(i => [i.width, i.height]), `${size} dimensions`).toEqual([[SIZES[size], SIZES[size]], [SIZES[size], SIZES[size]]]);
        expect(rgbMean(d), `${size} mean abs diff`).toBeLessThanOrEqual(MEAN_TOL);
        if (smooth) {
            expect(d.max, `${size} max diff`).toBeLessThanOrEqual(MAX_TOL);
        }
    }
};

// both legs' jpegs go in the report, so a tolerance failure can be looked at
const attach = (info: TestInfo, images: Record<Mode, Record<Size, Buffer>>) => Promise.all(
    (['server', 'client'] as const).flatMap(mode => SIZE_NAMES.map(size => info.attach(`${mode}-${size}.jpg`, { body: images[mode][size], contentType: 'image/jpeg' })))
);

test.describe('texture thumbnails: client parity', () => {
    for (const c of CASES) {
        test(`${c.name} matches the server`, async ({ editorPage }, testInfo) => {
            test.setTimeout(PARITY_TIMEOUT);
            const images = {} as Record<Mode, Record<Size, Buffer>>;
            const drive = (via: typeof oracleUpload | typeof upload, mode: Mode) => async (spy: ServerSpy) => {
                // same base both legs: scrub() cuts a uniqueName to <base> and normalizeAsset keeps
                // name/file.filename, so a per-leg base would never compare equal. the legs can't
                // collide: uniqueName still gives each its own -<n>, and the server leg's restore
                // deletes its assets before the client leg starts
                const name = `${uniqueName('thumb')}.png`;
                const id = await via(editorPage, name, c.type, c.png);
                const shot = await capture(editorPage, id);
                images[mode] = shot.images;
                await expectGrid(editorPage, name);
                await expectUploads(spy, mode, true);
                await pin(editorPage, id, shot, c.probes);
                return normalizeAsset(shot.doc);
            };
            await parity({
                server: { page: editorPage, run: drive(oracleUpload, 'server') },
                client: { page: editorPage, run: drive(upload, 'client') }
            });
            await attach(testInfo, images);
            await expectImages(editorPage, images.server, images.client, c.smooth);
        });
    }

    test('a client-generated font atlas matches the server', async ({ editorPage }, testInfo) => {
        test.setTimeout(PARITY_TIMEOUT);
        const images = {} as Record<Mode, Record<Size, Buffer>>;
        const drive = (mode: Mode) => async (spy: ServerSpy) => {
            const [, , texture] = await new AssetWorkflows(editorPage).upload({ name: `${uniqueName('font')}.ttf`, mimeType: 'font/ttf', buffer: FONT }, ['font', 'json', 'texture']);
            await waitThumbs(editorPage, texture.id);
            if (mode === 'server') {
                // the atlas page goes through assets:uploadFile, so whatever made this first set,
                // force a job-made one on top with the watcher's own two steps: a silent local
                // has_thumbnail reset and the message collab-server routes to the job. the job may
                // rewrite byte-identical jpegs, so this waits on the reset→true transition
                await editorPage.evaluate((id) => {
                    const asset = window.editor.call('assets:get', id) as any;
                    asset.set('has_thumbnail', false, true);
                    window.editor.call('realtime:send', 'pipeline', { name: 'thumbnails', data: { target: asset.get('id') } });
                }, texture.id);
                await waitThumbs(editorPage, texture.id);
            } else {
                // the server leg's own font import can't be kept off the shipped hook, so only the
                // candidate's work is asserted
                await expectUploads(spy, mode, true);
            }
            const shot = await capture(editorPage, texture.id);
            images[mode] = shot.images;
            await pin(editorPage, texture.id, shot, []);
            return normalizeAsset(shot.doc);
        };
        await parity({
            server: { page: editorPage, run: drive('server') },
            client: { page: editorPage, run: drive('client') }
        // each leg's own font source and folder
        }, { normalize: ({ source_asset_id, path, ...rest }: Record<string, unknown>) => rest });
        await attach(testInfo, images);
        await expectImages(editorPage, images.server, images.client);
    });

    test('an rgbm toggle regenerates the same thumbnails', async ({ editorPage }, testInfo) => {
        test.setTimeout(3 * PARITY_TIMEOUT);
        const images = {} as Record<Mode, { on: Record<Size, Buffer>; off: Record<Size, Buffer> }>;
        const drive = (via: typeof oracleUpload | typeof upload, toggler: typeof oracleToggle | typeof toggle, mode: Mode) => async (spy: ServerSpy) => {
            const id = await via(editorPage, `${uniqueName('rgbm')}.png`, 'texture', grid(256, 256, 2, 2, RGBM));

            // taken after the initial upload, so its own thumbnail traffic isn't counted as the toggles'
            const preJobs = (await spy.pipeline()).filter(m => m.name === 'thumbnails').length;
            const preUploads = (await sent(spy, 'POST', THUMBS)).length;

            const on = await toggler(editorPage, id, true);
            const off = await toggler(editorPage, id, false);
            images[mode] = { on: on.images, off: off.images };

            // server (oracle): oracleToggle asks the job once per toggle, with the watcher unbound,
            // and uploads nothing. client (candidate): the watcher makes both itself, no job
            const jobs = (await spy.pipeline()).filter(m => m.name === 'thumbnails').slice(preJobs).map(m => Number((m.data as { data: { target: number } }).data.target));
            expect(jobs, `${mode} thumbnail jobs asked for by the toggles`).toEqual(mode === 'client' ? [] : [id, id]);
            expect((await sent(spy, 'POST', THUMBS)).length - preUploads, `${mode} thumbnail uploads from the toggles`).toBe(mode === 'client' ? 2 : 0);
            await pin(editorPage, id, on, cells(2, 2, RGBM, rgbm));
            await pin(editorPage, id, off, cells(2, 2, RGBM));
            return { on: normalizeAsset(on.doc), off: normalizeAsset(off.doc) };
        };
        await parity({
            server: { page: editorPage, run: drive(oracleUpload, oracleToggle, 'server') },
            client: { page: editorPage, run: drive(upload, toggle, 'client') }
        });
        await attach(testInfo, { server: images.server.on, client: images.client.on });
        await expectImages(editorPage, images.server.on, images.client.on);
        await expectImages(editorPage, images.server.off, images.client.off);
    });

    test('the tolerance catches a broken candidate', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        // red follows y and green x, the mirror of the 'smooth gradient' case: both give r=g=128 at the
        // centre, so pin()'s centre probe can't tell them apart, but everywhere else they differ past
        // MEAN_TOL/MAX_TOL, a stand-in for a candidate broken in a way the coarse probes miss
        const swapped = png(1024, 512, (x, y) => [Math.round(y / 511 * 255), Math.round(x / 1023 * 255), 96, 255]);
        const centre: Probe[] = [{ at: [0.5, 0.5], rgb: [128, 128, 96] }];
        const shots = {} as Record<'good' | 'bad', Shot>;

        // the verdict goes through parity() itself with expectImages' tolerance: "ok" is the only
        // value the server leg returns, and the client leg can't agree because `bad` is a different image
        const verdict = async () => {
            for (const size of SIZE_NAMES) {
                const d = await imageDiff(editorPage, shots.good.images[size], shots.bad.images[size]);
                if (rgbMean(d) > MEAN_TOL || d.max > MAX_TOL) {
                    return `${size}: mean ${rgbMean(d).toFixed(1)} max ${d.max}`;
                }
            }
            return 'ok';
        };
        await expect(parity({
            server: {
                page: editorPage,

                // both textures are made inside this leg, so its own restore deletes them
                run: async () => {
                    const goodId = await oracleUpload(editorPage, `${uniqueName('tol-good')}.png`, 'texture', gradient(1024, 512, false));
                    const badId = await oracleUpload(editorPage, `${uniqueName('tol-bad')}.png`, 'texture', swapped);
                    shots.good = await capture(editorPage, goodId);
                    shots.bad = await capture(editorPage, badId);
                    await pin(editorPage, goodId, shots.good, centre);
                    await pin(editorPage, badId, shots.bad, centre);
                    return 'ok';
                }
            },
            client: { page: editorPage, run: verdict }
        })).rejects.toThrow(/the client result differs from the server's/);
    });

    test('a supported panel upload skips the server jobs', async ({ editorPage }) => {
        test.setTimeout(PARITY_TIMEOUT);
        const images = {} as Record<Mode, Record<Size, Buffer>>;
        // supported input: the panel upload converts in the editor (plan 04) and makes its own
        // thumbnails (plan 03), so no server job runs; the oracle leg still queues both
        const drive = (mode: Mode) => async (spy: ServerSpy) => {
            const via = mode === 'server' ? oracleConvertUpload : uploadViaPanel;
            const id = await via(editorPage, `${uniqueName('converted')}.png`, grid(256, 256, 2, 2, OPAQUE));
            const shot = await capture(editorPage, id);
            images[mode] = shot.images;
            await expectUploads(spy, mode, mode === 'client');
            return normalizeAsset(shot.doc);
        };
        await parity({
            server: { page: editorPage, run: drive('server') },
            client: { page: editorPage, run: drive('client') }
        });
        await expectImages(editorPage, images.server, images.client);
    });

    test.describe('with a collaborator', () => {
        let guestId: number | null = null;

        test.afterEach(async ({ editorPage, project, collaborator }) => {
            const guest = guestId;
            guestId = null;
            await Promise.all((collaborator?.pages() ?? []).map(page => page.close()));
            if (guest !== null) {
                await revoke(editorPage, project.id, guest);
            }
        });

        test('a collaborator sees the same thumbnails and never makes them', async ({ editorPage, collaborator, project }) => {
            test.skip(!collaborator, SKIP);
            test.setTimeout(3 * PARITY_TIMEOUT);
            const guest = await join(editorPage, collaborator!, project, 'read');
            guestId = guest.id;

            const drive = (via: typeof oracleUpload | typeof upload, toggler: typeof oracleToggle | typeof toggle, mode: Mode) => async (spy: ServerSpy) => {
                const guestSpy = await spyServerWork(guest.page);
                const id = await via(editorPage, `${uniqueName('shared')}.png`, 'texture', grid(256, 256, 2, 2, RGBM));
                await waitThumbs(guest.page, id);
                const preJobs = (await spy.pipeline()).filter(m => m.name === 'thumbnails').length;
                const host = await capture(editorPage, id);
                const seen = await capture(guest.page, id);

                // the host toggles; the guest only ever receives the op
                const on = await toggler(editorPage, id, true);
                await waitChanged(guest.page, seen.fields.thumbnails.xl, seen.images.xlarge);
                await waitThumbs(guest.page, id);
                const seenOn = await capture(guest.page, id);
                await guestSpy.stop();

                // the same stored objects, so byte-identical for the guest
                for (const size of SIZE_NAMES) {
                    expect(seen.images[size].equals(new Uint8Array(host.images[size])), `${mode} ${size} as the guest sees it`).toBe(true);
                    expect(seenOn.images[size].equals(new Uint8Array(on.images[size])), `${mode} ${size} after rgbm, as the guest sees it`).toBe(true);
                }

                // the guest's watcher treats the incoming op as remote and does nothing, in both legs
                expect((await sent(guestSpy, 'POST', THUMBS)).length, `${mode} guest thumbnail uploads`).toBe(0);
                expect((await guestSpy.pipeline()).filter(m => m.name === 'thumbnails'), `${mode} guest thumbnail jobs`).toEqual([]);

                // server (oracle): oracleToggle's explicit message, sent once by the host. client
                // (candidate): the host's watcher uploads instead of asking the job
                const hostJobs = (await spy.pipeline()).filter(m => m.name === 'thumbnails').slice(preJobs).map(m => Number((m.data as { data: { target: number } }).data.target));
                expect(hostJobs, `${mode} host thumbnail jobs asked for`).toEqual(mode === 'client' ? [] : [id]);
            };
            await parity({
                server: { page: editorPage, run: drive(oracleUpload, oracleToggle, 'server') },
                client: { page: editorPage, run: drive(upload, toggle, 'client') }
            });
        });
    });
});
