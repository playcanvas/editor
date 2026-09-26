import { createHash } from 'node:crypto';

import type { Page } from '@playwright/test';

import { JOB_TIMEOUT } from '../../../lib/constants';
import { AssetsPanel } from '../../../lib/pages/assets';
import { EditorShell } from '../../../lib/pages/common';
import { fetchFile, imageDiff, normalizeAsset } from '../../../lib/parity';
import { normalMap, texture, type TextureFormat } from '../../fixtures/assets';
import { GREY, png, RGB } from '../../fixtures/meta-images';
import { bmp, gif, hdr, tga, tiff, webp } from '../../fixtures/textures';

// the compress job reports back through nothing the editor tracks, so a variant gets this long
export const COMPRESS_WAIT = 60_000;

const OCTET = 'application/octet-stream';

const IMAGE = /\.(?:png|jpe?g|webp)$/i;

const POT = { texturePot: true };

const NO_POT = { texturePot: false };

const PNG_CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 3, 4: 2, 6: 4 };

export type Tolerance = 'exact' | 'resampled' | 'depth' | 'lossy';

export type Image = { format: string; width: number; height: number; channels: number };

// shape from the file header, the way sharp reports it: png ihdr colour type, jpeg sof component
// count, webp vp8 (lossy, opaque), vp8l or vp8x (alpha flag)
export const shape = (b: Buffer) => {
    if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
        const kind = b.toString('ascii', 12, 16);
        if (kind === 'VP8X') {
            return { format: 'webp', width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1, channels: b[20] & 0x10 ? 4 : 3 } as Image;
        }
        if (kind === 'VP8L') {
            const v = b.readUInt32LE(21);
            return { format: 'webp', width: (v & 0x3fff) + 1, height: ((v >>> 14) & 0x3fff) + 1, channels: (v >>> 28) & 1 ? 4 : 3 } as Image;
        }
        return { format: 'webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff, channels: 3 } as Image;
    }
    if (b.length > 25 && b.readUInt32BE(0) === 0x89504e47) {
        return { format: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20), channels: PNG_CHANNELS[b[25]] } as Image;
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
        for (let i = 2; i + 9 < b.length && b[i] === 0xff; i += 2 + b.readUInt16BE(i + 2)) {
            const m = b[i + 1];
            if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
                return { format: 'jpeg', width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5), channels: b[i + 9] } as Image;
            }
        }
    }
    return null;
};

/** Harness `imageDiff` plus header shapes; webp and others fall back to the decoded size and alpha. */
export const diff = async (page: Page, a: Buffer, b: Buffer) => {
    const d = await imageDiff(page, a, b);
    const info = (buf: Buffer, i: typeof d.a) => shape(buf) ?? { format: i.mime.replace('image/', ''), width: i.width, height: i.height, channels: i.alpha ? 4 : 3 };
    return { a: info(a, d.a), b: info(b, d.b), mean: d.mad, max: d.max };
};

export type Node = {
    name: string;
    type: string;
    source: boolean;
    filename: string | null;
    parent: string | null;
    sourceOf: string | null;
    variants: string[];
    asset: Record<string, any>;
    file: Buffer | null;
};

/**
 * Where a case's upload/re-import action comes from. `UI_DRIVER` drives the real file chooser and
 * the Re-Import context-menu entry. `ORACLE_DRIVER` sends the REST requests today's Editor sends,
 * below the upload UI and the `assets:uploadFile`/`assets:reimport` hooks later plans add. Drivers
 * only act; the case waits for the result, so both legs wait the same way. Every upload goes to
 * the project root; only targets ever move into a folder.
 */
export type Driver = {
    upload: (page: Page, name: string, buffer: Buffer, folder?: number) => Promise<void>;
    reimport: (page: Page, name: string) => Promise<void>;
};

