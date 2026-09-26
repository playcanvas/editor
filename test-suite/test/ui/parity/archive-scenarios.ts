import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { expect, type Download, type Page } from '@playwright/test';
import { unzipSync } from 'fflate';

import { arm } from '../../../lib/arm';
import { JOB_TIMEOUT } from '../../../lib/constants';
import { AssetWorkflows } from '../../../lib/pages/asset-workflows';
import { AssetsPanel } from '../../../lib/pages/assets';
import { fetchFile, readZip } from '../../../lib/parity';
import { uniqueName } from '../../../lib/utils';
import { model, texture } from '../../fixtures/assets';

const FONT = readFileSync(new URL('../../fixtures/files/courier-prime.ttf', import.meta.url));

// the 14 maps pipeline/jobs/{material,model}-archive rewrite; any other map stays a raw id
const TEXTURE_PROPERTIES = [
    'aoMap',
    'diffuseMap',
    'specularMap',
    'metalnessMap',
    'glossMap',
    'clearCoatMap',
    'clearCoatGlossMap',
    'clearCoatNormalMap',
    'emissiveMap',
    'normalMap',
    'heightMap',
    'opacityMap',
    'sphereMap',
    'lightMap'
];

// an id no asset has, for the jobs' missing-reference branches
const MISSING = 2147483647;

const PIPELINE = ['editor.pipeline.useGlb', 'editor.pipeline.useContainers'];

export const CUBEMAP_PREFILTERED = 'prefiltered cubemap with repeated faces';

export type Entry = { path: string; json?: unknown; file?: { id: number; filename: string }; bytes?: Buffer };
/** Unused: public reuploads overwrite revision 1, so no scenario can reach a stale historical revision. */
export type Stale = { path: string; server: Buffer; client: Buffer };
export type Fixture = { id: number; item: string; zip: string; entries: Entry[]; browserZip?: string; clientZip?: string; stale?: Stale[] };
export type Archive = { name: string; entries: Map<string, Buffer>; names: string[] };

type Tex = { id: number; name: string; filename: string };

export const sha = (buf: Buffer) => createHash('sha256').update(new Uint8Array(buf)).digest('hex');

