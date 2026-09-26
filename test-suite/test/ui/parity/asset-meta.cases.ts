import { expect, type Page } from '@playwright/test';

import { JOB_TIMEOUT } from '../../../lib/constants';
import { AssetsPanel } from '../../../lib/pages/assets';
import type { ServerSpy } from '../../../lib/parity';
import { waitForEditor } from '../../../lib/ready';
import { uniqueName } from '../../../lib/utils';
import { model, normalMap, splat, texture } from '../../fixtures/assets';
import { GREY, GREY_ALPHA, legacyModel, png, RGB, sog, webp } from '../../fixtures/meta-images';

const OCTET = 'application/octet-stream';

// projectId/branchId are the same project/branch throughout a run either way; parent is absent
// on both legs here (every case uploads at the project root)
const BOILERPLATE_FIELDS = ['projectId', 'branchId', 'parent'];

type Json = Record<string, any>;

export type Case = {
    id: string;
    kind: 'drop' | 'model';
    ext: string;
    mime: string;
    bytes: (page: Page) => Promise<Buffer>;

    // assets the case ends with, and the types whose meta it pins
    count: number;
    wants: string[];

    // plan 02 computes this meta on the client; false means the server does it in both modes
    client: boolean;

    // the type the oracle's REST create sends: what native drop-detection infers for the
    // extension (assets-upload.ts typeToExt), so a dropped .glb is 'scene'; only the explicit
    // type:'model' unwrap/mcp call (kind 'model') sends 'model'
    serverType: 'texture' | 'model' | 'gsplat' | 'scene';

    // bytes come from the browser's encoder, so the golden leaves out file size and hash
    stable?: false;

    // the candidate converts this upload in the editor (plan 04 texture import), so a converted file's
    // bytes come from its encoder, not sharp's: only source files keep size and hash there.
    // texture-convert's differential holds those pixels to the server's
    reencoded?: true;
};

type Handle = { unbind: () => void };

const now = (fn: () => Buffer) => () => Promise.resolve(fn());

const drop = (id: string, ext: string, mime: string, bytes: Case['bytes'], extra: Partial<Case> = {}): Case => ({
    id, kind: 'drop', ext, mime, bytes, count: 1, wants: ['texture'], client: true, serverType: 'texture', ...extra
});

export const CASES: Case[] = [
    drop('png-rgb', '.png', 'image/png', now(() => texture({ width: 4, height: 4, alpha: false, format: 'png' }))),
    drop('png-rgba', '.png', 'image/png', now(() => texture({ width: 4, height: 4, alpha: true, format: 'png' }))),
    drop('png-grey', '.png', 'image/png', now(() => png({ width: 4, height: 4, color: GREY, pixel: x => [x * 60] }))),
    drop('png-grey-alpha', '.png', 'image/png', now(() => png({ width: 4, height: 4, color: GREY_ALPHA, pixel: (x, y) => [x * 60, y * 60] }))),
    drop('png-rgb16', '.png', 'image/png', now(() => png({ width: 4, height: 4, color: RGB, depth: 16, pixel: (x, y) => [x * 16000, y * 16000, 30000] })), { reencoded: true }),
    drop('png-npot', '.png', 'image/png', now(() => texture({ width: 3, height: 5, alpha: false, format: 'png' }))),
    drop('jpeg', '.jpg', 'image/jpeg', now(() => texture({ width: 4, height: 4, alpha: false, format: 'jpeg' }))),
    drop('webp-alpha', '.webp', 'image/webp', webp, { stable: false }),

    // float input converts to an rgbm png target beside the source (assets.ts getTextureOptions)
    drop('hdr', '.hdr', OCTET, now(() => texture({ width: 4, height: 2, alpha: false, format: 'hdr' })), { count: 2, reencoded: true }),
    drop('normal-map', '.png', 'image/png', now(() => normalMap({ width: 16, height: 16 }))),
    drop('checker', '.png', 'image/png', now(() => png({ width: 16, height: 16, color: RGB, pixel: (x, y) => ((x + y) % 2 ? [255, 255, 255] : [0, 0, 0]) }))),
    drop('tga', '.tga', OCTET, now(() => texture({ width: 4, height: 4, alpha: true, format: 'tga' })), { count: 2, client: false, reencoded: true }),
    drop('bmp', '.bmp', OCTET, now(() => texture({ width: 4, height: 4, alpha: false, format: 'bmp' })), { count: 2, client: false, reencoded: true }),
    drop('ply', '.ply', OCTET, now(splat), { wants: ['gsplat'], serverType: 'gsplat' }),
    drop('sog', '.sog', OCTET, now(sog), { wants: ['gsplat'], serverType: 'gsplat' }),
    { id: 'model-glb', kind: 'model', ext: '.glb', mime: 'model/gltf-binary', bytes: now(model), count: 1, wants: ['model'], client: true, serverType: 'model' },
    { id: 'model-json', kind: 'model', ext: '.json', mime: 'application/json', bytes: now(legacyModel), count: 1, wants: ['model'], client: true, serverType: 'model' },

    // source, animation, material and container, then the two assets template-convert adds last;
    // animation-meta rewrites the animation's meta after that, but with the same value fact wrote
    drop('animation-glb', '.glb', 'model/gltf-binary', now(model), { count: 6, wants: ['animation'], client: false, serverType: 'scene' })
];

