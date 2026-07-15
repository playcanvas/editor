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

    const importFont = async (file: File, folder: any) => {
        const filename = file.name; // e.g. unisans.otf
        const base = filename.replace(/\.[^.]+$/, ''); // unisans
        const chars = DEFAULT_CHARS;

        const buffer = await file.arrayBuffer();

        // 1) source .otf — noConvert so the server pipeline doesn't also produce a target font
        const sourceId = await createAsset({
            name: filename,
            type: 'font',
            file,
            filename,
            parent: folder,
            noConvert: true,
            preload: false
        });

        // 2) generate the MSDF json + atlas png(s) off the main thread
        const { data: v3, textures } = await generate(buffer, { chars, fontName: base });

        if (textures.length > 1) {
            // ponytail: single-page only for now — multi-page needs the font's own contiguous atlas copies
            console.warn(`font "${base}" produced ${textures.length} atlas pages; only page 0 is wired`);
        }

        // 3) JSON mirror (editable, authoring source of truth)
        const jsonBlob = new Blob([JSON.stringify(v3)], { type: 'application/json' });
        const jsonId = await createAsset({
            name: `${base}.json`,
            type: 'json',
            file: jsonBlob,
            filename: `${base}.json`,
            source_asset_id: `${sourceId}`,
            parent: folder,
            preload: false
        });

        // 4) Texture mirror(s) — noConvert so the server texture pipeline doesn't recompress the atlas
        const textureIds = await Promise.all(
            textures.map((bytes, i) => {
                const texName = i === 0 ? `${base}.png` : `${base}${i}.png`;
                const texBlob = new Blob([bytes as BlobPart], { type: 'image/png' });
                return createAsset({
                    name: texName,
                    type: 'texture',
                    file: texBlob,
                    filename: texName,
                    source_asset_id: `${sourceId}`,
                    parent: folder,
                    noConvert: true,
                    preload: true
                });
            })
        );

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
            data: { jsonAsset: jsonId, textureAssets: textureIds },
            meta: { chars, invert: false },
            parent: folder,
            noConvert: true,
            preload: true
        });

        const font = await getObserver(fontId);
        editor.call('selector:set', 'asset', [font]);
    };

    editor.method('fonts:import', (file: File, folder: any) => {
        importFont(file, folder).catch((err) => {
            editor.call('status:error', `Font import failed: ${err?.message ?? err}`);
        });
    });

    // update an existing mirror asset's file (assetUpdate via the upload path)
    const updateFile = (asset: any, file: Blob, filename: string, noConvert: boolean) =>
        new Promise<void>((resolve, reject) => {
            editor.call(
                'assets:uploadFile',
                { asset, file, filename, name: asset.get('name'), type: asset.get('type'), noConvert },
                (err: string | null) => (err ? reject(new Error(err)) : resolve())
            );
        });

    // re-run generation with a new character set / invert and refresh the mirror assets; the mirror
    // watch then reloads the font's engine resource
    const reprocess = async (font: any, chars: string, invert: boolean) => {
        const source = editor.call('assets:get', font.get('source_asset_id'));
        const url = source?.get('file.url');
        if (!url) {
            throw new Error('font source file not found');
        }
        const buffer = await (await fetch(url)).arrayBuffer();
        const base = font.get('name').replace(/\.[^.]+$/, '');

        const { data: v3, textures } = await generate(buffer, { chars, fontName: base, invert });

        // font-tools silently drops requested glyphs the source lacks; report them so the inspector can
        // warn (referenced fonts have no server `task` for the pipeline's warning to key off)
        const missing = Array.from(chars).filter((c) => !v3.chars[c]);
        editor.emit('fonts:reprocessed', font, missing);

        const jsonAsset = editor.call('assets:get', font.get('data.jsonAsset'));
        if (jsonAsset) {
            await updateFile(jsonAsset, new Blob([JSON.stringify(v3)], { type: 'application/json' }), `${base}.json`, false);
        }

        const textureIds = font.get('data.textureAssets') || [];
        await Promise.all(
            textures.map((bytes, i) => {
                const tex = editor.call('assets:get', textureIds[i]);
                return tex ? updateFile(tex, new Blob([bytes as BlobPart], { type: 'image/png' }), tex.get('name'), true) : null;
            })
        );

        font.set('meta.chars', chars);
        font.set('meta.invert', invert);
    };

    editor.method('fonts:reprocess', (font: any, chars: string, invert: boolean) => {
        reprocess(font, chars, invert).catch((err) => {
            editor.call('status:error', `Font reprocess failed: ${err?.message ?? err}`);
        });
    });

    // keep the viewport/thumbnail font in sync with its referenced mirrors. the editor observer is
    // synced into the engine asset by assets-registry on a deferred tick, so we react to ENGINE signals
    // (which fire after that sync) not the observer's own events (which fire before it — reloading then
    // would re-resolve the handler against still-stale engine data/mirror resources).
    const watched = new Set<number>();
    editor.on('assets:add', (asset: any) => {
        if (asset.get('type') !== 'font' || asset.get('source') || !asset.has('data.jsonAsset')) {
            return;
        }
        const fontId = asset.get('id');
        if (watched.has(fontId)) {
            return;
        }
        watched.add(fontId);

        const app = editor.call('viewport:app');
        if (!app) {
            return; // headless (no webgl): no viewport font to keep live
        }

        // re-run ReferencedFontHandler against the current refs; skip while a load is in flight so we
        // don't interrupt the initial preload
        const reload = () => {
            const engineAsset = app.assets.get(fontId);
            if (engineAsset && !engineAsset.loading) {
                engineAsset.unload();
                app.assets.load(engineAsset);
            }
        };

        // reload when a referenced mirror's engine asset (re)loads — assets-registry re-fetches it after
        // its json/atlas is edited/reprocessed/replaced
        let mirrorWatches: any[] = [];
        const syncWatches = () => {
            mirrorWatches.forEach((h) => h.off());
            mirrorWatches = [asset.get('data.jsonAsset'), ...(asset.get('data.textureAssets') || [])]
                .filter(Boolean)
                .map((id: number) => app.assets.on(`load:${id}`, reload));
        };
        syncWatches();

        // reload when the refs are repointed — assets-registry pushes the new data onto the engine asset
        // (firing this change), and we re-point the mirror watches at the new ids
        const onRepoint = (_a: any, prop: string) => {
            if (prop === 'data') {
                syncWatches();
                reload();
            }
        };
        const engineFont = app.assets.get(fontId);
        if (engineFont) {
            engineFont.on('change', onRepoint);
        } else {
            app.assets.once(`add:${fontId}`, (a: any) => a.on('change', onRepoint));
        }
    });
});
