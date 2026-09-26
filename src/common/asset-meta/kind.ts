// upload types whose pipeline.asset.upload runs a meta job the editor can compute instead
// (animation has no upload-time meta job, so it is not here)
const KINDS: Record<string, string> = { texture: 'texture', textureatlas: 'texture', model: 'model', gsplat: 'gsplat' };

/**
 * The assets:meta:* kind to compute before uploading, or null to leave meta to the server. A
 * caller that already set noMeta owns that upload's meta.
 *
 * @param args - assets:uploadFile arguments
 */
export const metaKind = (args: { type?: string; file?: Blob; noMeta?: boolean }) =>
    (args.file && !args.noMeta && KINDS[args.type]) || null;
