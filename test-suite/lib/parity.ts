import { createHash } from 'node:crypto';

import { expect, test, type Page, type Request, type WebSocket } from '@playwright/test';
import { unzipSync } from 'fflate';

import { JOB_TEST_TIMEOUT } from './constants';
import { EditorShell } from './pages/common';
import { RUN_ID } from './utils';

/** Two scenario runs get twice a job test's budget. */
export const PARITY_TIMEOUT = 2 * JOB_TEST_TIMEOUT;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// e2e-<run>-w<worker>-<base>-<n>, the shape lib/utils uniqueName builds
const UNIQUE = new RegExp(`e2e-${escape(RUN_ID)}-w\\d+-(.+?)-\\d+(?![\\w-])`, 'g');
const VOLATILE = ['id', 'uniqueId', 'item_id', 'createdAt', 'modifiedAt', 'created_at', 'modified_at', 'task', 'taskInfo'];
const NOISE = ['auth', 'selection'];
const MIME: [string, (b: Buffer) => boolean][] = [
    ['image/png', b => b.readUInt32BE(0) === 0x89504e47],
    ['image/jpeg', b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
    ['image/webp', b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'],
    ['image/avif', b => b.toString('ascii', 4, 12) === 'ftypavif'],
    ['image/gif', b => b.toString('ascii', 0, 4) === 'GIF8'],
    ['image/bmp', b => b.toString('ascii', 0, 2) === 'BM']
];

const digest = (buf: Uint8Array) => `sha256:${createHash('sha256').update(buf).digest('hex')}:${buf.length}`;

const json = (v: unknown) => JSON.stringify(v, function (this: Record<string, unknown>, k: string, x: unknown) {
    const raw = this[k];
    return raw instanceof Uint8Array ? digest(raw) : x;
}, 4);

/** Deep copy with run-unique names cut to `<base>` and bytes cut to a digest. */
export const scrub: (v: unknown) => unknown = (v) => {
    if (typeof v === 'string') {
        return v.replace(UNIQUE, '<$1>');
    }
    if (v instanceof Uint8Array) {
        return digest(v);
    }
    if (Array.isArray(v)) {
        return v.map(scrub);
    }
    if (v && typeof v === 'object') {
        return Object.fromEntries(Object.entries(v).map(([k, x]) => [k.replace(UNIQUE, '<$1>'), scrub(x)]));
    }
    return v;
};

/** An asset's json with everything that differs between two identical creates normalized away. */
export const normalizeAsset = (asset: Record<string, unknown>) => {
    const out = scrub(asset) as Record<string, unknown>;
    VOLATILE.forEach(k => delete out[k]);
    if (out.file && typeof out.file === 'object') {
        const file = out.file as Record<string, unknown>;
        delete file.url;
        Object.values(file.variants ?? {}).forEach((v) => {
            if (v && typeof v === 'object') {
                delete (v as Record<string, unknown>).url;
            }
        });
    }
    if (out.thumbnails && typeof out.thumbnails === 'object') {
        out.thumbnails = Object.fromEntries(Object.keys(out.thumbnails).map(k => [k, '<url>']));
    }
    if (Array.isArray(out.path)) {
        out.path = out.path.map(() => '<folder>');
    }
    if (out.source_asset_id !== undefined && out.source_asset_id !== null) {
        out.source_asset_id = '<source>';
    }
    return out;
};

/**
 * The subtree under `rootId` in pre-order, with its resource ids (as values or keys, anywhere in
 * the entity) swapped for `<eN>` tokens and the root's parent for `<parent>`. Ids outside the
 * subtree stay raw.
 */
export const normalizeTree = (entities: Record<string, unknown>[], rootId: string) => {
    const byId = new Map(entities.map(e => [e.resource_id as string, e]));
    const order: Record<string, unknown>[] = [];
    const walk = (id: string, parent?: string) => {
        const e = byId.get(id);
        if (!e) {
            throw new Error(parent ? `entity ${id} (child of ${parent}) is not in the list` : `entity ${id} is not in the list`);
        }
        order.push(e);
        ((e.children ?? []) as string[]).forEach(child => walk(child, id));
    };
    walk(rootId);

    const ids = new Map(order.map((e, i) => [e.resource_id as string, `<e${i}>`]));
    const remap: (v: unknown) => unknown = (v) => {
        if (typeof v === 'string') {
            return ids.get(v) ?? v;
        }
        if (Array.isArray(v)) {
            return v.map(remap);
        }
        if (v && typeof v === 'object') {
            return Object.fromEntries(Object.entries(v).map(([k, x]) => [ids.get(k) ?? k, remap(x)]));
        }
        return v;
    };
    const out = order.map(remap) as Record<string, unknown>[];
    if (typeof order[0].parent === 'string' && order[0].parent) {
        out[0].parent = '<parent>';
    }
    return scrub(out);
};

/** Every entry of a zip, keyed by its path inside the archive. */
export const readZip = (buf: Buffer) => Object.fromEntries(Object.entries(unzipSync(new Uint8Array(buf))).map(([k, v]) => [k, Buffer.from(v)]));

export type Mode = 'server' | 'client';

export type ParityRun<T> = { page: Page; run: (spy: ServerSpy) => Promise<T> };

type Upload = { method: string; url: string; fields: Record<string, string> };

export type ServerSpy = {
    /** realtime `pipeline` messages; `data` is the whole payload, `name` included */
    pipeline: () => Promise<{ name: string; data: unknown }[]>;
    /** prefixes of the other realtime commands, e.g. `fs`, `doc:save:`, `cubemap:clear:` */
    frames: () => Promise<string[]>;
    /** multipart asset creates/updates sent from the page, string fields only */
    uploads: () => Promise<Upload[]>;
    /** every api request in the page's browser context, path plus query */
    requests: () => Promise<{ method: string; url: string }[]>;
    stop: () => Promise<void>;
};

const prefix = (data: string) => data.match(/^[a-z]+(?::[a-z]+)*:?/i)?.[0];

/**
 * Compares normalized server/client results, removing project additions between runs.
 * Scenarios must finish their work and restore edits to existing data/settings themselves.
 */
export const parity = async <T>(runs: Record<Mode, ParityRun<T>>, opts: { normalize?: (v: T) => unknown } = {}) => {
    const norm = (v: T) => scrub(opts.normalize ? opts.normalize(v) : v);
    const once = async (mode: Mode) => {
        const { page, run } = runs[mode];
        const shell = new EditorShell(page);
        const state = await shell.snapshot();
        const errors: unknown[] = [];
        const result = await spyServerWork(page).then(spy => Promise.resolve()
        .then(() => run(spy)).finally(() => spy.stop().catch(error => errors.push(error)))
        ).then(async (result) => {
            await test.info().attach(`parity-${mode}.json`, { body: json(result), contentType: 'application/json' });
            return result;
        }).catch((error) => {
            errors.unshift(error);
        }).finally(() => shell.restore(state).catch(error => errors.push(error)));
        if (errors.length) {
            throw errors.length === 1 ? errors[0] : new AggregateError(errors, `${mode}: scenario or cleanup failed`);
        }
        return result as T;
    };

    const res = { server: await once('server'), client: await once('client') };
    expect(norm(res.client), 'the client result differs from the server\'s').toEqual(norm(res.server));
    return res;
};

let spies = 0;

/**
 * Starts recording the work the page hands the backend. The page's own realtime and upload
 * traffic is wrapped in the page, since its socket predates the spy; pages opened later are
 * followed through playwright.
 */
export const spyServerWork = async (page: Page) => {
    const key = `spy${++spies}`;
    const context = page.context();

    // apiUrl may be relative on some stacks, so resolve it once against the page
    const api = await page.evaluate(() => new URL(window.editor.api.globals.apiUrl, location.href).href.replace(/\/$/, ''));
    const requests: { method: string; url: string }[] = [];
    const later: string[] = [];
    const detach: (() => void)[] = [];
    let saved = { sent: [] as string[], forms: [] as Upload[] };
    let stopped: Promise<void> | undefined;
    let live = true;

    const onRequest = (req: Request) => {
        if (live && req.url().startsWith(api)) {
            const u = new URL(req.url());
            requests.push({ method: req.method(), url: u.pathname + u.search });
        }
    };
    const onPage = (p: Page) => {
        const onSocket = (ws: WebSocket) => {
            const onFrame = ({ payload }: { payload: string | Buffer }) => {
                if (live && typeof payload === 'string') {
                    later.push(payload);
                }
            };
            ws.on('framesent', onFrame);
            detach.push(() => ws.off('framesent', onFrame));
        };
        p.on('websocket', onSocket);
        detach.push(() => p.off('websocket', onSocket));
    };
    context.on('request', onRequest);
    context.on('page', onPage);

    await page.evaluate(({ key, api }) => {
        const w = window as any;
        if (!w.__parity) {
            const spies = new Map<string, { live: boolean; sent: string[]; forms: Upload[] }>();
            const each = (fn: (s: { sent: string[]; forms: Upload[] }) => void) => spies.forEach(s => s.live && fn(s));

            const conn = w.editor.api.globals.realtime.connection;
            const send = conn.send;
            conn.send = function (this: unknown, data: string) {
                each(s => s.sent.push(data));
                return send.call(this, data);
            };

            const xhr = XMLHttpRequest.prototype;
            const { open, send: post } = xhr;
            const targets = new WeakMap<XMLHttpRequest, { method: string; url: URL }>();

            // cast: open and send are overloaded, and these wrappers take every overload
            (xhr as any).open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: any[]) {
                targets.set(this, { method: method.toUpperCase(), url: new URL(url, location.href) });
                return (open as any).call(this, method, url, ...rest);
            };
            (xhr as any).send = function (this: XMLHttpRequest, body?: Parameters<XMLHttpRequest['send']>[0]) {
                const t = targets.get(this);
                if (t && body instanceof FormData && t.url.href.startsWith(`${api}/assets`)) {
                    const fields: Record<string, string> = {};
                    body.forEach((v, k) => {
                        if (typeof v === 'string') {
                            fields[k] = v;
                        }
                    });
                    each(s => s.forms.push({ method: t.method, url: t.url.pathname + t.url.search, fields }));
                }
                return post.call(this, body);
            };
            w.__parity = spies;
        }
        w.__parity.set(key, { live: true, sent: [], forms: [] });
    }, { key, api }).catch((error) => {
        live = false;
        context.off('request', onRequest);
        context.off('page', onPage);
        detach.forEach(off => off());
        throw error;
    });

    const read = () => (stopped ? stopped.then(() => saved) : page.evaluate((key) => {
        const s = (window as any).__parity?.get(key);
        return s ? { sent: [...s.sent] as string[], forms: [...s.forms] as Upload[] } : { sent: [], forms: [] };
    }, key));

    const spy: ServerSpy = {
        pipeline: async () => (await read()).sent.filter(d => d.startsWith('pipeline')).map((d) => {
            const data = JSON.parse(d.slice('pipeline'.length));
            return { name: data.name as string, data: data as unknown };
        }),
        frames: async () => [...(await read()).sent, ...later]
        .filter(d => !d.startsWith('{') && !d.startsWith('pipeline'))
        .map(prefix)
        .filter((p): p is string => !!p && !NOISE.includes(p)),
        uploads: async () => (await read()).forms.filter(f => f.method === 'POST' || f.method === 'PUT'),
        requests: () => Promise.resolve([...requests]),
        stop: () => {
            if (stopped) {
                return stopped;
            }
            live = false;
            context.off('request', onRequest);
            context.off('page', onPage);
            detach.forEach(off => off());
            detach.length = 0;

            // freeze before releasing the buffer; navigation may have discarded it
            stopped = page.evaluate((key) => {
                const spies = (window as any).__parity;
                const s = spies?.get(key);
                spies?.delete(key);
                return s ? { sent: s.sent as string[], forms: s.forms as Upload[] } : { sent: [], forms: [] };
            }, key).then((result) => {
                saved = result;
            }).catch(() => {});
            return stopped;
        }
    };
    return spy;
};

/** The bytes of an asset's file, or of one of its variants, through the file route. */
export const fetchFile = async (page: Page, assetId: number, variant?: string) => {
    const b64 = await page.evaluate(async ({ id, variant }) => {
        const globals = window.editor.api.globals as any;
        const asset = globals.assets.get(id);
        if (!asset) {
            throw new Error(`asset ${id} not found`);
        }
        const file = asset.get(variant ? `file.variants.${variant}` : 'file');
        if (!file?.filename && !file?.url) {
            throw new Error(`asset ${id} has no ${variant ?? 'main'} file`);
        }

        // variants live beside the main file; the file route serves the main one by name
        const url = variant && file.url ? file.url : `/api/assets/${id}/file/${encodeURIComponent(file.filename)}?branchId=${globals.branchId}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`GET ${url} answered ${res.status}`);
        }
        const bytes = new Uint8Array(await res.arrayBuffer());
        let s = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        return btoa(s);
    }, { id: assetId, variant });
    return Buffer.from(b64, 'base64');
};

export type ImageInfo = { width: number; height: number; alpha: boolean; mime: string };

const mime = (b: Buffer) => {
    const hit = MIME.find(([, is]) => b.length >= 12 && is(b));
    if (!hit) {
        throw new Error(`not an image the browser decodes (starts ${b.subarray(0, 8).toString('hex')})`);
    }
    return hit[0];
};

/**
 * Decodes without premultiplying or colour-converting, then compares RGBA bytes.
 * RGB under partial alpha is only as exact as the 2d canvas round trip.
 */
export const imageDiff = (page: Page, a: Buffer, b: Buffer) => page.evaluate(async (imgs) => {
    const decode = async ({ data, mime }: { data: string; mime: string }) => {
        const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const bmp = await createImageBitmap(new Blob([bytes], { type: mime }), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
        const { width, height } = bmp;
        const ctx = new OffscreenCanvas(width, height).getContext('2d')!;
        ctx.drawImage(bmp, 0, 0);
        const px = ctx.getImageData(0, 0, width, height).data;
        bmp.close();
        let alpha = false;
        for (let i = 3; i < px.length && !alpha; i += 4) {
            alpha = px[i] < 255;
        }
        return { info: { width, height, alpha, mime }, px };
    };
    const [x, y] = await Promise.all(imgs.map(decode));
    if (x.info.width !== y.info.width || x.info.height !== y.info.height) {
        return { a: x.info, b: y.info, mad: Infinity, max: Infinity };
    }
    let sum = 0;
    let max = 0;
    for (let i = 0; i < x.px.length; i++) {
        const d = Math.abs(x.px[i] - y.px[i]);
        sum += d;
        max = Math.max(max, d);
    }
    return { a: x.info, b: y.info, mad: sum / x.px.length, max };
}, [a, b].map(buf => ({ data: buf.toString('base64'), mime: mime(buf) })));
