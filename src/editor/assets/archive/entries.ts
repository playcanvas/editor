import sanitize from 'sanitize-filename';

export type ArchiveAsset = { get: (path: string) => any };
export type ArchiveLookup = (id: number | string) => ArchiveAsset | null | undefined;
export type ArchiveEntry = { path: string; id?: number; url?: string; size?: number; json?: unknown };
export type ArchivePlan = { name: string; entries: ArchiveEntry[] };
export type ArchiveResult = [string | null, ArchivePlan | null];
export type DownloadPlan = { mode: 'server' } | { mode: 'error'; error: string } | { mode: 'client'; plan: ArchivePlan };

// the texture maps the server's material and model archives remap; newer maps stay raw ids there too
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

const ok = (plan: ArchivePlan) => [null, plan] as ArchiveResult;
const fail = (error: string) => [error, null] as ArchiveResult;

// planners rewrite data, so never touch a live observer's object
const clone = (v: any) => (v == null ? v : structuredClone(v));

// node path.basename semantics, which the jobs use to derive names
const basename = (s: string, ext = '') => {
    const b = s.replace(/\/+$/, '').split('/').pop() ?? '';
    // node strips a basename equal to ext only when there is no directory part
    return ext && b.endsWith(ext) && (b !== ext || !s.includes('/')) ? b.slice(0, -ext.length) : b;
};

// node extname stripping; an extensionless name yields `whole` (the font job's slice(0, -0) gives '')
const stripExt = (s: string, whole = s) => {
    const i = s.lastIndexOf('.');
    return i > 0 ? s.slice(0, i) : whole;
};

export const fileUrl = (id: number, filename: string, branchId: string) =>
    `/api/assets/${id}/file/${encodeURIComponent(filename)}?branchId=${branchId}`;

const fromFile = (asset: ArchiveAsset, path: string, branchId: string) => ({
    path,
    id: asset.get('id'),
    url: fileUrl(asset.get('id'), asset.get('file.filename'), branchId),
    size: asset.get('file.size')
});

const context = (lookup: ArchiveLookup, branchId: string) => ({
    lookup,
    branchId,
    textures: new Map<number, ArchiveAsset>(),
    cubemaps: new Map<number, { asset: ArchiveAsset; data: any }>()
});

type Ctx = ReturnType<typeof context>;

// the jobs only resolve refs to non-source assets of the expected type in the same branch
const ofType = (lookup: ArchiveLookup, ref: unknown, type: string) => {
    const a = ref ? lookup(ref as number) : null;
    return a && a.get('type') === type && !a.get('source') ? a : null;
};

// a texture without a file would crash the job; treat it as missing instead
const useTexture = (ctx: Ctx, ref: unknown) => {
    const t = ofType(ctx.lookup, ref, 'texture');
    if (!t?.get('file.filename')) {
        return null;
    }
    ctx.textures.set(t.get('id'), t);
    return `../${t.get('id')}/${t.get('file.filename')}`;
};

const useCubemap = (ctx: Ctx, ref: unknown) => {
    const c = ofType(ctx.lookup, ref, 'cubemap');
    if (!c) {
        return null;
    }
    const id = c.get('id');
    if (!ctx.cubemaps.has(id)) {
        const data = clone(c.get('data')) ?? {};
        if (data.textures) {
            data.textures = data.textures.map((t: unknown) => (t && useTexture(ctx, t)) || t);
        }
        ctx.cubemaps.set(id, { asset: c, data });
    }
    return `../${id}/${sanitize(c.get('name') || 'Untitled')}.json`;
};

const cubemapEntries = (ctx: Ctx) =>
    [...ctx.cubemaps].flatMap(([id, { asset, data }]) => {
        const file = asset.get('file');
        const json: ArchiveEntry = { path: `${id}/${sanitize(asset.get('name') || 'Untitled')}.json`, json: data };
        if (!file) {
            return [json];
        }
        data.prefiltered = file.filename;
        return [fromFile(asset, `${id}/${file.filename}`, ctx.branchId), json];
    });

const textureEntries = (ctx: Ctx) =>
    [...ctx.textures].map(([id, t]) => fromFile(t, `${id}/${t.get('file.filename')}`, ctx.branchId));

// the server's model archive drops every falsy material field, its material archive only falsy map refs; kept for zip parity
const rewriteMaterial = (ctx: Ctx, data: any, pruneAll: boolean) => {
    for (const key of Object.keys(data)) {
        const map = TEXTURE_PROPERTIES.includes(key);
        if (!data[key]) {
            if (pruneAll || map || key === 'cubeMap') {
                delete data[key];
            }
            continue;
        }
        if (map || key === 'cubeMap') {
            const path = map ? useTexture(ctx, data[key]) : useCubemap(ctx, data[key]);
            if (path) {
                data[key] = path;
            } else {
                delete data[key];
            }
        }
    }
    return data;
};

const cubemap = (asset: ArchiveAsset, lookup: ArchiveLookup, branchId: string) => {
    const id = asset.get('id');
    const data = clone(asset.get('data'));
    if (!data?.textures) {
        return fail(`Asset ${id} has no textures`);
    }
    if (!data.textures.some(Boolean)) {
        return fail(`No textures found for asset ${id}`);
    }
    const ctx = context(lookup, branchId);
    data.textures = data.textures.map((t: unknown) => (t && useTexture(ctx, t)) || t);
    if (!ctx.textures.size) {
        return fail(`No textures found for asset ${id}`);
    }
    const filename = sanitize(asset.get('name') || 'Untitled');
    const entries: ArchiveEntry[] = textureEntries(ctx);
    const file = asset.get('file');
    if (file) {
        entries.push(fromFile(asset, `${id}/${file.filename}`, branchId));
        data.prefiltered = file.filename;
    }
    entries.push({ path: `${id}/${filename}.json`, json: data });
    return ok({ name: `${filename}.zip`, entries });
};