export const PNG_RGB = CASES[0];

/** The bytes `project` keeps for a case: what the golden pins, less the candidate's re-encoded files. */
export const bytes = (c: Case, candidate = true) => (c.stable === false ? false : candidate && c.reencoded ? 'source' : true);

export const ids = (page: Page) => page.evaluate(() => window.editor.api.globals.assets.list().map((a: any) => Number(a.get('id'))));

/**
 * Waits until the assets outside `skip` have finished the jobs the server chains off an upload:
 * at least `count` of them (folders aside), none running a task, every wanted type present with meta and a file
 * (for re-uploads, a hash other than `from`). A wanted texture also waits for meta describing its
 * own file, since a convert target starts with its source's meta until its meta job lands, and,
 * unless it is a source, for `has_thumbnail`, the last write of the convert chain, and then for
 * the panel's thumbnail fetches.
 */
export const settle = (page: Page, skip: number[], want: { count: number; wants: string[]; from?: string }) => page.evaluate(({ skip, want, timeout }) => new Promise<Json[]>((resolve, reject) => {
    const assets = window.editor.api.globals.assets as any;
    const bound = new Map<number, Handle[]>();
    const registry: Handle[] = [];
    let queued = false;
    const format = (name: string) => {
        const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
        return ext === 'jpg' ? 'jpeg' : ext;
    };
    const done = (a: Json) => {
        const ended = !a.task || a.task === 'failed';
        if (!want.wants.includes(a.type)) {
            return ended;
        }
        const filed = ended && !!a.meta && !!a.file?.hash && a.file.hash !== want.from;
        if (a.type !== 'texture' || a.task === 'failed') {
            return filed;
        }
        return filed && a.meta.format === format(a.file.filename) && (a.source || a.has_thumbnail === true);
    };
    const read = () => assets.list().filter((a: any) => !skip.includes(Number(a.get('id'))));
    const off = () => {
        bound.forEach(evts => evts.forEach(e => e.unbind()));
        registry.forEach(e => e.unbind());
    };

    // the panel fetches a thumbnail as soon as it lands, and cleanup deleting the asset mid-fetch
    // 404s. has_thumbnail:set sets thumbnails.m and the rendered <img> src in the same dispatch
    // (editor-api asset.ts, element-asset-thumbnail.ts), so every fetch is in the dom by this
    // microtask; an item the panel renders later (another folder, a re-render) can still race
    const loaded = (json: Json[]) => Promise.all(Array.from(document.querySelectorAll('img'))
    .filter(img => json.some(a => img.src.includes(`/api/assets/${a.id}/thumbnail/`)))
    .map(img => img.complete || new Promise((ok) => {
        img.addEventListener('load', ok, { once: true });
        img.addEventListener('error', ok, { once: true });
    })));
    const check = () => {
        queued = false;
        const list = read();
        list.filter((a: any) => !bound.has(Number(a.get('id')))).forEach((a: any) => {
            bound.set(Number(a.get('id')), ['*:set', '*:unset', '*:insert', '*:remove'].map(name => a.on(name, schedule)));
        });
        const json: Json[] = list.map((a: any) => a.json());

        // a scene drop's import folder isn't one of the case's assets, so it doesn't count
        if (json.filter(a => a.type !== 'folder').length >= want.count && json.every(done) && want.wants.every(t => json.some(a => a.type === t))) {
            off();
            loaded(json).then(() => {
                clearTimeout(timer);
                resolve(json);
            });
        }
    };

    // an op's components land one event at a time, so judge the assets once the whole op has
    const schedule = () => {
        if (!queued) {
            queued = true;
            queueMicrotask(check);
        }
    };
    registry.push(...['add', 'remove'].map(name => assets.on(name, schedule)));
    const timer = setTimeout(() => {
        off();
        reject(new Error(`timed out waiting for the assets to settle: ${JSON.stringify(read().map((a: any) => a.json()))}`));
    }, timeout);
    check();
}), { skip, want: { count: want.count, wants: want.wants, from: want.from ?? null }, timeout: JOB_TIMEOUT });

