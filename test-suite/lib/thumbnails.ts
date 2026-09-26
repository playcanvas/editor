import { crc32, deflateSync } from 'node:zlib';

import { expect, type Page } from '@playwright/test';

import { JOB_TIMEOUT, READY_TIMEOUT } from './constants';
import { AssetsPanel } from './pages/assets';
import { EditorShell } from './pages/common';

export type Rgb = [number, number, number];
export type Rgba = [number, number, number, number];

/** A colour expected at a point, in 0..1 image coordinates. */
export type Probe = { at: [number, number]; rgb: Rgb };

export type Size = 'xlarge' | 'large' | 'medium' | 'small';

type Key = 's' | 'm' | 'l' | 'xl';

export type Shot = {
    doc: Record<string, unknown>;
    fields: { has_thumbnail: boolean; thumbnails: Record<Key, string> };
    images: Record<Size, Buffer>;
};

// pipeline/jobs/texture-thumbnails/app.js dimensions, largest first
export const SIZES: Record<Size, number> = { xlarge: 512, large: 256, medium: 128, small: 64 };
export const SIZE_NAMES = Object.keys(SIZES) as Size[];

// editor-api asset.ts _resetThumbnailUrls keys
const KEYS: Record<Size, Key> = { xlarge: 'xl', large: 'l', medium: 'm', small: 's' };

// a probe reads a flat cell interior or a gradient centre, so only jpeg error is left
export const PROBE_TOL = 10;

export const OPAQUE: Rgba[] = [[220, 40, 40, 255], [40, 200, 60, 255], [30, 60, 210, 255], [128, 128, 128, 255]];
export const OPAQUE8: Rgba[] = [...OPAQUE, [250, 200, 40, 255], [40, 220, 220, 255], [200, 60, 200, 255], [20, 20, 20, 255]];

// transparent white must come out black: the job flattens onto #000
export const ALPHA: Rgba[] = [[255, 255, 255, 0], [200, 100, 50, 128], [40, 160, 220, 255], [255, 255, 255, 64]];

// dark enough that the rgbm decode doesn't clip every channel
export const RGBM: Rgba[] = [[16, 32, 8, 255], [24, 24, 24, 128], [4, 12, 20, 255], [0, 0, 0, 255]];

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const concat = (chunks: Buffer[]) => Buffer.concat(chunks.map(c => new Uint8Array(c)));

const chunk = (type: string, data: Buffer) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, 'ascii');
    out.set(data, 8);
    out.writeUInt32BE(crc32(new Uint8Array(out.subarray(4, 8 + data.length))), 8 + data.length);
    return out;
};

/** An 8-bit RGBA png with one colour per pixel from `pixel`. */
export const png = (width: number, height: number, pixel: (x: number, y: number) => Rgba) => {
    const stride = width * 4 + 1;
    const raw = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            raw.set(pixel(x, y), y * stride + 1 + x * 4);
        }
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 6;
    return concat([Buffer.from(SIGNATURE), chunk('IHDR', header), chunk('IDAT', deflateSync(new Uint8Array(raw))), chunk('IEND', Buffer.alloc(0))]);
};

/** `cols × rows` flat cells, row-major from `colours`. */
export const grid = (width: number, height: number, cols: number, rows: number, colours: Rgba[]) => png(width, height, (x, y) => colours[Math.floor(y * rows / height) * cols + Math.floor(x * cols / width)]);

/** Red ramps with x, green with y, blue is flat; with alpha, alpha ramps with x too. */
export const gradient = (width: number, height: number, alpha: boolean) => png(width, height, (x, y) => {
    const r = Math.round(x / (width - 1) * 255);
    return [r, Math.round(y / (height - 1) * 255), 96, alpha ? r : 255];
});

// readImage: flatten onto black
export const flat = ([r, g, b, a]: Rgba) => [r, g, b].map(v => Math.round(v * a / 255)) as Rgb;

