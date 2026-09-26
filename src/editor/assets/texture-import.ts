// client-side texture conversion. decides in-place vs source->target like the server, uploads with
// conversion opted out, then finishes like the server's conversion: thumbnails, then compress for a
// target with compression enabled.

import type { Converted } from '../../texture-convert/convert';
import {
    canConvert,
    isInPlace,
    MAX_BYTES,
    needsProcess,
    targetName,
    textureOptions
} from '../../texture-convert/options';
import type { TextureMeta, TextureOptions } from '../../texture-convert/options';

type Obs = { get: (path: string) => any };

type Src = { id: number; type: string; path: number[] };

type Size = { width: number; height: number };

export type ImportDeps = {
    // worker decision meta for any client source (sourceMeta); never stored as meta
    sourceMeta: (file: File) => Promise<TextureMeta | null>;
    convert: (buffer: ArrayBuffer, meta: TextureMeta, options: TextureOptions) => Promise<Converted>;
    upload: (args: Record<string, unknown>) => Promise<number>;
    observer: (id: number) => Promise<Obs>;

    // resolves once the observer has the uploaded file (size) and its meta has these dimensions
    settle: (asset: Obs, size: number, dims: Size) => Promise<void>;
    findTarget: (src: Src, name: string, related: boolean) => Obs | null;
    get: (id: number | string) => Obs | null;

    // queue a compress job: compress `asset` from `source`'s file, resized to `size`
    compress: (asset: Obs, source: number, size?: Size) => void;

    // assets:thumbnails:texture: every upload here is noConvert, so the editor owns its thumbnails
    thumbnails: (asset: Obs, source: Blob, rgbm?: boolean) => Promise<void>;

    // assets:meta:texture. without it the server's meta job (no noMeta) produces meta. this meta is
    // only ever stored: sourceMeta alone decides what gets converted
    meta?: (file: Blob, name: string) => Promise<TextureMeta | null>;
};

export type ImportArgs = {
    file: File;
    type: string;
    parent: Obs | null;
    existing: Obs | null;
    target?: Obs | null;
    skipSource?: boolean;
    pow2: boolean;
    related: boolean;
    preload: boolean;
};

export const COMPRESS_FORMATS = ['dxt', 'pvr', 'etc1', 'etc2', 'basis'];

export const compressFormats = (asset: Obs) => COMPRESS_FORMATS.filter((f) => asset.get(`meta.compress.${f}`));

// same match as the server's target query, path only when not searching related
export const isTarget = (a: Obs, src: Src, name: string, related: boolean) =>
    `${a.get('source_asset_id')}` === `${src.id}` &&
    a.get('name') === name &&
    a.get('type') === src.type &&
    (related || JSON.stringify(a.get('path')) === JSON.stringify(src.path));

// path.extname, lowercased
const extname = (name: string) => /(?!^)\.[^.]*$/.exec(name)?.[0].toLowerCase() ?? '';

// a rest update stores the file under the asset's name; a server re-import keeps the
// stored filename, so an asset renamed away from its file only re-imports there
export const keepsFilename = (a: Obs) => {
    const name = a.get('name');
    const ext = extname(a.get('file.filename') ?? '');
    return (extname(name) === ext ? name : name + ext) === a.get('file.filename');
};

// the server conversion's compress job payload: compress `asset` from `source`'s file
export const compressJob = (asset: Obs, source: Obs, size?: Size) => {
    const c = asset.get('meta.compress');
    const type = `${asset.get('meta.type') ?? ''}`.toLowerCase();
    return {
        source: parseInt(source.get('uniqueId'), 10),
        asset: parseInt(asset.get('uniqueId'), 10),
        filename: source.get('file.filename'),
        options: {
            formats: compressFormats(asset),
            alpha: c.alpha && (asset.get('meta.alpha') || type === 'truecoloralpha'),
            pvrBpp: c.pvrBpp,
            mipmaps: asset.get('data.mipmaps'),
            normals: c.normals,
            resize: size,
            quality: c.quality,
            compressionMode: c.compressionMode,
            noFlip: true
        }
    };
};

/** Runs at most `n` jobs at once, in call order. */
export const queue = (n: number) => {
    let active = 0;
    const waiting: (() => void)[] = [];
    const done = () => {
        active--;
        waiting.shift()?.();
    };
    return <T>(job: () => Promise<T>) =>
        new Promise<T>((resolve, reject) => {
            const start = () => {
                active++;
                job().then(resolve, reject).then(done);
            };
            if (active < n) {
                start();
            } else {
                waiting.push(start);
            }
        });
};

/**
 * Imports a texture file the way the server pipeline would. Resolves false, before anything is
 * uploaded, when the server should handle it instead; rejects only once an upload has started.
 */