const ext = (name: string) => name.slice(name.lastIndexOf('.')).toLowerCase();

/**
 * What parity compares: everything the meta and convert jobs decide, none of the ids or names a run
 * mints. `bytes` keeps file size and hash for every asset, for sources only, or for none.
 */
export const project = (list: Json[], wants: string[], bytes: boolean | 'source' = true) => list
.filter(a => wants.includes(a.type))
.map(a => ({
    type: a.type,
    source: !!a.source,
    ext: ext(a.file?.filename ?? a.name),
    task: a.task ?? null,
    meta: a.meta ?? null,
    ...(bytes === true || (bytes === 'source' && a.source) ? { size: a.file?.size ?? null, hash: a.file?.hash ?? null } : {})
}))
.sort((a, b) => `${a.type}${a.source}${a.ext}`.localeCompare(`${b.type}${b.source}${b.ext}`));

/**
 * Drops a file at the root. A scene drop leaves the panel inside the folder it creates for the
 * import (createFBXFolder), which the cleanup then deletes, so every drop starts from the root.
 */
export const dropFile = async (page: Page, file: { name: string; mimeType: string; buffer: Buffer }) => {
    await page.evaluate(() => window.editor.call('assets:panel:currentFolder', null));
    await new AssetsPanel(page).upload(file);
};

/** Uploads a case the way a user (drop) or the unwrap/MCP driver (type model) does, then settles it. */
export const runCase = async (page: Page, c: Case) => {
    const skip = await ids(page);
    const name = `${uniqueName(`meta-${c.id}`)}${c.ext}`;
    const buffer = await c.bytes(page);
    if (c.kind === 'model') {
        await page.evaluate(([n, b64]) => new Promise<void>((resolve, reject) => {
            const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
            window.editor.call('assets:uploadFile', { type: 'model', name: n, filename: n, file: new Blob([bytes]) }, (err: unknown) => (err ? reject(new Error(String(err))) : resolve()));
        }), [name, buffer.toString('base64')] as const);
    } else {
        await dropFile(page, { name, mimeType: c.mime, buffer });
    }
    return { name, list: await settle(page, skip, c) };
};

/**
 * Uploads a case through the plain REST create route exactly the way today's `assets:uploadFile`
 * sends a fresh asset (`src/editor/assets/assets-upload.ts`, the `args.asset`-unset branch):
 * sets `preloadDefault`, then `rest.assets.assetCreate(args, pipelineOptions(args.settings))`
 * (`src/editor-api/rest/assets.ts` `assetCreate(data, pipeline)`). It sits below the upload UI and
 * the `assets:uploadFile` hooks, so it is the backend-job oracle Task 11 diffs the candidate
 * frontend against; `oracle fidelity (main)` proves it sends what the UI path sends.
 *
 * Field by field, against `uploadToFolder`'s args (native drop) and `runCase`'s model call:
 * - `type`: `Case.serverType`, the type drop-detection infers (a dropped .glb is `scene`).
 * - `parent`/`data`/`meta`: `null`, since every case is a fresh asset at the root.
 * - `filename`: only for `kind: 'model'`, matching `runCase`'s explicit call; the drop path never
 *   sets it, and `assetUpdateFields` names the file part `filename || name` either way.
 * - `preloadDefault`: `type === 'script' ? true : editor.pipeline.defaultAssetPreload`, as upload does.
 * - pipeline: `assets:pipeline:options`, the method `assetCreate`'s second argument comes from,
 *   so `pow2`/`searchRelatedAssets`/`useGlb`/... carry this project's real settings.
 */
