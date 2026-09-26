export type Rgba = { data: Uint8Array; width: number; height: number };

export type Float = { data: Float32Array; width: number; height: number };

const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));

// tga/bmp come off disk bottom-up; the server flips them with sharp().flip()
export const flipRows = ({ data, width, height }: Rgba) => {
    const out = new Uint8Array(data.length);
    const row = width * 4;
    for (let y = 0; y < height; y++) {
        out.set(data.subarray(y * row, (y + 1) * row), (height - 1 - y) * row);
    }
    return { data: out, width, height };
};

// 16-bit png (fast-png decode) to rgba8, the depth convert the server does with toColourspace('srgb')
export const from16 = ({
    data,
    width,
    height,
    channels
}: {
    data: Uint16Array;
    width: number;
    height: number;
    channels: number;
}) => {
    const n = width * height;
    const out = new Uint8Array(n * 4);
    const grey = channels <= 2;
    const alpha = channels === 2 || channels === 4;
    for (let i = 0; i < n; i++) {
        const s = i * channels;
        const o = i * 4;
        out[o] = data[s] >> 8;
        out[o + 1] = data[grey ? s : s + 1] >> 8;
        out[o + 2] = data[grey ? s : s + 2] >> 8;
        out[o + 3] = alpha ? data[s + channels - 1] >> 8 : 255;
    }
    return { data: out, width, height };
};

// rgba8 to the rgb/rgba sharp writes: it converts back to srgb on output, so grey sources get 3 channels too
export const pack = (rgba: Uint8Array, alpha: boolean) => {
    if (alpha) {
        return rgba;
    }
    const n = rgba.length / 4;
    const out = new Uint8Array(n * 3);
    for (let i = 0; i < n; i++) {
        out[i * 3] = rgba[i * 4];
        out[i * 3 + 1] = rgba[i * 4 + 1];
        out[i * 3 + 2] = rgba[i * 4 + 2];
    }
    return out;
};

// the server's rgbm encoding
export const encodeRGBM = (r: number, g: number, b: number) => {
    const rf = Math.pow(r, 0.5) / 8;
    const gf = Math.pow(g, 0.5) / 8;
    const bf = Math.pow(b, 0.5) / 8;
    const af = Math.ceil(Math.min(1, Math.max(rf, gf, bf, 1 / 255)) * 255) / 255;
    return [Math.min(rf / af, 1), Math.min(gf / af, 1), Math.min(bf / af, 1), af];
};

// uint8array stores truncate like the server's Buffer; a clamped array would round and drift
export const toRgbm = ({ data, width, height }: Float) => {
    const out = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        const e = encodeRGBM(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        out[i * 4] = Math.min(255, 256 * e[0]);
        out[i * 4 + 1] = Math.min(255, 256 * e[1]);
        out[i * 4 + 2] = Math.min(255, 256 * e[2]);
        out[i * 4 + 3] = Math.min(255, 256 * e[3]);
    }
    return out;
};

// the server's float -> 8-bit tonemap, used for previews
export const tonemap = ({ data, width, height }: Float) => {
    const out = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height * 3; i++) {
        const v = Math.max(0, data[i]);
        out[i] = Math.min(255, Math.pow(v / (1 + v), 1 / 2.2) * 255);
    }
    return out;
};

const lanczos3 = (x: number) => {
    if (x === 0) {
        return 1;
    }
    if (x <= -3 || x >= 3) {
        return 0;
    }
    const px = Math.PI * x;
    return (3 * Math.sin(px) * Math.sin(px / 3)) / (px * px);
};

// catmull-rom, libvips' bicubic interpolator
const cubic = (x: number) => {
    const a = Math.abs(x);
    return a < 1 ? 1.5 * a ** 3 - 2.5 * a ** 2 + 1 : a < 2 ? -0.5 * a ** 3 + 2.5 * a ** 2 - 4 * a + 2 : 0;
};

type Taps = { idx: number[]; w: number[] }[];

const edge = (j: number, n: number) => Math.min(n - 1, Math.max(0, j));

