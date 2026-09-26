// sizes, fit and quality match the server's thumbnails
export const THUMBNAIL_SIZES = [
    { name: 'xlarge', size: 512 },
    { name: 'large', size: 256 },
    { name: 'medium', size: 128 },
    { name: 'small', size: 64 }
];

export const THUMBNAIL_QUALITY = 0.75;

type ThumbnailDeps = {
    generate: (buffer: ArrayBuffer, rgbm: boolean) => Promise<ArrayBuffer[]>;
    upload: (id: number, thumbs: Record<string, Blob>) => Promise<unknown>;
    fallback: (id: number, err: unknown) => void;
};

/**
 * Decodes rgbm pixels (rgba8, unpremultiplied) into an opaque srgb preview, in place. Same math as
 * the job: it flattens alpha into rgb, so a pixel decodes to min(1, ((rgb * a * 8) ^ 2) ^ (1 / 2.2)).
 *
 * @param px - Pixel data from getImageData
 * @returns The same array
 */
export const decodeRgbm = (px: Uint8ClampedArray) => {
    for (let i = 0; i < px.length; i += 4) {
        const a = px[i + 3] / 255;
        for (let c = 0; c < 3; c++) {
            const v = (px[i + c] / 255) * 8 * a;
            px[i + c] = Math.min(1, Math.pow(v * v, 1 / 2.2)) * 255;
        }
        px[i + 3] = 255;
    }
    return px;
};

/**
 * Whether an upload's thumbnails should be made by the editor. Only noConvert uploads qualify:
 * server conversion resets has_thumbnail itself and would wipe them. Unconditional for every
 * supported input; a caller that already owns thumbnails opts out with noThumbnails.
 *
 * @param type - Asset type
 * @param noConvert - Whether the upload skips server conversion
 * @param file - The uploaded file
 * @param noThumbnails - Set by a caller that makes the thumbnails itself
 * @returns True to send noThumbnails and generate on the client
 */
export const wantsClientThumbnails = (
    type: string | undefined,
    noConvert: boolean | undefined,
    file: Blob | undefined,
    noThumbnails?: boolean
) => !noThumbnails && !!noConvert && !!file?.size && (type === 'texture' || type === 'textureatlas');

/**
 * Whether a `:set` on a synced observer is a remote op being applied (ObserverSync.write disables
 * sync while it sets).
 *
 * @param asset - Asset observer
 * @returns True when another client made the change
 */
export const isRemoteWrite = (asset: { sync?: { enabled: boolean } }) => !!asset.sync && !asset.sync.enabled;

/**
 * Serial generate-and-upload queue. Any failure falls back to the server job so a texture never
 * ends up without thumbnails.
 *
 * @param deps - Worker, upload and fallback implementations
 * @returns Enqueue function resolving once that texture is done (or has fallen back)
 */
export const createThumbnailQueue = ({ generate, upload, fallback }: ThumbnailDeps) => {
    // one texture at a time: a full-size decode can take hundreds of mb
    let tail: Promise<void> = Promise.resolve();

    // rgbm: whether source is rgbm-encoded; defaults to the asset's flag (a decoded preview passes false)
    return (asset: { get: (path: string) => unknown }, source: Blob, rgbm = !!asset.get('data.rgbm')) => {
        const id = asset.get('id') as number;
        const run = async () => {
            const out = await generate(await source.arrayBuffer(), rgbm);
            const thumbs = Object.fromEntries(
                THUMBNAIL_SIZES.map(({ name }, i) => [name, new Blob([out[i]], { type: 'image/jpeg' })])
            );
            await upload(id, thumbs);
        };
        const p = tail.then(run).catch((err) => fallback(id, err));
        tail = p;
        return p;
    };
};