export const oracleUpload = async (page: Page, c: Case) => {
    const skip = await ids(page);
    const name = `${uniqueName(`meta-${c.id}`)}${c.ext}`;
    const buffer = await c.bytes(page);
    await page.evaluate(([n, mime, b64, type, isModel]) => {
        const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
        const file = new File([bytes], n, { type: mime });
        const settings = window.editor.call('settings:projectUser') as any;
        const args: Record<string, unknown> = {
            type,
            name: n,
            file,
            parent: null,
            data: null,
            meta: null,
            preloadDefault: type === 'script' ? true : settings.get('editor.pipeline.defaultAssetPreload')
        };
        if (isModel) {
            args.filename = n;
        }
        const pipeline = window.editor.call('assets:pipeline:options');
        return (window.editor.api.globals.rest.assets as any).assetCreate(args, pipeline).promisify();
    }, [name, c.mime, buffer.toString('base64'), c.serverType as string, c.kind === 'model'] as const);
    return { name, list: await settle(page, skip, c) };
};

/**
 * The same oracle for a re-upload: `assets-upload.ts`'s `args.asset` branch,
 * `rest.assets.assetUpdate(assetId, args, pipelineOptions(args.settings))`. The drop path never
 * sets `filename`, and `assetUpdateFields` (all `assetUpdate` builds) never reads `meta`/`data`.
 */
export const oracleReupload = (page: Page, id: number, name: string, mimeType: string, buffer: Buffer) => page.evaluate(([assetId, n, mime, b64]) => {
    const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    const file = new File([bytes], n, { type: mime });
    const pipeline = window.editor.call('assets:pipeline:options');
    return (window.editor.api.globals.rest.assets as any).assetUpdate(String(assetId), { type: 'texture', name: n, file }, pipeline).promisify();
}, [id, name, mimeType, buffer.toString('base64')] as const);

/** The multipart fields of the first captured upload `match` accepts. */
export const request = async (spy: ServerSpy, match: (u: Awaited<ReturnType<ServerSpy['uploads']>>[number]) => boolean) => (await spy.uploads()).find(match)?.fields ?? null;

/** The multipart fields a case's upload sent, matched by its `name`/`filename` field; a scene drop's own folder shares the name. */
export const byName = (spy: ServerSpy, name: string) => request(spy, u => u.fields.type !== 'folder' && (u.fields.name === name || u.fields.filename === name));

/** A case's upload fields, minus boilerplate expected to match regardless of driver. */
export const scrubFields = (fields: Record<string, string> | null) => fields && Object.fromEntries(Object.entries(fields).filter(([k]) => !BOILERPLATE_FIELDS.includes(k)));

// asset ops go over sharedb, so wait until the server has them before anything reads the asset
/** Clears a texture's meta the only way the server accepts: meta is nullable, and collab rejects deleting it (invalid:delete). */
export const unsetMeta = (page: Page, id: number) => page.evaluate(assetId => new Promise<void>((resolve) => {
    const globals = window.editor.api.globals;
    const asset = globals.assets.get(assetId)!;
    asset.set('meta', null);
    globals.realtime.assets.get(asset.get('uniqueId')).whenNothingPending(resolve);
}), id);

export const setMeta = (page: Page, id: number, values: Record<string, unknown>) => page.evaluate(([assetId, entries]) => new Promise<void>((resolve) => {
    const globals = window.editor.api.globals;
    const asset = globals.assets.get(assetId as number)!;
    Object.entries(entries as Record<string, unknown>).forEach(([path, value]) => asset.set(`meta.${path}`, value));
    globals.realtime.assets.get(asset.get('uniqueId')).whenNothingPending(resolve);
}), [id, values] as const);