// readImageRGBM: flatten, then min(1, ((v / 255) * 8) ^ 2 ^ (1 / 2.2)), truncated into a Buffer
export const rgbm = (c: Rgba) => flat(c).map(v => Math.floor(Math.min(1, (((v / 255) * 8) ** 2) ** (1 / 2.2)) * 255)) as Rgb;

/** The expected colour at each cell centre of a `grid`. */
export const cells = (cols: number, rows: number, colours: Rgba[], map: (c: Rgba) => Rgb = flat) => colours.map((c, i) => ({ at: [(i % cols + 0.5) / cols, (Math.floor(i / cols) + 0.5) / rows], rgb: map(c) }) satisfies Probe);

/** Resolves once the asset is in the registry with `has_thumbnail` and its thumbnail urls, and no task. */
export const waitThumbs = async (page: Page, id: number) => {
    const done = await new EditorShell(page).arm((assetId: number) => {
        const assets = window.editor.api.globals.assets;
        const events: { unbind(): void }[] = [];
        const dispose = () => events.forEach(e => e.unbind());
        const ready = (a: any) => a.get('has_thumbnail') === true && !!a.get('thumbnails.xl') && !a.get('task');
        const done = new Promise<void>((resolve) => {
            const watch = (a: any) => {
                const check = () => {
                    if (ready(a)) {
                        dispose();
                        resolve();
                    }
                };
                events.push(a.on('*:set', check), a.on('*:unset', check));
                check();
            };
            const existing = assets.get(assetId);
            if (existing) {
                watch(existing);
                return;
            }
            events.push(assets.on('add', (a: any) => {
                if (a.get('id') === assetId) {
                    watch(a);
                }
            }));
        });
        return { done, dispose };
    }, id, { what: `the thumbnails of asset ${id}`, timeout: JOB_TIMEOUT });
    await done();
};

/** Creates a texture through `assets:uploadFile` with `noConvert`, the path font atlases take. */
export const upload = async (page: Page, name: string, type: 'texture' | 'textureatlas', buffer: Buffer) => {
    const id = await page.evaluate(([name, type, b64]) => new Promise<number>((resolve, reject) => {
        const file = new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], name, { type: 'image/png' });
        const args = { name, type, file, filename: name, preload: true, noConvert: true };
        window.editor.call('assets:uploadFile', args, (err: string | null, data: { id: number }) => {
            return err ? reject(new Error(err)) : resolve(Number(data.id));
        });
    }), [name, type, buffer.toString('base64')] as const);
    await waitThumbs(page, id);
    return id;
};

/**
 * Sends exactly what `assets:uploadFile` sends today for a `noConvert` create
 * (`src/editor/assets/assets-upload.ts:110-119`: `preloadDefault` from project user settings,
 * inert here since `preload` is given, then `rest.assets.assetCreate(args, pipelineOptions())`),
 * bypassing that method entirely. The parity oracle: it keeps exercising the pre-switchover
 * request no matter what Task 8 wires into `assets:uploadFile` itself.
 */
export const oracleUpload = async (page: Page, name: string, type: 'texture' | 'textureatlas', buffer: Buffer) => {
    const id = await page.evaluate(([name, type, b64]) => new Promise<number>((resolve, reject) => {
        const file = new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], name, { type: 'image/png' });
        const pipeline = window.editor.call('assets:pipeline:options') as Record<string, unknown>;
        const preloadDefault = (window.editor.call('settings:projectUser') as any).get('editor.pipeline.defaultAssetPreload');
        window.editor.api.globals.rest.assets.assetCreate({ name, type, file, filename: name, preload: true, noConvert: true, preloadDefault } as any, pipeline)
        .on('load', (_status: number, data: { id: number }) => resolve(Number(data.id)))
        .on('error', (_status: number, data: string) => reject(new Error(data)));
    }), [name, type, buffer.toString('base64')] as const);
    await waitThumbs(page, id);
    return id;
};

/** Uploads through the panel: a supported texture converts in the editor (plan 04), anything else on the server; the server thumbnails both. */
export const uploadViaPanel = async (page: Page, name: string, buffer: Buffer) => {
    const assets = new AssetsPanel(page);
    await assets.armAdd({ name });
    await assets.upload({ name, mimeType: 'image/png', buffer });
    const { id } = await assets.awaitAdd({ name });
    await waitThumbs(page, id);
    return id;
};