// the jobs sanitize persisted names before deriving archive paths; the public api rejects names
// this would change, so no scenario feeds it one and its stripping is unverified
const sanitize = (s: string) => s
.replace(/[/?<>\\:*|"]/g, '')
.replace(/^\.+$/, '')
.replace(/[. ]+$/, '');

// font-archive's `f.slice(0, -path.extname(f).length)`: an extensionless name becomes ''
const jobStrip = (s: string) => {
    const i = s.lastIndexOf('.');
    return i > 0 ? s.slice(0, i) : '';
};

// model-archive tests '.glb' lowercased but strips it case-sensitively, else strips '.json'
const modelBase = (name: string) => {
    const ext = name.toLowerCase().endsWith('.glb') ? '.glb' : '.json';
    return sanitize(name.endsWith(ext) && name !== ext ? name.slice(0, -ext.length) : name);
};

// what both material jobs write: maps and cubeMap become zip paths or are dropped, and
// model-archive (pruneAll) also drops every other falsy field
const materialJson = (data: Record<string, any>, paths: Map<unknown, string>, pruneAll: boolean) => {
    const out: Record<string, any> = structuredClone(data);
    for (const key of Object.keys(out)) {
        const ref = TEXTURE_PROPERTIES.includes(key) || key === 'cubeMap';
        if (ref && paths.has(out[key])) {
            out[key] = paths.get(out[key]);
        } else if (ref || (pruneAll && !out[key])) {
            delete out[key];
        }
    }
    out.mapping_format = 'path';
    return out;
};

const texPaths = (ts: Tex[]) => new Map<unknown, string>(ts.map(t => [t.id, `../${t.id}/${t.filename}`]));

const field = (page: Page, id: number, path: string) => new AssetsPanel(page).field(id, path) as Promise<any>;

const fileOf = async (page: Page, id: number) => ({ id, filename: (await field(page, id, 'file.filename')) as string });

// the jobs read mongo, so wait for every op to reach the server before downloading
const setData = async (page: Page, id: number, data: Record<string, unknown>) => {
    await page.evaluate(({ id, data }) => {
        const asset = window.editor.api.globals.assets.get(id)!;
        for (const [key, value] of Object.entries(data)) {
            asset.set(`data.${key}`, value);
        }
    }, { id, data });
    await new AssetsPanel(page).flush(id);
    for (const [key, value] of Object.entries(data)) {
        expect(await field(page, id, `data.${key}`), `${id}: data.${key} persisted`).toEqual(value);
    }
};

// texture.convert and texture.thumbnails still write after the upload clears task; has_thumbnail lands last
const thumbnailed = (page: Page, id: number) => arm(page, (id: number) => {
    const asset = window.editor.api.globals.assets.get(id)!;
    const events: { unbind(): void }[] = [];
    const done = new Promise<void>((resolve, reject) => {
        const check = () => {
            if (asset.get('task') === 'failed') {
                reject(new Error(`texture ${id} failed: ${asset.get('taskInfo') || 'pipeline task failed'}`));
            } else if (asset.get('has_thumbnail') === true && !asset.get('task')) {
                resolve();
            }
        };
        events.push(asset.on('*:set', check), asset.on('*:unset', check));
        check();
    });
    return { done, dispose: () => events.forEach(e => e.unbind()) };
}, id, { what: `the thumbnail of texture ${id}`, timeout: JOB_TIMEOUT });

const upTexture = async (page: Page, width: number) => {
    const assets = new AssetsPanel(page);
    const t = await assets.uploadFile({
        name: `${uniqueName('tex')}.png`,
        type: 'texture',
        mimeType: 'image/png',
        buffer: texture({ width, height: width, alpha: true, format: 'png' })
    });
    await assets.waitForTask(t.id, JOB_TIMEOUT);
    await (await thumbnailed(page, t.id))();
    return { ...t, filename: (await field(page, t.id, 'file.filename')) as string };
};

/**
 * Resolves with a model's mapping once every mapped material is registered and converted.
 * scene.convert maps them only after model.convert has already cleared the model's task.
 */
const mappedMaterials = (page: Page, id: number) => arm<{ material: number }[]>(page, (id: number) => {
    const assets = window.editor.api.globals.assets;
    const events: { unbind(): void }[] = [];
    const seen = new Set<unknown>();
    const done = new Promise<{ material: number }[]>((resolve, reject) => {
        const check = () => {
            const model = assets.get(id);
            const mapping = (model?.get('data.mapping') ?? []) as { material: number | null }[];
            const mats = mapping.map(m => (m.material ? assets.get(m.material) : null));
            for (const a of [model, ...mats]) {
                if (a && !seen.has(a)) {
                    seen.add(a);
                    events.push(a.on('*:set', check), a.on('*:unset', check));
                }
            }
            const failed = [model, ...mats].find(a => a?.get('task') === 'failed');
            if (failed) {
                reject(new Error(`asset ${failed.get('id')} failed: ${failed.get('taskInfo') || 'pipeline task failed'}`));
            } else if (mapping.length && mats.every(m => m && !m.get('task') && m.get('data'))) {
                resolve(mapping as { material: number }[]);
            }
        };
        events.push(assets.on('add', check));
        check();
    });
    return { done, dispose: () => events.forEach(e => e.unbind()) };
}, id, { what: `the materials mapped by model ${id}`, timeout: JOB_TIMEOUT });

const cubemap = async (page: Page, name: string, faces: (number | null)[], prefilter: boolean) => {
    const assets = new AssetsPanel(page);
    const cube = await assets.create('createCubemap', { name });
    await setData(page, cube.id, { textures: faces });
    if (prefilter) {
        await page.evaluate((id) => {
            const app = window.editor.call('viewport:app') as any;
            const asset = app.assets.get(id);
            if (!asset) {
                throw new Error(`cubemap ${id} is missing from the viewport registry`);
            }
            asset.loadFaces = true;
            app.assets.load(asset);
        }, cube.id);
        await page.waitForFunction(id => (window.editor.call('viewport:app') as any).assets.get(id)?.resource, cube.id, { timeout: JOB_TIMEOUT });
        await (await arm(page, (id: number) => ({
            done: new Promise<void>((resolve, reject) => {
                window.editor.call('assets:cubemaps:prefilter', window.editor.call('assets:get', id), false, (err: unknown) => (err ? reject(new Error(String(err))) : resolve()));
            })
        }), cube.id, { what: `the prefilter of cubemap ${cube.id}`, timeout: JOB_TIMEOUT }))();
        await assets.waitForTask(cube.id, JOB_TIMEOUT);
        cube.name = await field(page, cube.id, 'name');
    }
    return cube;
};

// the cubemap json as cubemap-archive writes it (and material/model-archive for a referenced cubemap)
const cubemapEntries = async (page: Page, id: number, name: string, paths: Map<unknown, string>) => {
    const data = structuredClone(await field(page, id, 'data'));
    data.textures = data.textures.map((t: unknown) => (t && paths.get(t)) || t);
    const file = await field(page, id, 'file');
    const entries: Entry[] = [];
    if (file) {
        data.prefiltered = file.filename;
        entries.push({ path: `${id}/${file.filename}`, file: { id, filename: file.filename } });
    }
    entries.push({ path: `${id}/${sanitize(name)}.json`, json: data });
    return entries;
};

const texEntries = (ts: Tex[]) => ts.map(t => ({ path: `${t.id}/${t.filename}`, file: t }));

/** Reads, and optionally changes, the project user's model import settings. */
export const importSettings = (page: Page, next?: Record<string, unknown>) => page.evaluate(({ keys, next }) => {
    const settings = window.editor.call('settings:projectUser') as any;
    const prev = Object.fromEntries(keys.map(k => [k, settings.get(k)]));
    for (const [k, v] of Object.entries(next ?? {})) {
        if (v === undefined) {
            settings.unset(k);
        } else {
            settings.set(k, v);
        }
    }
    return prev;
}, { keys: PIPELINE, next });

/** Changes file.size in this tab only (sync and history off), so the size cap trips while the server copy stays intact. */
export const localSize = (page: Page, id: number, size: number) => page.evaluate(({ id, size }) => {
    const asset = window.editor.api.globals.assets.get(id)!.observer;
    const prev = asset.get('file.size') as number;
    const sync = asset.sync.enabled;
    const history = asset.history.enabled;
    asset.sync.enabled = false;
    asset.history.enabled = false;
    asset.set('file.size', size);
    asset.history.enabled = history;
    asset.sync.enabled = sync;
    return prev;
}, { id, size });

/** The zip name the server route sets, before the browser applies its own filename rules. */
export const serverZipName = (page: Page, id: number) => page.evaluate(async (id) => {
    const branch = (window as any).config.self.branch.id;
    const res = await fetch(`/api/assets/${id}/download?branchId=${branch}`);
    if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`archive ${id} answered ${res.status}`);
    }
    const header = res.headers.get('content-disposition') ?? '';
    await res.body?.cancel();
    return decodeURIComponent(header.split('\'\'')[1] ?? '');
}, id);