export type Case = {
    name: string;
    settings: { texturePot: boolean; searchRelatedAssets?: boolean; textureDefaultToAtlas?: boolean; defaultAssetPreload?: boolean };

    // the user's steps, run with either driver; resolves once every asset of the case has settled
    run: (page: Page, p: string, driver: Driver) => Promise<void>;

    // output tolerance per canonical asset name; anything unlisted is 'exact'
    tolerance?: Record<string, Tolerance>;

    // the client must hand these to the server, so both modes take the server path
    serverOnly?: boolean;

    // the client requests variants itself (the server chains them in its job)
    compress?: boolean;

    // canonical name whose stored bytes must be exactly the uploaded input
    kept?: { name: string; input: Input };
};

// a fixture's bytes; webp needs the browser's encoder
type Input = (page: Page) => Buffer | Promise<Buffer>;

/** A bounded wait that names what it waited for and dumps the case's assets when it runs out. */
const until = <A>(page: Page, p: string, what: string, fn: (arg: A) => unknown, arg: A, timeout = JOB_TIMEOUT) => page
.waitForFunction(fn as (a: unknown) => unknown, arg as unknown, { timeout, polling: 500 })
.then(() => {}, async (error: Error) => {
    const state = await page.evaluate(prefix => window.editor.api.globals.assets.list()
    .filter((a: any) => (a.get('name') as string).startsWith(prefix))
    .map((a: any) => ({ name: a.get('name'), task: a.get('task'), hash: a.get('file.hash'), thumb: a.get('has_thumbnail'), variants: Object.keys(a.get('file.variants') ?? {}) })), p);
    throw new Error(`timed out waiting for ${what}: ${error.message}\n${JSON.stringify(state)}`);
});

/**
 * Waits for `count` assets of the case, none with pipeline work or a missing file left, and every
 * target with its thumbnail and meta describing its own format: a fresh convert target starts
 * with null meta, and its meta job races the thumbnail job.
 */
export const settled = (page: Page, p: string, count: number) => until(page, p, `${count} settled assets`, ([prefix, n]) => {
    const mine = (name: string) => name.startsWith(`${prefix}.`) || name.startsWith(`${prefix}-`);
    const list = window.editor.api.globals.assets.list().filter((a: any) => mine(a.get('name')));
    const format = (f: string) => ({ jpg: 'jpeg', tif: 'tiff' } as Record<string, string>)[f] ?? f;
    const described = (a: any) => a.get('meta.format') === format((a.get('file.filename') as string).split('.').pop()!.toLowerCase());
    const done = (a: any) => a.get('type') === 'folder' || (!a.get('task') && !!a.get('file.hash') && (a.get('source') || (a.get('has_thumbnail') === true && described(a))));

    // the grid's thumbnail <img> (src set in the has_thumbnail:set dispatch) must finish, or cleanup deleting the asset 404s it
    const fetching = Array.from(document.querySelectorAll('img')).some(img => !img.complete && list.some((a: any) => img.src.includes(`/api/assets/${a.get('id')}/thumbnail/`)));
    return list.length === n && list.every(done) && !fetching;
}, [p, count] as const);

/**
 * Arms before a separate target is refreshed; the returned wait resolves once its file has moved
 * on and a meta write followed. Its stale meta already names its format, and the server queues
 * the target's meta job only after the file op (texture-convert finish), so this is the signal.
 */
const refreshed = (page: Page, id: number) => new EditorShell(page).arm((i: number) => {
    const a = window.editor.api.globals.assets.get(i) as any;
    const from = a.get('file.hash');
    let moved = false;
    let meta = false;
    const events: { unbind: () => void }[] = [];
    const done = new Promise<void>((resolve) => {
        const check = (path: string) => {
            moved ||= !!a.get('file.hash') && a.get('file.hash') !== from;
            meta ||= moved && path.startsWith('meta');
            if (moved && meta && !a.get('task')) {
                resolve();
            }
        };
        events.push(a.on('*:set', check), a.on('*:unset', check));
    });
    return { done, dispose: () => events.forEach(e => e.unbind()) };
}, id, { what: `asset ${id} to get a new file and then its meta`, timeout: JOB_TIMEOUT });

