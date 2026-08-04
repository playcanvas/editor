// client-side font import. a worker generates the msdf descriptor and atlas, and the result is laid
// out in one folder: the source .otf, a json asset holding the descriptor, a texture asset per atlas
// page, and a runtime font whose `data` only references those (ReferencedFontHandler resolves it).
// depends on the backend honouring `noConvert`, so it does not also produce a target of its own.

import { isRefPath } from '@/common/referenced-font-handler';

type FontDataV3 = {
    version: number;
    type?: string;
    intensity?: number;
    info?: { face?: string; maps?: { width: number; height: number }[] };
    chars: Record<string, { id: number; [key: string]: unknown }>;
    kerning?: Record<string, unknown>;
};

// how long to wait for a created asset to arrive over realtime before giving up
const ASSET_ADD_TIMEOUT = 30000;

const DEFAULT_CHARS = (() => {
    let s = '';
    for (let i = 0x20; i <= 0x7e; i++) {
        s += String.fromCharCode(i);
    }
    return s;
})();

editor.once('load', () => {
    const generate = (buffer: ArrayBuffer, options: object): Promise<{ data: FontDataV3; textures: Uint8Array[] }> =>
        new Promise((resolve, reject) => {
            editor.call(
                'fonts:generate',
                buffer,
                options,
                (err: string | null, result?: { data: FontDataV3; textures: Uint8Array[] }) => {
                    return err || !result ? reject(new Error(err ?? 'font generation failed')) : resolve(result);
                }
            );
        });

    // create an asset and resolve its id (noSelect so we don't hijack the selection per child)
    const createAsset = (data: object): Promise<number> =>
        new Promise((resolve, reject) => {
            editor.call(
                'assets:create',
                data,
                (err: string | null, id?: number) => (err ? reject(new Error(err)) : resolve(id)),
                true
            );
        });

    const getObserver = (id: number) =>
        new Promise<any>((resolve, reject) => {
            const asset = editor.call('assets:get', id);
            if (asset) {
                resolve(asset);
                return;
            }
            // bounded: a dropped realtime message would otherwise strand `updating`, which blocks
            // every later rebuild of this font and leaves the inspector button disabled for good
            const timer = setTimeout(() => {
                evt.unbind();
                reject(new Error(`asset ${id} was created but never arrived`));
            }, ASSET_ADD_TIMEOUT);
            const evt = editor.once(`assets:add[${id}]`, (a: any) => {
                clearTimeout(timer);
                resolve(a);
            });
        });

    const updateFile = (asset: any, file: Blob, filename: string, noConvert: boolean) =>
        new Promise<void>((resolve, reject) => {
            editor.call(
                'assets:uploadFile',
                { asset, file, filename, name: asset.get('name'), type: asset.get('type'), noConvert },
                (err: string | null) => (err ? reject(new Error(err)) : resolve())
            );
        });

    const writeReferences = async (
        font: any,
        sourceId: number | string,
        parent: any,
        base: string,
        data: FontDataV3,
        textures: Uint8Array[]
    ) => {
        const json = font && editor.call('assets:get', font.get('data.jsonAsset'));
        const jsonId = json
            ? updateFile(
                  json,
                  new Blob([JSON.stringify(data)], { type: 'application/json' }),
                  `${base}.json`,
                  false
              ).then(() => json.get('id'))
            : createAsset({
                  name: `${base}.json`,
                  type: 'json',
                  file: new Blob([JSON.stringify(data)], { type: 'application/json' }),
                  filename: `${base}.json`,
                  source_asset_id: `${sourceId}`,
                  parent,
                  // not preloaded: the font's own load resolves and loads this, so it arrives either
                  // way. preloading it alongside the atlas pages would only pull the fetch earlier
                  preload: false
              });

        const ids = font?.get('data.textureAssets') || [];
        // a regenerated descriptor can pack into fewer pages than before. don't delete the surplus
        // assets — a repointed page may be a texture the user still wants — but say so, otherwise
        // they sit in the folder unreferenced and unexplained
        if (ids.length > textures.length) {
            editor.call(
                'status:text',
                `Font now uses ${textures.length} atlas page(s); ${ids.length - textures.length} previous page asset(s) are no longer referenced.`
            );
        }
        const textureIds = Promise.all(
            textures.map((bytes, i) => {
                const asset = editor.call('assets:get', ids[i]);
                const name = i === 0 ? `${base}.png` : `${base}${i}.png`;
                const file = new Blob([bytes as BlobPart], { type: 'image/png' });
                return asset
                    ? updateFile(asset, file, asset.get('name'), true).then(() => asset.get('id'))
                    : createAsset({
                          name,
                          type: 'texture',
                          file,
                          filename: name,
                          source_asset_id: `${sourceId}`,
                          parent,
                          noConvert: true,
                          preload: true
                      });
            })
        );

        const [jsonRef, textureRefs] = await Promise.all([jsonId, textureIds]);
        await Promise.all([jsonRef, ...textureRefs].map(getObserver));
        return { jsonAsset: jsonRef, textureAssets: textureRefs };
    };

    const pending = new Set<number>();
    const updating = new Set<number>();
    const queued = new Set<number>();
    const rebuildFont = (asset: any) => {
        const app = editor.call('viewport:app');
        const id = asset.get('id');
        const engineAsset = app?.assets.get(id);
        if (!engineAsset || updating.has(id)) {
            return;
        }
        if (engineAsset.loading) {
            if (pending.has(id)) {
                return;
            }
            pending.add(id);
            const retry = () => {
                engineAsset.off('load', retry);
                engineAsset.off('error', retry);
                pending.delete(id);
                reloadFont(asset);
            };
            engineAsset.once('load', retry);
            engineAsset.once('error', retry);
            return;
        }
        engineAsset._data = asset.json().data;
        engineAsset.unload();
        engineAsset.file ||= asset.get('file');
        // the placeholder file url never changes, so the loader would hand back the previously built
        // font instead of resolving the current refs
        app.loader.clearCache(engineAsset.getFileUrl(), 'font');
        app.assets.load(engineAsset);
    };

    // coalesce refs changed in the same tick (e.g. json + atlas repointed together) into one rebuild:
    // two overlapping loads can otherwise resolve out of order, pairing the new json with the old atlas
    const reloadFont = (asset: any) => {
        const id = asset.get('id');
        if (queued.has(id)) {
            return;
        }
        queued.add(id);
        queueMicrotask(() => {
            queued.delete(id);
            rebuildFont(asset);
        });
    };

    // id -> teardown. without it every deleted referenced font leaks its observer handlers plus one
    // registry handler per mirror, and keeps its id in `watched`, so any later re-add of that id
    // (a merge, a realtime resync) would be treated as already watched and silently stop rebuilding
    const watched = new Map<number, () => void>();
    const watchFont = (asset: any) => {
        if (asset.get('type') !== 'font' || asset.get('source') || !asset.has('data.jsonAsset')) {
            return;
        }
        const id = asset.get('id');
        if (watched.has(id)) {
            return;
        }
        const app = editor.call('viewport:app');
        if (!app) {
            return;
        }

        let watches: any[] = [];
        const sync = () => {
            watches.forEach((h) => h.off());
            watches = [asset.get('data.jsonAsset'), ...(asset.get('data.textureAssets') || [])]
                .filter(Boolean)
                .map((ref: number) => app.assets.on(`load:${ref}`, () => reloadFont(asset)));
        };
        sync();

        // the texture list is edited as an array, so element writes, length changes and reordering all
        // matter (chars[].map indexes into page order). the observer has no mid-path wildcard, so listen
        // on the global events and filter by path
        const events = ['*:set', '*:insert', '*:remove', '*:move'].map((evt) =>
            asset.on(evt, (path: string) => {
                if (!isRefPath(path)) {
                    return;
                }
                sync();
                reloadFont(asset);
            })
        );

        watched.set(id, () => {
            watches.forEach((h) => h.off());
            events.forEach((e) => e.unbind());
        });
    };

    editor.on('assets:remove', (asset: any) => {
        const id = asset.get('id');
        watched.get(id)?.();
        watched.delete(id);
        // the engine asset is unloaded and dropped from the registry by assets-registry, so a retry
        // armed in rebuildFont will never fire; leaving the id here would block every later rebuild
        pending.delete(id);
        queued.delete(id);
    });

    const importFont = async (file: File, folder: any) => {
        const filename = file.name; // e.g. unisans.otf
        const base = filename.replace(/\.[^.]+$/, ''); // unisans
        const chars = DEFAULT_CHARS;

        const buffer = await file.arrayBuffer();

        // upload the source while the worker generates, since neither needs the other
        const [sourceId, { data: v3, textures }] = await Promise.all([
            createAsset({
                name: filename,
                type: 'font',
                file,
                filename,
                parent: folder,
                noConvert: true,
                preload: false
            }),
            generate(buffer, { chars, fontName: base })
        ]);

        // the descriptor and atlas become editable assets of their own
        const refs = await writeReferences(null, sourceId, folder, base, v3, textures);

        // the runtime font only references those, so the atlas is never copied a third time. two
        // things about it are load-bearing and not obvious:
        //   - the `{}` file is a placeholder, ignored for referenced fonts, but AssetRegistry.load()
        //     only calls a handler's load() when asset.file is set — without it the handler would
        //     skip to open() and never resolve the references.
        //   - the .json extension makes the backend treat this as a target rather than a source
        //     asset, which is what makes it usable as a font.
        const fontId = await createAsset({
            name: filename,
            type: 'font',
            file: new Blob(['{}'], { type: 'application/json' }),
            filename: `${base}.json`,
            source_asset_id: `${sourceId}`,
            data: refs,
            meta: { chars, invert: false },
            parent: folder,
            noConvert: true,
            preload: true
        });

        const font = await getObserver(fontId);
        reloadFont(font);
        editor.call('selector:set', 'asset', [font]);
    };

    editor.method('fonts:import', (file: File, folder: any) => {
        importFont(file, folder).catch((err) => {
            editor.call('status:error', `Font import failed: ${err?.message ?? err}`);
        });
    });

    // generate references for old fonts or refresh them for referenced fonts
    const reprocess = async (font: any, chars: string, invert: boolean) => {
        const sourceId = font.get('source_asset_id');
        const source = editor.call('assets:get', sourceId);
        const url = source?.get('file.url');
        if (!url) {
            throw new Error('font source file not found');
        }
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`font source file could not be read (${res.status})`);
        }
        const buffer = await res.arrayBuffer();
        const base = font.get('name').replace(/\.[^.]+$/, '');

        const { data: v3, textures } = await generate(buffer, { chars, fontName: base, invert });
        const missing = Array.from(chars).filter((c) => !v3.chars[c]);
        const path = font.get('path') || [];
        const parent = path.length ? editor.call('assets:get', path[path.length - 1]) : null;
        const migrated = !font.has('data.jsonAsset');
        const id = font.get('id');

        updating.add(id);
        await writeReferences(font, sourceId, parent, base, v3, textures)
            .then(async (refs) => {
                // mark the font before removing legacy data so realtime sync never publishes a partial descriptor
                if (migrated) {
                    font.set('data.jsonAsset', refs.jsonAsset);
                }
                font.set('data', refs);
                watchFont(font);

                if (migrated) {
                    const app = editor.call('viewport:app');
                    const engineAsset = app?.assets.get(id);
                    if (engineAsset) {
                        engineAsset._data = refs;
                    }
                    await updateFile(
                        font,
                        new Blob(['{}'], { type: 'application/json' }),
                        font.get('file.filename'),
                        true
                    );
                }
                // last: the server nulls `meta` on any asset file update (it is normally repopulated by
                // the conversion we skip), so writing it before the upload above would be discarded
                font.set('meta', { ...(font.get('meta') || {}), chars, invert });
            })
            .then(
                () => updating.delete(id),
                (err) => {
                    updating.delete(id);
                    throw err;
                }
            );
        reloadFont(font);
        editor.emit('fonts:reprocessed', font, missing);
    };

    editor.method('fonts:reprocess', (font: any, chars: string, invert: boolean) => {
        return reprocess(font, chars, invert).catch((err) => {
            editor.call('status:error', `Font reprocess failed: ${err?.message ?? err}`);
        });
    });

    // keep the viewport/thumbnail font in sync with its referenced mirrors by rebuilding the engine font
    // resource. two change sources: the font's own refs being repointed (observer data:set), and a
    // referenced mirror's file being edited/reprocessed/replaced (the mirror's engine `load`, which fires
    // once assets-registry has re-fetched it — so the mirror resource is fresh by then).
    editor.on('assets:add', watchFont);
});