/**
 * Selects a texture and presses the inspector's CALCULATE META (the "Get Meta" button). An id
 * selects through the selector the panel's own click sets, for assets that share a name (a paste).
 */
export const calculateMeta = async (page: Page, target: string | number) => {
    if (typeof target === 'number') {
        await page.evaluate(id => window.editor.call('selector:set', 'asset', [window.editor.call('assets:get', id)]), target);
    } else {
        await new AssetsPanel(page).select(target);
    }
    const button = page.locator('.asset-texture-inspector .pcui-button').filter({ hasText: 'CALCULATE META', visible: true });
    await expect(button, 'CALCULATE META was already pressed this session (see reloadEditor)').not.toHaveClass(/pcui-disabled/);
    await button.click();
};

/**
 * Loads the editor again. The texture inspector disables CALCULATE META after one press and
 * never enables it again (texture.ts `_handleBtnGetMetaClick`), so a test that presses it starts
 * here, before any spy, since a reload drops the page-side spy.
 */
export const reloadEditor = async (page: Page) => {
    await page.reload();
    await waitForEditor(page);
};

/**
 * Pastes a server-side copy of an asset at the root (`assets:paste`, which sends textures to
 * `pipeline.asset.copy`) and settles it. The copy job inserts the doc with its file already set,
 * so collab caches it with a file; a fresh upload is cached at first subscribe, before its file
 * lands, and collab never refreshes it, so `calculateMeta` there drops Get Meta
 * (collab-server lib/assets.ts). The clipboard is handed back afterwards.
 */
export const pastedCopy = async (page: Page, id: number) => {
    const skip = await ids(page);
    const prev = await page.evaluate((assetId) => {
        const clipboard = window.editor.call('clipboard') as { value: unknown };
        const value = clipboard.value;
        window.editor.call('assets:copy', [window.editor.call('assets:get', assetId)]);
        window.editor.call('assets:paste', null, true);
        return value ?? null;
    }, id);
    const copy = (await settle(page, skip, { count: 1, wants: ['texture'] })).find(a => a.type === 'texture')!;
    await page.evaluate((value) => {
        (window.editor.call('clipboard') as { value: unknown }).value = value;
    }, prev);
    return { id: Number(copy.id), name: copy.name as string };
};

/**
 * Sends the raw realtime `pipeline {name:'meta'}` message, as `_handleBtnGetMetaClick`
 * (`src/editor/inspector/assets/texture.ts`) does today. Task 11's server leg for `get-meta` uses
 * it, since from Task 9 the button tries the client fill first.
 */
export const pipelineGetMeta = (page: Page, id: number) => page.evaluate((assetId) => {
    const uniqueId = window.editor.api.globals.assets.get(assetId)!.get('uniqueId');
    window.editor.call('realtime:send', 'pipeline', { name: 'meta', id: uniqueId });
}, id);

const part = (body: Buffer, type: string, name: string) => {
    const [, quoted, bare] = type.match(/boundary=(?:"([^"]+)"|([^;]+))/) ?? [];
    const sep = `--${quoted ?? bare}`;
    const at = body.indexOf(`Content-Disposition: form-data; name="${name}"\r\n`);
    if (at < 0) {
        return null;
    }
    const start = body.indexOf('\r\n\r\n', at) + 4;

    // the part ends at the crlf before the next boundary
    return { start, end: body.indexOf(sep, start) - 2 };
};

export const getField = (body: Buffer, type: string, name: string) => {
    const p = part(body, type, name);
    return p ? body.subarray(p.start, p.end).toString() : null;
};

export const setField = (body: Buffer, type: string, name: string, value: string) => {
    const p = part(body, type, name);
    if (!p) {
        throw new Error(`the request has no ${name} field`);
    }
    return Buffer.concat([body.subarray(0, p.start), Buffer.from(value), body.subarray(p.end)].map(b => new Uint8Array(b)));
};