/**
 * Sends what `uploadViaPanel` sent before plan 04, and still sends for a fallback input (a gif):
 * `assets:upload:files` hands `uploadFile` the panel's
 * current folder, whose `uploadToFolder` (`src/editor/assets/assets-upload.ts:215-222,300-311`)
 * passes these args (type from `textureDefaultToAtlas`, no `preload` or `filename`, so
 * `preloadDefault` decides `preload`) to `assets:uploadFile`, bypassed here. Never affected by
 * Task 8's wiring, since it never sets `noConvert`.
 */
export const oracleConvertUpload = async (page: Page, name: string, buffer: Buffer) => {
    const id = await page.evaluate(([name, b64]) => new Promise<number>((resolve, reject) => {
        const file = new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], name, { type: 'image/png' });
        const settings = window.editor.call('settings:projectUser') as any;
        const type = settings.get('editor.pipeline.textureDefaultToAtlas') ? 'textureatlas' : 'texture';
        const parent = window.editor.call('assets:panel:currentFolder');
        const args = { asset: null, file, type, name, parent, pipeline: true, data: null, meta: null, preloadDefault: settings.get('editor.pipeline.defaultAssetPreload') };
        window.editor.api.globals.rest.assets.assetCreate(args as any, window.editor.call('assets:pipeline:options') as Record<string, unknown>)
        .on('load', (_status: number, data: { id: number }) => resolve(Number(data.id)))
        .on('error', (_status: number, data: string) => reject(new Error(data)));
    }), [name, buffer.toString('base64')] as const);
    await waitThumbs(page, id);
    return id;
};

// cache-busted, the way the grid adds ?t= itself
const fetchThumb = async (page: Page, path: string) => {
    const res = await page.request.get(new URL(`${path}&t=${Date.now()}`, page.url()).href);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type'], path).toBe('image/jpeg');
    const body = await res.body();
    expect([...body.subarray(0, 3)], `${path} starts with a jpeg SOI`).toEqual([0xff, 0xd8, 0xff]);
    return body;
};

/** The asset document and its four thumbnails, as this page's user is served them. */
export const capture = async (page: Page, id: number) => {
    const { doc, fields } = await page.evaluate((assetId) => {
        const a = window.editor.api.globals.assets.get(assetId)!;
        return { doc: a.json() as Record<string, unknown>, fields: { has_thumbnail: a.get('has_thumbnail') as boolean, thumbnails: a.get('thumbnails') as Record<Key, string> } };
    }, id);
    const images = {} as Record<Size, Buffer>;
    for (const size of SIZE_NAMES) {
        images[size] = await fetchThumb(page, fields.thumbnails[KEYS[size]]);
    }
    return { doc, fields, images };
};

/** Resolves once the thumbnail at `path` differs from `before`, i.e. a regeneration has landed. */
export const waitChanged = async (page: Page, path: string, before: Buffer) => {
    await expect.poll(async () => !(await fetchThumb(page, path)).equals(new Uint8Array(before)), {
        message: `${path} to be regenerated`,
        timeout: JOB_TIMEOUT
    }).toBe(true);
};

/** Sets `data.rgbm` like the inspector does and returns the regenerated thumbnails. */
export const toggle = async (page: Page, id: number, on: boolean) => {
    const before = await capture(page, id);
    await page.evaluate(([assetId, value]) => {
        window.editor.api.globals.assets.get(assetId as number)!.set('data.rgbm', value);
    }, [id, on] as const);
    await waitChanged(page, before.fields.thumbnails.xl, before.images.xlarge);

    // has_thumbnail comes back true only once every size is written
    await waitThumbs(page, id);
    return capture(page, id);
};