/** Waits for an asset's file to move on from `hash`: a re-upload or re-import landing. */
const changed = (page: Page, p: string, id: number, hash: string) => until(page, p, `asset ${id} to leave file ${hash}`, ([i, h]) => {
    const a = window.editor.api.globals.assets.get(i as number) as any;
    return !!a && !a.get('task') && !!a.get('file.hash') && a.get('file.hash') !== h;
}, [id, hash] as const);

/** Waits for the compress job's variant to land on the asset. */
const variant = (page: Page, p: string, id: number, format: string) => until(page, p, `the ${format} variant of asset ${id}`, ([i, f]) => {
    return !!(window.editor.api.globals.assets.get(i as number) as any)?.get(`file.variants.${f}.hash`);
}, [id, format] as const, COMPRESS_WAIT);

const find = async (page: Page, name: string) => {
    const hit = await page.evaluate((n) => {
        const a = window.editor.api.globals.assets.findOne((x: any) => x.get('name') === n) as any;
        return a ? { id: Number(a.get('id')), hash: a.get('file.hash') as string } : null;
    }, name);
    if (!hit) {
        throw new Error(`${name} not found`);
    }
    return hit;
};

const set = async (page: Page, id: number, path: string, value: unknown) => {
    await page.evaluate(([i, k, v]) => (window.editor.call('assets:get', i) as any).set(k, v), [id, path, value] as const);
    await new AssetsPanel(page).flush(id);
};

const folder = async (page: Page, name: string) => (await new AssetsPanel(page).create('createFolder', { name })).id;

const move = async (page: Page, id: number, to: number) => {
    await page.evaluate(([i, t]) => window.editor.call('assets:fs:move', [window.editor.call('assets:get', i)], window.editor.call('assets:get', t)), [id, to] as const);
    await new AssetsPanel(page).waitForParent(id, to);
};

// a converted target waits for its new meta too; an in-place one gets its size in the convert op itself
const reimport = async (page: Page, p: string, driver: Driver, name: string) => {
    const { id, hash } = await find(page, name);
    const target = await page.evaluate(n => !!window.editor.api.globals.assets.findOne((x: any) => x.get('name') === n)?.get('source_asset_id'), name);
    const done = target ? await refreshed(page, id) : null;
    await driver.reimport(page, name);
    await (done ? done() : changed(page, p, id, hash));
};

/** Uploads through the file chooser into the panel's folder (the root by default), the way a user does. */
const uiUpload = async (page: Page, name: string, buffer: Buffer, folder?: number) => {
    await page.evaluate(f => window.editor.call('assets:panel:currentFolder', f === null ? null : window.editor.call('assets:get', f)), folder ?? null);
    const chooser = page.waitForEvent('filechooser');
    await new AssetsPanel(page).newAsset('Upload');
    await (await chooser).setFiles({ name, mimeType: OCTET, buffer });
};

/**
 * The Re-Import context-menu entry. The menu hides it for an in-place target (neither a source nor
 * converted from one, assets-context-menu.ts), so there the editor's only re-import is the
 * `assets:reimport` method the mcp driver calls, with the same (id, type) the entry would pass.
 */
const uiReimport = async (page: Page, name: string) => {
    const inPlace = await page.evaluate((n) => {
        window.editor.call('assets:panel:currentFolder', null);
        const a = window.editor.api.globals.assets.findOne((x: any) => x.get('name') === n) as any;
        if (a.get('source') || a.get('source_asset_id')) {
            return false;
        }
        window.editor.call('assets:reimport', a.get('id'), a.get('type'));
        return true;
    }, name);
    if (!inPlace) {
        await new AssetsPanel(page).contextMenu(name, 'Re-Import');
    }
};

