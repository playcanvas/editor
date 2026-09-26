export type TextureMeta = {
    format?: string;
    type?: string;
    width?: number;
    height?: number;
    alpha?: boolean;
    depth?: number;

    // an embedded non-srgb colour profile (worker decision meta only); sharp converts it to srgb when it processes
    icc?: boolean;
};

export type TextureOptions = {
    format: string;
    rgbm?: boolean;
    size?: { width: number; height: number };
    depthConvert?: boolean;
};

// source formats the worker decodes; anything else takes the server pipeline. avif is excluded:
// jsquash decodes it to 8-bit rgba, so its depth and alpha can't be matched to sharp's meta
export const CLIENT_SOURCES = ['png', 'jpeg', 'webp', 'tga', 'bmp', 'hdr', 'exr'];

// target formats the worker encodes
export const CLIENT_TARGETS = ['png', 'jpeg', 'webp'];

// largest source or pow2 target converted in the browser (a float hdr this size is ~200mb)
export const MAX_PIXELS = 4096 * 4096;

export const MAX_BYTES = 64 * 1024 * 1024;

const FLOAT_SOURCES = ['hdr', 'exr'];

export const normalize = (format?: string) => (format === 'jpg' ? 'jpeg' : format);

export const nearestPow2 = (size: number) => Math.pow(2, Math.round(Math.log2(size)));

/**
 * Port of getTextureOptions in services/assets-server/lib/assets.ts. Both are pinned by
 * texture-options-cases.json, so change them together.
 */
export const textureOptions = (meta: TextureMeta | null, pow2: boolean) => {
    if (!meta) {
        return null;
    }
    const format = normalize(meta.format);
    const options: TextureOptions = { format: 'jpeg' };

    if (['gif', 'avif', 'webp'].includes(format)) {
        options.format = format;
    } else if (format === 'png' || meta.alpha || meta.depth > 8) {
        options.format = 'png';
    }

    if (options.format === 'png' && meta.depth > 8 && ['hdr', 'exr', 'tiff'].includes(format)) {
        options.rgbm = true;
    }

    if (pow2) {
        const width = nearestPow2(meta.width);
        const height = nearestPow2(meta.height);
        if (width !== meta.width || height !== meta.height) {
            options.size = { width, height };
        }
    }

    if (format === options.format && meta.depth > 8) {
        options.depthConvert = true;
    }

    return options;
};

// true when the worker can produce what the server would
export const canConvert = (meta: TextureMeta, options: TextureOptions, bytes: number) => {
    const format = normalize(meta.format);
    if (!CLIENT_SOURCES.includes(format) || !CLIENT_TARGETS.includes(options.format)) {
        return false;
    }

    // float sources are only ever rgbm-encoded, never tonemapped into a target
    if (FLOAT_SOURCES.includes(format) !== !!options.rgbm) {
        return false;
    }

    // the codecs ignore colour profiles, so only an untouched upload of a non-srgb profiled file stays in the editor
    if (meta.icc && needsProcess(options)) {
        return false;
    }
    const pixels = Math.max(meta.width * meta.height, options.size ? options.size.width * options.size.height : 0);
    return bytes <= MAX_BYTES && pixels > 0 && pixels <= MAX_PIXELS;
};

export const isInPlace = (meta: TextureMeta, options: TextureOptions) => normalize(meta.format) === options.format;

export const needsProcess = (options: TextureOptions) => !!(options.size || options.depthConvert);

// the server names targets path.parse(name).name + '.' + format (e.g. rock.tga -> rock.jpeg, .tga -> .tga.jpeg)
export const targetName = (name: string, format: string) => `${name.replace(/(?!^)\.[^.]*$/, '')}.${format}`;