const material = (asset: ArchiveAsset, lookup: ArchiveLookup, branchId: string) => {
    const id = asset.get('id');
    const data = clone(asset.get('data'));
    if (!data) {
        return fail(`Asset ${id} has no data`);
    }
    const ctx = context(lookup, branchId);
    const filename = sanitize(asset.get('name') || 'Untitled');
    rewriteMaterial(ctx, data, false);
    data.mapping_format = 'path';
    return ok({
        name: `${filename}.zip`,
        entries: [{ path: `${id}/${filename}.json`, json: data }, ...cubemapEntries(ctx), ...textureEntries(ctx)]
    });
};

const model = (asset: ArchiveAsset, lookup: ArchiveLookup, branchId: string) => {
    const file = asset.get('file');
    if (!file) {
        return fail(`Asset ${asset.get('id')} has no file`);
    }
    const name = asset.get('name') || 'Untitled';
    // the job tests '.glb' lowercased but strips it case-sensitively, so 'Car.GLB' keeps it
    const filename = sanitize(basename(name, name.toLowerCase().endsWith('.glb') ? '.glb' : '.json'));
    const data = clone(asset.get('data')) ?? {};
    const ctx = context(lookup, branchId);
    const materials = new Map<number, ArchiveAsset>();
    for (const m of data.mapping ?? []) {
        const mat = ofType(lookup, m.material, 'material');
        m.path = mat ? `${mat.get('id')}/${sanitize(mat.get('name') || 'Untitled')}.json` : null;
        delete m.material;
        if (mat) {
            materials.set(mat.get('id'), mat);
        }
    }
    const entries: ArchiveEntry[] = [{ path: `${filename}.mapping.json`, json: data }];
    for (const [id, mat] of materials) {
        const md = clone(mat.get('data')) ?? {};
        md.mapping_format = 'path';
        entries.push({ path: `${id}/${sanitize(mat.get('name') || 'Untitled')}.json`, json: rewriteMaterial(ctx, md, true) });
    }
    entries.push(...cubemapEntries(ctx), ...textureEntries(ctx), fromFile(asset, file.filename, branchId));
    return ok({ name: `${filename}.zip`, entries });
};

const font = (asset: ArchiveAsset, lookup: ArchiveLookup, branchId: string) => {
    const file = asset.get('file');
    if (!file?.filename) {
        return fail('Cannot find font file');
    }
    // font zips are keyed by the mongo _id, unlike the item-id layout of the other archives
    const uid = asset.get('uniqueId');
    const base = stripExt(sanitize(basename(file.filename)), '');
    // deviation 1: an extensionless name keeps its name, where the job would write '.zip'
    const name = `${stripExt(sanitize(basename(asset.get('name') || 'Untitled')))}.zip`;
    const png = (i: number) => `${uid}/${base}${i || ''}.png`;

    // the job treats any falsy jsonAsset as a legacy font, and resolves refs by id alone
    if (asset.get('data.jsonAsset')) {
        const json = lookup(asset.get('data.jsonAsset'));
        if (!json?.get('file.filename')) {
            return fail("The font's JSON asset is missing or has no file");
        }
        const pages = (asset.get('data.textureAssets') ?? []).filter(Boolean).map((p: number) => lookup(p));
        if (!pages.length || pages.some((p: ArchiveAsset | null) => !p?.get('file.filename'))) {
            return fail("One or more of the font's texture assets are missing or have no file");
        }
        return ok({
            name,
            entries: [
                fromFile(json, `${uid}/${base}.json`, branchId),
                ...pages.map((p: ArchiveAsset, i: number) => fromFile(p, png(i), branchId))
            ]
        });
    }

    const count = asset.get('data.info.maps')?.length || 1;
    // extra legacy pages sit beside the font's own file; only page 0's size is known
    const entries: ArchiveEntry[] = Array.from({ length: count }, (_, i) => ({
        path: png(i),
        id: asset.get('id'),
        url: fileUrl(asset.get('id'), `${base}${i || ''}.png`, branchId),
        size: i ? undefined : file.size
    }));
    entries.push({ path: `${uid}/${base}.json`, json: clone(asset.get('data')) });
    return ok({ name, entries });
};

const BUILDERS = { cubemap, font, material, model };

export const buildArchive = (asset: ArchiveAsset, lookup: ArchiveLookup, branchId: string) => {
    const type = asset.get('type');
    return Object.hasOwn(BUILDERS, type) ? BUILDERS[type as keyof typeof BUILDERS](asset, lookup, branchId) : fail('Unsupported asset type');
};

export const archiveSize = (plan: ArchivePlan) => plan.entries.reduce((n, e) => n + (e.size ?? 0), 0);

/**
 * Chooses how an asset download runs. Must stay synchronous: the server fallback opens a window,
 * which popup blockers only allow inside the click.
 */
export const planDownload = (asset: ArchiveAsset, lookup: ArchiveLookup, branchId: string, maxBytes: number) => {
    if (asset.get('source') || !Object.hasOwn(BUILDERS, asset.get('type'))) {
        return { mode: 'server' } as DownloadPlan;
    }
    const [error, plan] = buildArchive(asset, lookup, branchId);
    if (error) {
        return { mode: 'error', error } as DownloadPlan;
    }
    return (archiveSize(plan) > maxBytes ? { mode: 'server' } : { mode: 'client', plan }) as DownloadPlan;
};