export const UI_DRIVER: Driver = { upload: uiUpload, reimport: uiReimport };

/**
 * Today's `assets:uploadFile` request, sent straight through the REST client so no hook inside
 * that method (plan 02's client meta, plan 03's thumbnails, this plan's client convert) reaches it.
 * Field by field against `uploadToFolder` and `assets:uploadFile` (`src/editor/assets/assets-upload.ts`):
 * - `type`: `'textureatlas'` under `editor.pipeline.textureDefaultToAtlas`, else `'texture'`;
 *   every fixture here maps to the texture entry of `typeToExt`.
 * - `parent`: the panel's current folder, which `assetUpdateFields` appends on create and update
 *   alike (nothing at the root).
 * - create: `preloadDefault` from `editor.pipeline.defaultAssetPreload`; `data`/`meta` are null
 *   for a fresh asset, and `assetCreate` appends neither then.
 * - update: `assetUpdate(id, args, pipeline)`; `assetUpdateFields` never reads `meta`/`data`.
 * - pipeline: `assets:pipeline:options`, the method `pipelineOptions` is registered as.
 * The existing asset is found by exact name: every upload here goes to one folder with a name only
 * one asset of the case has, which is what `uploadFile`'s folder/type/source-aware search finds.
 */
const oracleUpload = async (page: Page, name: string, buffer: Buffer, folder?: number) => {
    await page.evaluate(([n, b64, mime, f]) => {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const settings = window.editor.call('settings:projectUser') as any;
        const existing = (window.editor.call('assets:find', (a: any) => a.get('name') === n) as any[])[0]?.[1];
        const type = settings.get('editor.pipeline.textureDefaultToAtlas') ? 'textureatlas' : 'texture';
        const file = new File([bytes], n, { type: mime });
        const pipeline = window.editor.call('assets:pipeline:options') as Record<string, unknown>;
        const rest = window.editor.api.globals.rest.assets as any;
        const parent = f === null ? null : window.editor.call('assets:get', f);
        return existing ?
            rest.assetUpdate(`${existing.get('id')}`, { type, name: n, file, parent }, pipeline).promisify() :
            rest.assetCreate({ type, name: n, file, parent, data: null, meta: null, preloadDefault: settings.get('editor.pipeline.defaultAssetPreload') }, pipeline).promisify();
    }, [name, buffer.toString('base64'), OCTET, folder ?? null] as const);
};

// the Re-Import entry calls assets:reimport(id, type), which sends assets:pipeline:options() as the body
const oracleReimport = async (page: Page, name: string) => {
    await page.evaluate((n) => {
        const asset = (window.editor.call('assets:find', (a: any) => a.get('name') === n) as any[])[0]?.[1];
        if (!asset) {
            throw new Error(`${n} not found`);
        }
        const data = window.editor.call('assets:pipeline:options', {});
        return (window.editor.api.globals.rest.assets as any).assetReimport(`${asset.get('id')}`, data).promisify();
    }, name);
};

export const ORACLE_DRIVER: Driver = { upload: oracleUpload, reimport: oracleReimport };

/** Sets project-user pipeline settings and resolves with their previous values. */
export const pipelineSettings = (page: Page, values: Record<string, boolean>) => page.evaluate((v) => {
    const s = window.editor.call('settings:projectUser') as any;
    const before: Record<string, boolean> = {};
    for (const [k, x] of Object.entries(v)) {
        before[k] = s.get(`editor.pipeline.${k}`);
        s.set(`editor.pipeline.${k}`, x);
    }
    return before;
}, values);