// entries (deduped) plus the raw, pre-dedup entry names (a repeated path only shows up in names)
const parseZip = (buf: Buffer) => {
    const entries = new Map(Object.entries(readZip(buf)));

    // archiver can include empty directory records
    for (const [path, bytes] of entries) {
        if (path.endsWith('/') && bytes.length === 0) {
            entries.delete(path);
        }
    }

    // readZip keys by path, so a repeated entry only shows up in the raw record names
    const names: string[] = [];
    unzipSync(new Uint8Array(buf), {
        filter: (f) => {
            if (!(f.name.endsWith('/') && f.originalSize === 0)) {
                names.push(f.name);
            }
            return false;
        }
    });
    return { entries, names };
};

// mirrors today's assets-download.ts window.open GET (assets-download.ts:24), minus the popup
export const serverArchive = (page: Page, id: number) => page.evaluate(async (id) => {
    const branch = (window as any).config.self.branch.id;
    const res = await fetch(`/api/assets/${id}/download?branchId=${branch}`);
    if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`archive ${id} answered ${res.status}`);
    }
    const header = res.headers.get('content-disposition') ?? '';
    const bytes = new Uint8Array(await res.arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return { name: decodeURIComponent(header.split('\'\'')[1] ?? ''), b64: btoa(s) };
}, id).then(({ name, b64 }) => ({ name, ...parseZip(Buffer.from(b64, 'base64')) }));