export const importTexture = async (deps: ImportDeps, args: ImportArgs) => {
    const { file, type, parent, existing, pow2, related, preload } = args;

    // a file dropped over a target makes the server regenerate the target from its source
    const of = existing?.get('source_asset_id');
    if (of && deps.get(of)?.get('type') === existing.get('type')) {
        return false;
    }

    // the worker's decision meta also flags what its codecs can't match (colour profiles, cmyk,
    // animations), so it alone decides, within the byte cap
    const meta = file.size <= MAX_BYTES ? await deps.sourceMeta(file).catch(() => null) : null;
    const options = textureOptions(meta, pow2);
    if (!options || !canConvert(meta, options, file.size)) {
        return false;
    }

    const inPlace = isInPlace(meta, options);
    const skip = inPlace && !needsProcess(options);

    // an upload sends name and parent like uploadToFolder: the server renames and moves the asset, then looks
    // its target up from the new folder
    const place = args.skipSource ? {} : { name: file.name, parent };
    const path = parent
        ? [...parent.get('path'), parseInt(parent.get('id'), 10)]
        : existing
          ? existing.get('path')
          : [];

    // like the server, a pow2 size the existing target's meta already has is not applied again
    const name = targetName(file.name, options.format);
    const prior = inPlace
        ? null
        : (args.target ??
          (existing
              ? deps.findTarget({ id: existing.get('id'), type: existing.get('type'), path }, name, related)
              : null));
    const stale =
        !!options.size &&
        prior?.get('meta.width') === options.size.width &&
        prior?.get('meta.height') === options.size.height;
    const opts = stale ? { ...options, size: undefined } : options;
    const out = skip ? null : await deps.convert(await file.arrayBuffer(), meta, opts).catch(() => null);
    if (!skip && !out) {
        return false;
    }
    const blob = out ? new Blob([out.file], { type: `image/${options.format}` }) : file;
    const dims = opts.size && !opts.rgbm ? opts.size : { width: meta.width, height: meta.height };

    // client meta of the uploaded file. the server describes an in-place texture from the file it was
    // given, then writes the new size and depth over that
    const clientMeta = deps.meta ? await deps.meta(file, file.name).catch(() => null) : null;
    const converted = inPlace
        ? clientMeta && { ...clientMeta, ...(opts.size ?? {}), ...(opts.depthConvert ? { depth: 8 } : {}) }
        : deps.meta
          ? await deps.meta(blob, name).catch(() => null)
          : null;
    const outMeta = out ? converted : clientMeta;

    // the editor always makes the thumbnails; with computed meta the upload writes it (noMeta) too
    const optOut = (m: TextureMeta | null) => ({
        noConvert: true,
        noThumbnails: true,
        ...(m ? { clientMeta: m } : {})
    });

    const finish = async (id: number, src: number) => {
        const asset = await deps.observer(id);

        // compress reads meta.width/height, so wait for the new file and meta to reach the observer
        await deps.settle(asset, blob.size, dims);

        // the server thumbnails an rgbm target from its float source, tonemapped: that is the preview, which
        // must not be rgbm-decoded again
        await deps.thumbnails(
            asset,
            out?.preview ? new Blob([out.preview], { type: 'image/png' }) : blob,
            out?.preview ? false : undefined
        );

        // the server compresses in-place and separate targets alike,
        // resized to the pow2 size even when the stale-size skip left the file alone
        if (compressFormats(asset).length) {
            deps.compress(asset, src, options.size);
        }
    };

    if (inPlace) {
        const id =
            args.skipSource && !out
                ? existing.get('id')
                : await deps.upload({
                      ...optOut(outMeta),
                      asset: existing,
                      file: new File([blob], file.name),
                      type,
                      filename: file.name,
                      preload,
                      ...place
                  });
        await finish(id, id);
        return true;
    }

    const srcId = args.skipSource
        ? existing.get('id')
        : await deps.upload({
              // worker decision meta is never stored: without client meta the source keeps its meta job
              ...optOut(clientMeta),
              asset: existing,
              file,
              type,
              filename: file.name,
              preload,
              ...place
          });
    const src = { id: srcId, type: existing ? existing.get('type') : type, path };
    const target = prior ?? deps.findTarget(src, name, related);

    // a refreshed target keeps its own name, folder and data, as the server leaves them alone; a target
    // re-import keeps its stored filename
    const filename = args.target ? (args.target.get('file.filename') ?? args.target.get('name')) : name;
    const id = await deps.upload({
        ...optOut(outMeta),
        asset: target,
        file: new File([blob], filename),
        type: src.type,
        filename,
        ...(target
            ? {}
            : {
                  name,
                  parent: path.length ? `${path[path.length - 1]}` : null,
                  source_asset_id: `${srcId}`,

                  // an update or re-import sends no preload, which the server's convert defaults to true
                  preload: existing ? true : preload,
                  data: options.rgbm ? { rgbm: true } : null,

                  // the server seeds a new target with the source meta: its alpha seeds meta.compress.alpha and its srgb (false
                  // for float sources) data.srgb
                  meta: { ...meta, srgb: !options.rgbm }
              })
    });
    await finish(id, srcId);
    return true;
};
