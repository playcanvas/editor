// upload types whose upload runs a server meta job the editor can compute instead
// (animation has no upload-time meta job, so it is not here)
const KINDS: Record<string, string> = { texture: 'texture', textureatlas: 'texture', model: 'model', gsplat: 'gsplat' };

const TEXTURE_KEYS = ['format', 'type', 'width', 'height', 'alpha', 'depth', 'srgb'];

type Meta = Record<string, any>;

/**
 * The assets:meta:* kind to compute before uploading, or null to leave meta to the server. A
 * converted texture is left to the server too: its conversion reads the meta as soon as the upload
 * lands, before the editor could write it. A caller that already set noMeta owns that upload's meta.
 *
 * @param args - assets:uploadFile arguments
 */
export const metaKind = (args: { type?: string; file?: Blob; noMeta?: boolean; noConvert?: boolean }) => {
    const kind = (args.file && !args.noMeta && KINDS[args.type]) || null;
    return kind === 'texture' && !args.noConvert ? null : kind;
};

/**
 * The { path, value } writes that store computed meta the way the server's meta job does: the whole
 * meta, except that a texture with compression settings keeps them (only its normal-map flag is
 * refreshed) and a model keeps its user mapping.
 *
 * @param type - asset type
 * @param prev - the asset's current meta
 * @param meta - the computed meta
 */
export const metaWrites = (type: string, prev: Meta | null, meta: Meta) => {
    if (KINDS[type] === 'texture') {
        // interlaced is the asset's setting, not the file's, except for float images
        const tex = Object.fromEntries(TEXTURE_KEYS.map((k) => [k, meta[k]]));
        tex.interlaced = meta.format !== 'hdr' && !!prev?.interlaced;
        if (!prev?.compress) {
            return [{ path: 'meta', value: tex as unknown }];
        }
        return [
            ...Object.entries(tex).map(([k, v]) => ({ path: `meta.${k}`, value: v as unknown })),
            { path: 'meta.compress.normals', value: !!meta.compress?.normals }
        ];
    }
    const value = type === 'model' && prev?.userMapping ? { ...meta, userMapping: prev.userMapping } : meta;
    return [{ path: 'meta', value: value as unknown }];
};