/**
 * The pre-switchover regeneration, driven explicitly: exactly one `thumbnails` message per call,
 * before and after Task 8. It takes today's watcher (`assets-thumbnail-regen.ts:3-10`) out of the
 * way instead of racing it: observer `emit()` only checks `_suspendEvents` and `silent` only
 * silences history and `ObserverSync`, so no `set()` argument stops it. It works on the legacy
 * observer (`assets:get`), the object the watcher binds; the api `Asset` only receives the
 * observer's events as an added emitter and its `set()` drops `silent`. It drops that observer's
 * `data.rgbm:set` listeners (`ObserverSync` listens on `*:set`, untouched), then does the
 * watcher's work in the watcher's order (`data.rgbm:set` is emitted before the `*:set` that
 * submits the op): a silent local `has_thumbnail` reset and the message, then a plain `data.rgbm`
 * set that `ObserverSync` submits. Post-switchover the same unbind drops Task 8's watcher.
 */
export const oracleToggle = async (page: Page, id: number, on: boolean) => {
    const before = await capture(page, id);
    await page.evaluate(([assetId, value]) => {
        const asset = window.editor.call('assets:get', assetId) as any;
        asset.unbind('data.rgbm:set');
        asset.set('has_thumbnail', false, true);
        window.editor.call('realtime:send', 'pipeline', { name: 'thumbnails', data: { target: asset.get('id') } });
        asset.set('data.rgbm', value);
    }, [id, on] as const);
    await waitChanged(page, before.fields.thumbnails.xl, before.images.xlarge);

    // has_thumbnail was reset above, so this waits for the job's own op, sent after all four sizes
    await waitThumbs(page, id);
    return capture(page, id);
};

/** Decodes a jpeg in the page and averages a 5×5 box at each point. */
export const probe = (page: Page, jpeg: Buffer, points: [number, number][]) => page.evaluate(async ([b64, pts]) => {
    const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'image/jpeg' }));
    const { width, height } = bitmap;
    const ctx = new OffscreenCanvas(width, height).getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const px = ctx.getImageData(0, 0, width, height).data;
    const rgb = pts.map(([fx, fy]) => {
        const cx = Math.floor(fx * width);
        const cy = Math.floor(fy * height);
        const sum = [0, 0, 0];
        let n = 0;
        for (let y = Math.max(0, cy - 2); y <= Math.min(height - 1, cy + 2); y++) {
            for (let x = Math.max(0, cx - 2); x <= Math.min(width - 1, cx + 2); x++) {
                const i = (y * width + x) * 4;
                sum[0] += px[i];
                sum[1] += px[i + 1];
                sum[2] += px[i + 2];
                n++;
            }
        }
        return sum.map(v => Math.round(v / n));
    });
    return { width, height, rgb };
}, [jpeg.toString('base64'), points] as const);

/** Pins a shot to the job's contract: flag, url set, jpeg sizes and the expected colours. */
export const pin = async (page: Page, id: number, shot: Shot, probes: Probe[]) => {
    expect(shot.fields.has_thumbnail).toBe(true);
    for (const size of SIZE_NAMES) {
        expect(shot.fields.thumbnails[KEYS[size]]).toMatch(new RegExp(`^/api/assets/${id}/thumbnail/${size}\\?branchId=[\\w-]+$`));
        const got = await probe(page, shot.images[size], probes.map(p => p.at));
        expect({ width: got.width, height: got.height }, `${size} dimensions`).toEqual({ width: SIZES[size], height: SIZES[size] });
        got.rgb.forEach((rgb, i) => {
            const want = probes[i].rgb;
            const off = Math.max(...rgb.map((v, ch) => Math.abs(v - want[ch])));
            expect(off, `${size} probe ${i} at ${probes[i].at}: got ${rgb}, want ${want}`).toBeLessThanOrEqual(PROBE_TOL);
        });
    }
};

/** The asset's grid tile shows the medium thumbnail. */
export const expectGrid = async (page: Page, name: string) => {
    const img = new AssetsPanel(page).gridItem(name).locator('img').first();
    await expect(img).toHaveAttribute('src', /\/thumbnail\/medium\?branchId=/);
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => (el.complete ? el.naturalWidth : 0)), { timeout: READY_TIMEOUT }).toBe(128);
};