/**
 * Right-clicks the (non-source) grid item, picks Download and captures the zip. The client path
 * saves from the editor tab; the server path opens a popup whose response is the download.
 */
export const download = async (page: Page, item: string) => {
    const popups: Page[] = [];
    const errors: unknown[] = [];
    let receive: (download: Download) => void;
    let timer: ReturnType<typeof setTimeout>;
    const pending = new Promise<Download>((resolve, reject) => {
        receive = resolve;
        timer = setTimeout(() => reject(new Error('archive download timed out')), JOB_TIMEOUT);
    }).then(got => ({ got }), error => ({ error }));
    const onDownload = (got: Download) => receive(got);
    const onPopup = (popup: Page) => {
        popups.push(popup);
        popup.on('download', onDownload);
    };
    page.on('download', onDownload);
    page.context().on('page', onPopup);
    const assets = new AssetsPanel(page);
    const result = await Promise.resolve().then(async () => {
        await assets.gridItem(item)
        .and(page.locator(':is(.type-material, .type-model, .type-cubemap, .type-font):not(.pcui-asset-grid-view-item-source)'))
        .click({ button: 'right' });
        await assets.shell.menuItem('Download').click();
        const outcome = await pending;
        if ('error' in outcome) {
            throw outcome.error;
        }
        const got = outcome.got;
        const buf = await readFile((await got.path())!);
        return { name: got.suggestedFilename(), ...parseZip(buf) };
    }).catch(error => errors.push(error)).finally(async () => {
        clearTimeout(timer);
        page.off('download', onDownload);
        page.context().off('page', onPopup);
        for (const popup of popups) {
            popup.off('download', onDownload);
            await popup.close().catch(error => errors.push(error));
        }
    });
    if (errors.length) {
        throw errors.length === 1 ? errors[0] : new AggregateError(errors, 'archive download or cleanup failed');
    }
    return result as Archive;
};

const legacyFont = async (page: Page, name: string) => {
    const assets = new AssetsPanel(page);
    const filename = `${uniqueName('legacy')}.png`;
    const data = { info: { face: 'Legacy', width: 64, height: 64 }, chars: { 65: { id: 65, letter: 'A' } } };
    await assets.armAdd({ name });

    // noConvert: a png uploaded as a font would otherwise queue pipeline.font.convert, which no job handles
    await page.evaluate(
        async ({ b64, name, filename, data }) => {
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const file = new File([bytes], filename, { type: 'image/png' });
            await window.editor.api.globals.rest.assets
            .assetCreate({ type: 'font', name, filename, file, data, noConvert: true })
            .promisify();
        },
        { b64: texture({ width: 64, height: 64, alpha: true, format: 'png' }).toString('base64'), name, filename, data }
    );
    const font = await assets.awaitAdd({ name });
    await assets.waitForTask(font.id, JOB_TIMEOUT);
    const uid = await field(page, font.id, 'uniqueId');
    const base = jobStrip(sanitize(await field(page, font.id, 'file.filename')));
    return {
        id: font.id,
        item: name,
        zip: `${jobStrip(sanitize(name))}.zip`,
        entries: [
            { path: `${uid}/${base}.png`, file: await fileOf(page, font.id) },
            { path: `${uid}/${base}.json`, json: await field(page, font.id, 'data') }
        ]
    } as Fixture;
};