/** The case's assets, normalized, with the run prefix replaced by '<p>' so runs compare. */
export const graph = async (page: Page, p: string) => {
    const list = await page.evaluate((prefix) => {
        const mine = (name: string) => name.startsWith(`${prefix}.`) || name.startsWith(`${prefix}-`);
        return window.editor.api.globals.assets.list().filter((a: any) => mine(a.get('name'))).map((a: any) => a.json() as Record<string, any>);
    }, p);
    const names = new Map(list.map(a => [Number(a.id), a.name as string]));
    const canon = (v: unknown) => (v === null || v === undefined ? null : JSON.parse(JSON.stringify(v).replaceAll(p, '<p>')));
    const label = (id: number | string) => names.get(Number(id)) ?? `external:${id}`;
    const nodes: Node[] = [];
    for (const a of list) {
        const up = a.path?.length ? a.path[a.path.length - 1] : null;
        nodes.push({
            name: canon(a.name),
            type: a.type,
            source: !!a.source,
            filename: canon(a.file?.filename),
            parent: up === null ? null : canon(label(up)),
            sourceOf: a.source_asset_id ? canon(label(a.source_asset_id)) : null,
            variants: Object.keys(a.file?.variants ?? {}).sort(),

            // the worker's project, account and the stack's region vary between runs and stacks
            asset: canon(normalizeAsset({ ...a, scope: a.scope && { ...a.scope, id: '<project>' }, user_id: '<user>', region: '<region>' })),
            file: a.type !== 'folder' && a.file ? await fetchFile(page, Number(a.id)) : null
        });
    }

    // two targets can share a name (unrelated search), so the folder breaks the tie
    const key = (n: Node) => `${n.name}|${n.parent}`;
    return nodes.sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));
};

export const isImage = (n: Node) => !!n.file && !n.source && IMAGE.test(n.filename ?? '');

export const image = (n: Node) => (isImage(n) ? shape(n.file!) : null);

const sha = (b: Buffer | null) => (b ? createHash('sha256').update(new Uint8Array(b)).digest('hex') : null);

/** What the baseline snapshot pins: every node field, the header image shape and the server's exact bytes. */
export const summary = (nodes: Node[]) => nodes.map(({ file, ...n }) => ({ ...n, image: image({ ...n, file }), sha256: sha(file) }));

export const sameBytes = (a: Buffer | null, b: Buffer) => sha(a) === sha(b);

const tex = (o: { width: number; height: number; alpha?: boolean; format: TextureFormat }) => () => texture({ alpha: false, ...o });

const single = (name: string, ext: string, input: Input, count: number, settings: Case['settings'], extra: Partial<Case> = {}): Case => ({
    name,
    settings,
    ...extra,
    run: async (page, p, driver) => {
        await driver.upload(page, `${p}${ext}`, await input(page));
        await settled(page, p, count);
    }
});

const TGA = tex({ width: 20, height: 12, format: 'tga' });

// a second, different tga whose nearest pow2 size (16×16) equals the first one's
const TGA_AGAIN = tex({ width: 18, height: 14, format: 'tga' });

const PNG_UNTOUCHED = tex({ width: 20, height: 12, format: 'png' });

const JPEG_UNTOUCHED = tex({ width: 16, height: 16, format: 'jpeg' });

const EXR = tex({ width: 20, height: 12, format: 'exr' });

const png16 = () => png({ width: 16, height: 16, color: RGB, depth: 16, pixel: (x, y) => [(x * 4099) & 0xffff, (y * 4099) & 0xffff, ((x + y) * 2053) & 0xffff] });

const bigGrey = (width: number, height: number) => png({ width, height, color: GREY, pixel: () => [128] });

const W = { width: 20, height: 12 };

const greyPng = () => png({ ...W, color: GREY, pixel: (x, y) => [x * 12 + y * 3] });

const png16Grey = () => png({ width: 16, height: 16, color: GREY, depth: 16, pixel: (x, y) => [(x * 4099 + y * 257) & 0xffff] });

const png16Npot = () => png({ ...W, color: RGB, depth: 16, pixel: (x, y) => [(x * 3203) & 0xffff, (y * 5419) & 0xffff, 30000] });

