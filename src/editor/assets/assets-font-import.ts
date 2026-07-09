// Client-side font import: generate MSDF (json + atlas png) in a worker, then lay the result
// out as a GLB-style folder — source .otf + a JSON mirror + Texture mirror(s) + a runtime font
// that is baked from them. Gated by the hasClientFontImport flag + the backend noConvert support.

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
    // font-tools emits v3 (chars keyed by letter, info.maps); the editor/engine persist v2 (chars keyed
    // by numeric code, info.width/height). Convert so existing inspector/migrate keep working; the engine
    // upgrades v2->v3 at load.
    const toV2 = (v3: FontDataV3) => {
        const chars: Record<string, unknown> = {};
        for (const letter in v3.chars) {
            const char = v3.chars[letter];
            chars[char.id] = char;
        }
        const map0 = v3.info?.maps?.[0] ?? { width: 0, height: 0 };
        return {
            version: 2,
            type: v3.type ?? 'msdf',
            intensity: v3.intensity ?? 0,
            info: { face: v3.info?.face, width: map0.width, height: map0.height, maps: v3.info?.maps ?? [] },
            chars,
            kerning: v3.kerning ?? {}
        };
    };

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

    // resolve once the asset's file has been uploaded and its url is available
    const whenFile = (asset: any) =>
        new Promise<object>((resolve) => {
            return asset.get('file.url') ? resolve(asset.get('file')) : asset.once('file.url:set', () => resolve(asset.get('file')));
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

        // 5) runtime font — created file-less (so the backend keeps type 'font'), self-contained v2 data
        // plus authoring refs to the mirrors
        const data = toV2(v3) as Record<string, unknown>;
        data.jsonAsset = jsonId;
        data.textureAssets = textureIds;
        const fontId = await createAsset({
            name: filename,
            type: 'font',
            source_asset_id: `${sourceId}`,
            data,
            meta: { chars, invert: false },
            parent: folder,
            preload: true
        });

        // 6) bake: point the font's file at the page-0 texture mirror's object so the engine loads the atlas
        const tex0 = await getObserver(textureIds[0]);
        const fileObj = await whenFile(tex0);
        const font = await getObserver(fontId);
        font.set('file', fileObj);

        editor.call('selector:set', 'asset', [font]);
    };

    editor.method('fonts:import', (file: File, folder: any) => {
        importFont(file, folder).catch((err) => {
            editor.call('status:error', `Font import failed: ${err?.message ?? err}`);
        });
    });

    // re-bake a font from its mirror assets when they change (edit the json / replace the atlas png)
    const rebake = async (font: any) => {
        const jsonId = font.get('data.jsonAsset');
        const textureIds = font.get('data.textureAssets') || [];

        if (jsonId) {
            const jsonAsset = editor.call('assets:get', jsonId);
            const url = jsonAsset?.get('file.url');
            if (url) {
                const res = await fetch(url);
                const v3 = await res.json();
                const v2 = toV2(v3) as Record<string, unknown>;
                v2.jsonAsset = jsonId;
                v2.textureAssets = textureIds;
                font.set('data', v2);
            }
        }

        if (textureIds[0]) {
            const tex0 = editor.call('assets:get', textureIds[0]);
            const fileObj = tex0?.get('file');
            if (fileObj) {
                font.set('file', fileObj);
            }
        }
    };

    editor.method('fonts:rebake', (font: any) => {
        rebake(font).catch((err) => {
            void log.error`font rebake failed ${err?.message ?? err}`;
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
    // watch then re-bakes the font
    const reprocess = async (font: any, chars: string, invert: boolean) => {
        const source = editor.call('assets:get', font.get('source_asset_id'));
        const url = source?.get('file.url');
        if (!url) {
            throw new Error('font source file not found');
        }
        const buffer = await (await fetch(url)).arrayBuffer();
        const base = font.get('name').replace(/\.[^.]+$/, '');

        const { data: v3, textures } = await generate(buffer, { chars, fontName: base, invert });

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

    // watch referenced mirrors of each referenced font and re-bake on their file changes
    const watched = new Set<number>();
    editor.on('assets:add', (asset: any) => {
        if (asset.get('type') !== 'font' || asset.get('source') || !asset.get('data.jsonAsset')) {
            return;
        }
        const fontId = asset.get('id');
        if (watched.has(fontId)) {
            return;
        }
        watched.add(fontId);

        const mirrorIds = [asset.get('data.jsonAsset'), ...(asset.get('data.textureAssets') || [])].filter(Boolean);
        mirrorIds.forEach((id: number) => {
            const trigger = () => editor.call('fonts:rebake', asset);
            const mirror = editor.call('assets:get', id);
            if (mirror) {
                mirror.on('file.url:set', trigger);
            } else {
                editor.once(`assets:add[${id}]`, (m: any) => m.on('file.url:set', trigger));
            }
        });
    });
});