const legacyModel = async (page: Page, glb: boolean) => {
    const prev = await importSettings(page, { 'editor.pipeline.useGlb': glb, 'editor.pipeline.useContainers': false });
    const errors: unknown[] = [];
    const result = await new AssetWorkflows(page).upload(
        { name: `${uniqueName('legacy')}.glb`, mimeType: 'model/gltf-binary', buffer: model() },
        ['model']
    ).catch(error => errors.push(error)).finally(() => importSettings(page, prev).catch(error => errors.push(error)));
    if (errors.length) {
        throw errors.length === 1 ? errors[0] : new AggregateError(errors, 'model import or settings restoration failed');
    }
    const [asset] = result as { id: number; name: string }[];
    const mapping = await (await mappedMaterials(page, asset.id))();
    const mat = mapping[0].material;
    const t = await upTexture(page, 32);
    await setData(page, mat, { diffuseMap: t.id, opacity: 0, useMetalness: false });

    // a mesh whose material is gone maps to path: null
    await setData(page, asset.id, { mapping: [...mapping, { material: MISSING }] });

    const matName = (await field(page, mat, 'name')) as string;
    const matPath = `${mat}/${sanitize(matName || 'Untitled')}.json`;
    const data = structuredClone(await field(page, asset.id, 'data'));
    data.mapping = data.mapping.map(({ material, ...rest }: { material: number }) => ({
        ...rest,
        path: material === mat ? matPath : null
    }));
    const file = await fileOf(page, asset.id);
    return {
        id: asset.id,
        item: asset.name,
        zip: `${modelBase(asset.name)}.zip`,
        entries: [
            { path: `${modelBase(asset.name)}.mapping.json`, json: data },
            { path: matPath, json: materialJson(await field(page, mat, 'data'), texPaths([t]), true) },
            ...texEntries([t]),
            { path: file.filename, file }
        ]
    } as Fixture;
};