// source upload (into `dir` if given); resolves with its jpeg target
const tgaThenTarget = async (page: Page, p: string, driver: Driver, dir?: number) => {
    await driver.upload(page, `${p}.tga`, TGA(), dir);
    await settled(page, p, dir === undefined ? 2 : 3);
    return find(page, `${p}.jpeg`);
};

// the source uploaded again over its target, which the server finds and refreshes in place
const reupload = (name: string, settings: Case['settings'], inFolder = false): Case => ({
    name,
    settings,
    tolerance: { '<p>.jpeg': 'lossy' },
    run: async (page, p, driver) => {
        const dir = inFolder ? await folder(page, `${p}-dir`) : undefined;
        const done = await refreshed(page, (await tgaThenTarget(page, p, driver, dir)).id);
        await driver.upload(page, `${p}.tga`, TGA_AGAIN(), dir);
        await done();
        await settled(page, p, inFolder ? 3 : 2);
    }
});

const remove = async (page: Page, id: number) => {
    await page.evaluate(i => window.editor.call('assets:fs:delete', [window.editor.call('assets:get', i)]), id);
    await new AssetsPanel(page).waitForRemove(id);
};

export const CASES: Case[] = [
    // in place
    single('png-npot-pow2', '.png', tex({ width: 20, height: 12, format: 'png' }), 1, POT, { tolerance: { '<p>.png': 'resampled' } }),
    single('png-npot-no-pow2', '.png', PNG_UNTOUCHED, 1, NO_POT, { kept: { name: '<p>.png', input: PNG_UNTOUCHED } }),
    single('png-pow2-alpha', '.png', tex({ width: 16, height: 16, alpha: true, format: 'png' }), 1, POT),
    single('png-16bit', '.png', png16, 1, POT, { tolerance: { '<p>.png': 'depth' } }),
    single('png-normal-map', '.png', () => normalMap({ width: 16, height: 16 }), 1, POT),
    single('jpeg-npot-pow2', '.jpg', tex({ width: 20, height: 12, format: 'jpeg' }), 1, POT, { tolerance: { '<p>.jpg': 'lossy' } }),
    single('jpeg-pow2-no-pow2', '.jpg', JPEG_UNTOUCHED, 1, NO_POT, { kept: { name: '<p>.jpg', input: JPEG_UNTOUCHED } }),
    single('webp-npot-pow2', '.webp', page => webp(page, W), 1, POT, { tolerance: { '<p>.webp': 'lossy' } }),
    single('webp-pow2-no-pow2', '.webp', page => webp(page, { width: 16, height: 16 }), 1, NO_POT, { kept: { name: '<p>.webp', input: page => webp(page, { width: 16, height: 16 }) } }),

    // greyscale: sharp keeps one channel, 16-bit goes through toColourspace('srgb'), tga/bmp through greyscale()
    single('png-grey-npot-pow2', '.png', greyPng, 1, POT, { tolerance: { '<p>.png': 'resampled' } }),
    single('png16-grey', '.png', png16Grey, 1, POT, { tolerance: { '<p>.png': 'depth' } }),
    single('png-16bit-npot-pow2', '.png', png16Npot, 1, POT, { tolerance: { '<p>.png': 'resampled' } }),
    single('tga-grey-pow2', '.tga', () => tga({ ...W, grey: true }), 2, POT, { tolerance: { '<p>.jpeg': 'lossy' } }),
    single('bmp-grey-paletted', '.bmp', () => bmp({ ...W, palette: i => [i, i, i] }), 2, POT, { tolerance: { '<p>.jpeg': 'lossy' } }),

    // source -> target
    single('tga-opaque-pow2', '.tga', TGA, 2, POT, { tolerance: { '<p>.jpeg': 'lossy' } }),
    single('tga-alpha-no-pow2', '.tga', tex({ width: 20, height: 12, alpha: true, format: 'tga' }), 2, NO_POT),
    single('bmp-pow2', '.bmp', tex({ width: 20, height: 12, format: 'bmp' }), 2, POT, { tolerance: { '<p>.jpeg': 'lossy' } }),
    single('hdr-rgbm', '.hdr', tex({ width: 20, height: 12, format: 'hdr' }), 2, POT),
    single('exr-rgbm', '.exr', EXR, 2, POT),

    // decoder branches: tga origin, rle and opaque 32-bit; bmp rows and palette; hdr rle and orientation
    single('tga-top-left', '.tga', () => tga({ ...W, alpha: true, topLeft: true }), 2, NO_POT),
    single('tga-rle', '.tga', () => tga({ ...W, alpha: true, rle: true, blocks: true }), 2, NO_POT),
    single('tga-opaque-alpha', '.tga', () => tga({ ...W, opaque: true }), 2, NO_POT, { tolerance: { '<p>.jpeg': 'lossy' } }),
    single('bmp-top-down', '.bmp', () => bmp({ ...W, topDown: true }), 2, NO_POT, { tolerance: { '<p>.jpeg': 'lossy' } }),
    single('bmp-paletted', '.bmp', () => bmp({ ...W, palette: i => [i, 255 - i, (i * 7) & 0xff] }), 2, NO_POT, { tolerance: { '<p>.jpeg': 'lossy' } }),
    single('hdr-rle', '.hdr', () => hdr({ ...W, rle: true }), 2, POT),
    single('hdr-flip-y', '.hdr', () => hdr({ ...W, orient: '+Y +X' }), 2, POT),
    single('hdr-flip-x', '.hdr', () => hdr({ ...W, orient: '-Y -X' }), 2, POT),
    single('hdr-transposed', '.hdr', () => hdr({ ...W, orient: '+X -Y', rle: true }), 2, POT),

    // project settings the server reads off the source: atlas type, preload
    single('tga-atlas', '.tga', TGA, 2, { texturePot: true, textureDefaultToAtlas: true }, { tolerance: { '<p>.jpeg': 'lossy' } }),
    single('tga-no-preload', '.tga', TGA, 2, { texturePot: true, defaultAssetPreload: false }, { tolerance: { '<p>.jpeg': 'lossy' } }),

    // formats and sizes the browser must hand back to the server
    single('gif-server-only', '.gif', gif, 1, POT, { serverOnly: true }),
    single('tiff-server-only', '.tif', () => tiff(), 2, POT, { serverOnly: true }),
    single('huge-server-only', '.png', () => bigGrey(4100, 4100), 1, NO_POT, { serverOnly: true }),
    single('huge-pow2-server-only', '.png', () => bigGrey(4100, 4100), 1, POT, { serverOnly: true }),
    single('tiff16-rgbm-server-only', '.tif', () => tiff(16), 2, POT, { serverOnly: true }),

    // refreshing an existing target
    reupload('tga-reupload-refreshes-target', POT),

    // without related search the target is looked up in the source's folder (path-scoped)
    reupload('tga-unrelated-in-place-reupload', { texturePot: true, searchRelatedAssets: false }),

    // a source in a folder: the target is created beside it, and found there again
    {
        name: 'tga-in-folder',
        settings: POT,
        tolerance: { '<p>.jpeg': 'lossy' },
        run: async (page, p, driver) => {
            await tgaThenTarget(page, p, driver, await folder(page, `${p}-dir`));
        }
    },
    reupload('tga-in-folder-unrelated-reupload', { texturePot: true, searchRelatedAssets: false }, true),
    {
        name: 'tga-moved-target-related',
        settings: { texturePot: true, searchRelatedAssets: true },
        tolerance: { '<p>.jpeg': 'lossy' },
        run: async (page, p, driver) => {
            const target = await tgaThenTarget(page, p, driver);
            await move(page, target.id, await folder(page, `${p}-moved`));
            const done = await refreshed(page, target.id);
            await driver.upload(page, `${p}.tga`, TGA_AGAIN());
            await done();
            await settled(page, p, 3);
        }
    },
    {
        name: 'tga-moved-target-unrelated',
        settings: { texturePot: true, searchRelatedAssets: false },
        tolerance: { '<p>.jpeg': 'lossy' },
        run: async (page, p, driver) => {
            const target = await tgaThenTarget(page, p, driver);
            await move(page, target.id, await folder(page, `${p}-moved`));
            await driver.upload(page, `${p}.tga`, TGA_AGAIN());
            await settled(page, p, 4);
        }
    },
    {
        name: 'tga-renamed-target-reupload',
        settings: POT,
        tolerance: { '<p>.jpeg': 'lossy', '<p>-renamed.jpeg': 'lossy' },
        run: async (page, p, driver) => {
            await set(page, (await tgaThenTarget(page, p, driver)).id, 'name', `${p}-renamed.jpeg`);
            await driver.upload(page, `${p}.tga`, TGA_AGAIN());
            await settled(page, p, 3);
        }
    },
    {
        name: 'tga-renamed-target-reimport',
        settings: POT,
        tolerance: { '<p>-renamed.jpeg': 'lossy' },
        run: async (page, p, driver) => {
            await set(page, (await tgaThenTarget(page, p, driver)).id, 'name', `${p}-renamed.jpeg`);
            await reimport(page, p, driver, `${p}-renamed.jpeg`);
            await settled(page, p, 2);
        }
    },
    {
        name: 'png-reimport-after-pow2-on',
        settings: NO_POT,
        tolerance: { '<p>.png': 'resampled' },
        run: async (page, p, driver) => {
            await driver.upload(page, `${p}.png`, PNG_UNTOUCHED());
            await settled(page, p, 1);
            await pipelineSettings(page, POT);
            await reimport(page, p, driver, `${p}.png`);
            await settled(page, p, 1);
        }
    },

    // re-importing the source: its target is found by name and refreshed, or made again
    {
        name: 'tga-source-reimport-after-pow2-off',
        settings: POT,
        tolerance: { '<p>.jpeg': 'lossy' },
        run: async (page, p, driver) => {
            const done = await refreshed(page, (await tgaThenTarget(page, p, driver)).id);
            await pipelineSettings(page, NO_POT);
            await driver.reimport(page, `${p}.tga`);
            await done();
            await settled(page, p, 2);
        }
    },
    {
        name: 'tga-source-reimport-target-deleted',
        settings: POT,
        tolerance: { '<p>.jpeg': 'lossy' },
        run: async (page, p, driver) => {
            await remove(page, (await tgaThenTarget(page, p, driver)).id);
            await driver.reimport(page, `${p}.tga`);
            await settled(page, p, 2);
        }
    },

    // compression settings survive a refresh
    {
        name: 'tga-target-basis-reupload',
        settings: POT,
        tolerance: { '<p>.jpeg': 'lossy' },
        compress: true,
        run: async (page, p, driver) => {
            const target = await tgaThenTarget(page, p, driver);
            await set(page, target.id, 'meta.compress.basis', true);
            const done = await refreshed(page, target.id);
            await driver.upload(page, `${p}.tga`, TGA_AGAIN());
            await done();
            await settled(page, p, 2);
            await variant(page, p, target.id, 'basis');
        }
    },
    {
        name: 'png-in-place-basis-reupload',
        settings: POT,

        // the server compresses an in-place target too (texture-convert/app.js:688-707)
        compress: true,
        run: async (page, p, driver) => {
            await driver.upload(page, `${p}.png`, tex({ width: 16, height: 16, format: 'png' })());
            await settled(page, p, 1);
            const first = await find(page, `${p}.png`);
            await set(page, first.id, 'meta.compress.basis', true);
            await driver.upload(page, `${p}.png`, tex({ width: 16, height: 16, alpha: true, format: 'png' })());
            await changed(page, p, first.id, first.hash);
            await settled(page, p, 1);
            await variant(page, p, first.id, 'basis');
        }
    }
];
