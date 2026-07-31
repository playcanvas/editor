// Client-side font import: generate MSDF (json + atlas png) in a worker, then lay the result
// out as a GLB-style folder — source .otf + a JSON mirror + Texture mirror(s) + a reference-only
// runtime font that points at them (resolved by ReferencedFontHandler). Needs the backend noConvert
// support.

type FontDataV3 = {
    version: number;
    type?: string;
    intensity?: number;
    info?: { face?: string; maps?: { width: number; height: number }[] };
    chars: Record<string, { id: number; [key: string]: unknown }>;
    kerning?: Record<string, unknown>;
};

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
        new Promise<any>((resolve) => {
            const asset = editor.call('assets:get', id);
            return asset ? resolve(asset) : editor.once(`assets:add[${id}]`, resolve);
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
                  preload: false
              });

        const ids = font?.get('data.textureAssets') || [];
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

    const watched = new Set<number>();
    const watchFont = (asset: any) => {
        if (asset.get('type') !== 'font' || asset.get('source') || !asset.has('data.jsonAsset')) {
            return;
        }
        const id = asset.get('id');
        if (watched.has(id)) {
            return;
        }
        watched.add(id);

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

        ['data:set', 'data.jsonAsset:set', 'data.textureAssets:set', 'data.textureAssets.0:set'].forEach((evt) => {
            asset.on(evt, () => {
                sync();
                reloadFont(asset);
            });
        });
    };

    const importFont = async (file: File, folder: any) => {
        const filename = file.name; // e.g. unisans.otf
        const base = filename.replace(/\.[^.]+$/, ''); // unisans
        const chars = DEFAULT_CHARS;

        const buffer = await file.arrayBuffer();

        // 1/2) upload the source while generating the msdf json and atlas png(s)
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

        // 3/4) json and texture mirrors (editable authoring sources)
        const refs = await writeReferences(null, sourceId, folder, base, v3, textures);

        // 5) runtime font — reference-only: `data` holds just the json/texture asset ids that
        // ReferencedFontHandler resolves into a pc.Font at load time, so the atlas isn't duplicated
        // into a third copy. It still needs a file: AssetRegistry.load() only calls a handler's load()
        // when asset.file is truthy, so a file-less font would skip straight to open() and the handler's
        // async reference resolution would never run. This placeholder's contents are ignored by the
        // handler for referenced fonts. The .json filename matters: the backend marks a font-with-file
        // as a source asset unless its extension is a target extension, and we want a usable target font.
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
        const buffer = await (await fetch(url)).arrayBuffer();
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