export const SCENARIOS: { title: string; build: (page: Page) => Promise<Fixture> }[] = [
    {
        title: CUBEMAP_PREFILTERED,
        build: async (page) => {
            const a = await upTexture(page, 64);
            const b = await upTexture(page, 64);
            const cube = await cubemap(page, uniqueName('Sky'), [a.id, a.id, b.id, b.id, a.id, b.id], true);
            return {
                id: cube.id,
                item: cube.name,
                zip: `${sanitize(cube.name)}.zip`,
                entries: [...texEntries([a, b]), ...(await cubemapEntries(page, cube.id, cube.name, texPaths([a, b])))]
            };
        }
    },
    {
        title: 'plain cubemap with null and missing faces and a Unicode name',
        build: async (page) => {
            const a = await upTexture(page, 16);
            const cube = await cubemap(page, uniqueName('Ský #day'), [a.id, null, a.id, MISSING, null, null], false);
            return {
                id: cube.id,
                item: cube.name,
                zip: `${sanitize(cube.name)}.zip`,
                browserZip: 'download',
                entries: [...texEntries([a]), ...(await cubemapEntries(page, cube.id, cube.name, texPaths([a])))]
            };
        }
    },
    {
        title: 'material with every map, a missing map, a cubemap and falsy fields',
        build: async (page) => {
            const ts = [await upTexture(page, 16), await upTexture(page, 32), await upTexture(page, 64)];
            const cube = await cubemap(page, uniqueName('Env'), Array(6).fill(ts[2].id), true);
            const mat = await new AssetsPanel(page).create('createMaterial', { name: uniqueName('Stähl #v2') });
            const maps = Object.fromEntries(TEXTURE_PROPERTIES.map((k, i) => [k, ts[i % 3].id]));
            await setData(page, mat.id, {
                ...maps,
                normalMap: MISSING,
                opacityMap: null,
                cubeMap: cube.id,
                sheenMap: ts[0].id,
                opacity: 0,
                useMetalness: false
            });
            const paths = texPaths(ts);
            paths.set(cube.id, `../${cube.id}/${sanitize(cube.name)}.json`);
            return {
                id: mat.id,
                item: mat.name,
                zip: `${sanitize(mat.name)}.zip`,
                browserZip: 'download',
                entries: [
                    { path: `${mat.id}/${sanitize(mat.name)}.json`, json: materialJson(await field(page, mat.id, 'data'), paths, false) },
                    ...(await cubemapEntries(page, cube.id, cube.name, texPaths(ts))),
                    ...texEntries(ts)
                ]
            };
        }
    },
    {
        // pins the in-place overwrite of revision 1: public reuploads never leave a stale historical
        // revision behind, so deviation 2 (archive reads revision 1) is not reachable here
        title: 'material whose texture was re-uploaded',
        build: async (page) => {
            const assets = new AssetsPanel(page);
            const t = await upTexture(page, 16);
            const mat = await assets.create('createMaterial', { name: uniqueName('Rev') });
            await setData(page, mat.id, { diffuseMap: t.id });
            const rev1 = await fetchFile(page, t.id);
            expect(await field(page, t.id, 'revision')).toBe(1);
            await page.evaluate(
                async ({ id, filename, b64 }) => {
                    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                    await window.editor.api.globals.assets.upload({
                        id,
                        type: 'texture',
                        filename,
                        file: new Blob([bytes], { type: 'image/png' })
                    } as any);
                },
                { id: t.id, filename: t.filename, b64: texture({ width: 32, height: 32, alpha: true, format: 'png' }).toString('base64') }
            );
            await assets.waitForTask(t.id, JOB_TIMEOUT);
            const now = await fetchFile(page, t.id);
            expect(await field(page, t.id, 'revision')).toBe(1);
            if (sha(now) === sha(rev1)) {
                throw new Error('texture re-upload did not change its bytes');
            }
            const path = `${t.id}/${t.filename}`;
            return {
                id: mat.id,
                item: mat.name,
                zip: `${sanitize(mat.name)}.zip`,
                entries: [
                    { path: `${mat.id}/${sanitize(mat.name)}.json`, json: materialJson(await field(page, mat.id, 'data'), texPaths([t]), false) },
                    // public reuploads overwrite revision 1, so both paths read the new bytes
                    { path, file: t, bytes: now }
                ]
            };
        }
    },
    { title: 'legacy glb model with a textured material and a missing mapping', build: page => legacyModel(page, true) },
    { title: 'legacy json model with a textured material and a missing mapping', build: page => legacyModel(page, false) },
    { title: 'legacy single-page font', build: page => legacyFont(page, `${uniqueName('Legacy')}.json`) },
    {
        title: 'legacy font with an extensionless name',
        build: async (page) => {
            const name = uniqueName('LegacyNoExt');
            // the job's slice(0, -0) yields '.zip'; the client keeps the name (deviation 1)
            return { ...(await legacyFont(page, name)), browserZip: 'zip', clientZip: `${name}.zip` };
        }
    },
    {
        title: 'referenced font with two pages',
        build: async (page) => {
            const [font] = await new AssetWorkflows(page).upload(
                { name: `${uniqueName('font')}.ttf`, mimeType: 'font/ttf', buffer: FONT },
                ['font', 'json', 'texture']
            );
            const [page0] = (await field(page, font.id, 'data.textureAssets')) as number[];

            // noConvert pages still get texture.thumbnails, after the upload clears task
            await (await thumbnailed(page, page0))();
            const extra = await upTexture(page, 32);
            await setData(page, font.id, { textureAssets: [page0, extra.id] });
            const uid = await field(page, font.id, 'uniqueId');
            const base = jobStrip(sanitize(await field(page, font.id, 'file.filename')));
            return {
                id: font.id,
                item: font.name,
                zip: `${jobStrip(sanitize(font.name))}.zip`,
                entries: [
                    { path: `${uid}/${base}.json`, file: await fileOf(page, await field(page, font.id, 'data.jsonAsset')) },
                    { path: `${uid}/${base}.png`, file: await fileOf(page, page0) },
                    { path: `${uid}/${base}1.png`, file: extra }
                ]
            };
        }
    }
];