// libvips reduce: normalized lanczos3 around pixel centres, widened by the scale, edges extended
const reduce = (src: number, dst: number) => {
    const scale = src / dst;
    return Array.from({ length: dst }, (_, i) => {
        const c = (i + 0.5) * scale;
        const idx = [];
        const w = [];
        for (let j = Math.floor(c - 3 * scale); j < Math.ceil(c + 3 * scale); j++) {
            idx.push(edge(j, src));
            w.push(lanczos3((j + 0.5 - c) / scale));
        }
        const sum = w.reduce((a, b) => a + b, 0);
        return { idx, w: w.map((v) => v / sum) };
    });
};

// libvips resize upsizes with an affine: bicubic sampled at i * scale - 0.5, edges extended
const upsize = (src: number, dst: number) => {
    const scale = src / dst;
    return Array.from({ length: dst }, (_, i) => {
        const p = i * scale - 0.5;
        const f = Math.floor(p);
        const idx = [];
        const w = [];
        for (let j = f - 1; j <= f + 2; j++) {
            idx.push(edge(j, src));
            w.push(cubic(p - j));
        }
        return { idx, w };
    });
};

// one separable pass over rgba floats, along x or y
const pass = (px: Float32Array, sw: number, sh: number, taps: Taps, alongX: boolean) => {
    const w = alongX ? taps.length : sw;
    const h = alongX ? sh : taps.length;
    const out = new Float32Array(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const t = taps[alongX ? x : y];
            const o = (y * w + x) * 4;
            for (let k = 0; k < t.w.length; k++) {
                const s = (alongX ? y * sw + t.idx[k] : t.idx[k] * sw + x) * 4;
                out[o] += px[s] * t.w[k];
                out[o + 1] += px[s + 1] * t.w[k];
                out[o + 2] += px[s + 2] * t.w[k];
                out[o + 3] += px[s + 3] * t.w[k];
            }
        }
    }
    return out;
};

// libvips resamples uchar images, so every op rounds its result
const quantize = (px: Float32Array) => {
    for (let i = 0; i < px.length; i++) {
        px[i] = clamp(px[i]);
    }
    return px;
};

/**
 * Port of sharp's resize(w, h, { fit: 'fill' }) over the pow2 range (under 2x either way). sharp
 * premultiplies alpha and casts back to uchar, libvips reduces each shrinking axis (y, then x) with lanczos3 and
 * then upsizes with one bicubic affine, and sharp unpremultiplies and casts again. Within a level or
 * so of libvips (its fixed-point taps are not copied), more where low alpha amplifies that.
 */
export const resizeRgba = ({ data, width: sw, height: sh }: Rgba, width: number, height: number) => {
    // uchar casts truncate
    let px: Float32Array = new Float32Array(sw * sh * 4);
    for (let i = 0; i < sw * sh; i++) {
        const a = data[i * 4 + 3] / 255;
        px[i * 4] = Math.trunc(data[i * 4] * a);
        px[i * 4 + 1] = Math.trunc(data[i * 4 + 1] * a);
        px[i * 4 + 2] = Math.trunc(data[i * 4 + 2] * a);
        px[i * 4 + 3] = data[i * 4 + 3];
    }

    let w = sw;
    let h = sh;
    // libvips reduces vertically first (reducev, then reduceh)
    if (height < h) {
        px = quantize(pass(px, w, h, reduce(h, height), false));
        h = height;
    }
    if (width < w) {
        px = quantize(pass(px, w, h, reduce(w, width), true));
        w = width;
    }

    // the affine covers both axes, so an axis already at size still shifts by half a pixel
    if (width > w || height > h) {
        px = quantize(pass(pass(px, w, h, upsize(w, width), true), width, h, upsize(h, height), false));
    }

    const out = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        const a = px[i * 4 + 3];
        const n = a > 0 ? 255 / a : 0;
        out[i * 4] = Math.min(255, Math.trunc(px[i * 4] * n));
        out[i * 4 + 1] = Math.min(255, Math.trunc(px[i * 4 + 1] * n));
        out[i * 4 + 2] = Math.min(255, Math.trunc(px[i * 4 + 2] * n));
        out[i * 4 + 3] = a;
    }
    return { data: out, width, height };
};
