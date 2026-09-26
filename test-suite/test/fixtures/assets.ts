import { crc32, deflateSync } from 'node:zlib';

const FLOAT = 5126;
const ALIGNMENT = 4;
const SPLAT_FIELDS = ['x', 'y', 'z', 'nx', 'ny', 'nz', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3'];
const BLOCK = 8;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// itu t.81 table k.3, the standard luminance dc table
const DC_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_VALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Float formats store `byte / 255 * HDR_SCALE`, so the brightest texel is well above one. */
export const HDR_SCALE = 4;

/** 1-based line of the `throw` in the third classic script. */
export const CLASSIC_THROW_LINE = 4;

const concat = (chunks: Buffer[]) => Buffer.concat(chunks.map(chunk => new Uint8Array(chunk)));

/** A grounded triangle, nested node and one translation clip; revision two doubles its width. */
export const model = (revision = 1) => {
    const arrays = [
        new Float32Array([-revision, 0, 0, revision, 0, 0, 0, 2, 0]),
        new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        new Uint16Array([0, 1, 2]),
        new Float32Array([0, 1, 2]),
        new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0])
    ];
    const chunks: Buffer[] = [];
    let offset = 0;
    const views = arrays.map((array) => {
        const bytes = Buffer.from(array.buffer);
        const view = { buffer: 0, byteOffset: offset, byteLength: bytes.length };
        const padding = (ALIGNMENT - bytes.length % ALIGNMENT) % ALIGNMENT;
        chunks.push(bytes, Buffer.alloc(padding));
        offset += bytes.length + padding;
        return view;
    });
    const binary = concat(chunks);
    const document = {
        asset: { version: '2.0', generator: 'PlayCanvas Editor E2E fixture' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ name: 'FixtureRoot', children: [1] }, { name: 'FixtureTriangle', mesh: 0 }],
        meshes: [{ name: 'FixtureTriangle', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
        materials: [{ name: 'FixtureRed', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1], metallicFactor: 0, roughnessFactor: 1 } }],
        animations: [{ name: 'FixtureBounce', samplers: [{ input: 3, output: 4, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 1, path: 'translation' } }] }],
        buffers: [{ byteLength: binary.length }],
        bufferViews: views,
        accessors: [
            { bufferView: 0, componentType: FLOAT, count: 3, type: 'VEC3', min: [-revision, 0, 0], max: [revision, 2, 0] },
            { bufferView: 1, componentType: FLOAT, count: 3, type: 'VEC3' },
            { bufferView: 2, componentType: 5123, count: 3, type: 'SCALAR' },
            { bufferView: 3, componentType: FLOAT, count: 3, type: 'SCALAR', min: [0], max: [2] },
            { bufferView: 4, componentType: FLOAT, count: 3, type: 'VEC3' }
        ]
    };
    const json = Buffer.from(JSON.stringify(document));
    const padded = concat([json, Buffer.alloc((ALIGNMENT - json.length % ALIGNMENT) % ALIGNMENT, ' ')]);
    const header = Buffer.alloc(20);
    header.write('glTF');
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + padded.length + binary.length, 8);
    header.writeUInt32LE(padded.length, 12);
    header.write('JSON', 16);
    const bin = Buffer.alloc(8);
    bin.writeUInt32LE(binary.length);
    bin.writeUInt32LE(0x004E4942, 4);
    return concat([header, padded, bin, binary]);
};

/** Nine opaque red gaussians in a three-by-three grid, with no higher-order harmonics. */
export const splat = () => {
    const header = `ply\nformat binary_little_endian 1.0\nelement vertex 9\n${SPLAT_FIELDS.map(name => `property float ${name}`).join('\n')}\nend_header\n`;
    const data = Buffer.alloc(9 * SPLAT_FIELDS.length * ALIGNMENT);
    for (let index = 0; index < 9; index++) {
        const values = [index % 3 - 1, Math.floor(index / 3), 0, 0, 0, 0, 1.772454, -1.772454, -1.772454, 8, -1.5, -1.5, -1.5, 1, 0, 0, 0];
        values.forEach((value, field) => data.writeFloatLE(value, (index * SPLAT_FIELDS.length + field) * ALIGNMENT));
    }
    return concat([Buffer.from(header), data]);
};

export type TextureFormat = 'png' | 'jpeg' | 'tga' | 'bmp' | 'hdr' | 'exr';

export type TextureOptions = { width: number; height: number; alpha: boolean; format: TextureFormat; blocks?: boolean };

const chunk = (type: string, data: Buffer) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, 'ascii');
    out.set(data, 8);
    out.writeUInt32BE(crc32(new Uint8Array(out.subarray(4, 8 + data.length))), 8 + data.length);
    return out;
};

const png = (width: number, height: number, px: Uint8Array, alpha: boolean) => {
    const channels = alpha ? 4 : 3;
    const stride = width * channels + 1;
    const raw = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (let c = 0; c < channels; c++) {
                raw[y * stride + 1 + x * channels + c] = px[(y * width + x) * 4 + c];
            }
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.set([8, alpha ? 6 : 2, 0, 0, 0], 8);
    return concat([Buffer.from(PNG_SIGNATURE), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(new Uint8Array(raw))), chunk('IEND', Buffer.alloc(0))]);
};

const huffman = (counts: number[], vals: number[]) => {
    const codes: { code: number; len: number }[] = [];
    let code = 0;
    let k = 0;
    counts.forEach((n, i) => {
        for (let j = 0; j < n; j++) {
            codes[vals[k++]] = { code: code++, len: i + 1 };
        }
        code <<= 1;
    });
    return codes;
};

const bitWriter = () => {
    const out: number[] = [];
    let acc = 0;
    let n = 0;
    const put = (code: number, len: number) => {
        for (let i = len - 1; i >= 0; i--) {
            acc = (acc << 1) | ((code >> i) & 1);
            if (++n === 8) {
                out.push(acc);

                // a 0xff byte in entropy-coded data is followed by a stuffed zero
                if (acc === 0xff) {
                    out.push(0);
                }
                acc = 0;
                n = 0;
            }
        }
    };
    const end = () => {
        if (n) {
            put(2 ** (8 - n) - 1, 8 - n);
        }
        return Buffer.from(out);
    };
    return { put, end };
};

// baseline 4:4:4, quantizer 1, dc-only blocks; ycbcr rounding makes rgb approximate
const jpeg = (width: number, height: number, px: Uint8Array) => {
    const dc = huffman(DC_BITS, DC_VALS);
    const w = bitWriter();
    const prev = [0, 0, 0];
    for (let by = 0; by < Math.ceil(height / BLOCK); by++) {
        for (let bx = 0; bx < Math.ceil(width / BLOCK); bx++) {
            const i = (by * BLOCK * width + bx * BLOCK) * 4;
            const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
            const ycc = [
                0.299 * r + 0.587 * g + 0.114 * b,
                128 - 0.168736 * r - 0.331264 * g + 0.5 * b,
                128 + 0.5 * r - 0.418688 * g - 0.081312 * b
            ];
            ycc.forEach((v, c) => {
                const q = Math.round(8 * (v - 128));
                const d = q - prev[c];
                prev[c] = q;
                let s = 0;
                for (let a = Math.abs(d); a; a >>= 1) {
                    s++;
                }
                w.put(dc[s].code, dc[s].len);
                if (s) {
                    w.put(d < 0 ? d + (1 << s) - 1 : d, s);
                }

                // end of block: the single code of the ac table
                w.put(0, 1);
            });
        }
    }
    const u16 = (v: number) => [v >> 8, v & 0xff];
    const seg = (marker: number, body: number[]) => Buffer.from([0xff, marker, ...u16(body.length + 2), ...body]);
    return concat([
        Buffer.from([0xff, 0xd8]),
        seg(0xe0, [0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]),
        seg(0xdb, [0, ...new Array(64).fill(1)]),
        seg(0xc0, [8, ...u16(height), ...u16(width), 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0]),
        seg(0xc4, [0x00, ...DC_BITS, ...DC_VALS]),
        seg(0xc4, [0x10, 1, ...new Array(15).fill(0), 0]),
        seg(0xda, [3, 1, 0, 2, 0, 3, 0, 0, 63, 0]),
        w.end(),
        Buffer.from([0xff, 0xd9])
    ]);
};

const tga = (width: number, height: number, px: Uint8Array, alpha: boolean) => {
    const bpp = alpha ? 4 : 3;
    const out = Buffer.alloc(18 + width * height * bpp);
    out[2] = 2;
    out.writeUInt16LE(width, 12);
    out.writeUInt16LE(height, 14);
    out[16] = bpp * 8;

    // alpha bit count in the low nibble; origin bit clear, so rows run bottom-up
    out[17] = alpha ? 8 : 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const s = (y * width + x) * 4;
            const d = 18 + ((height - 1 - y) * width + x) * bpp;
            out.set([px[s + 2], px[s + 1], px[s], ...(alpha ? [px[s + 3]] : [])], d);
        }
    }
    return out;
};

const bmp = (width: number, height: number, px: Uint8Array, alpha: boolean) => {
    const bpp = alpha ? 4 : 3;
    const stride = Math.ceil(width * bpp / 4) * 4;
    const size = stride * height;
    const header = alpha ? 108 : 40;
    const offset = 14 + header;
    const out = Buffer.alloc(offset + size);
    out.write('BM', 0, 'ascii');
    out.writeUInt32LE(offset + size, 2);
    out.writeUInt32LE(offset, 10);
    out.writeUInt32LE(header, 14);
    out.writeInt32LE(width, 18);

    // a positive height means rows run bottom-up
    out.writeInt32LE(height, 22);
    out.writeUInt16LE(1, 26);
    out.writeUInt16LE(bpp * 8, 28);
    out.writeUInt32LE(size, 34);
    if (alpha) {

        // v4 rgba masks and srgb let browsers retain alpha with bi_rgb
        [0xff0000, 0xff00, 0xff, 0xff000000, 0x73524742].forEach((v, i) => out.writeUInt32LE(v, 54 + i * 4));
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const s = (y * width + x) * 4;
            out.set([px[s + 2], px[s + 1], px[s], ...(alpha ? [px[s + 3]] : [])], offset + (height - 1 - y) * stride + x * bpp);
        }
    }
    return out;
};

const float = (px: Uint8Array, i: number) => px[i] / 255 * HDR_SCALE;

const rgbe = (r: number, g: number, b: number) => {
    const v = Math.max(r, g, b);
    if (v < 1e-32) {
        return [0, 0, 0, 0];
    }
    const e = Math.floor(Math.log2(v)) + 1;
    const f = 256 / 2 ** e;
    return [Math.floor(r * f), Math.floor(g * f), Math.floor(b * f), e + 128];
};

// flat scanlines: the brightest channel's mantissa is >= 128, so no pixel reads as an rle marker
const hdr = (width: number, height: number, px: Uint8Array) => {
    const body = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        body.set(rgbe(float(px, i * 4), float(px, i * 4 + 1), float(px, i * 4 + 2)), i * 4);
    }
    return concat([Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`), body]);
};

const i32 = (...v: number[]) => {
    const b = Buffer.alloc(4 * v.length);
    v.forEach((x, i) => b.writeInt32LE(x, i * 4));
    return b;
};

const f32 = (...v: number[]) => {
    const b = Buffer.alloc(4 * v.length);
    v.forEach((x, i) => b.writeFloatLE(x, i * 4));
    return b;
};

const attr = (name: string, type: string, value: Buffer) => concat([Buffer.from(`${name}\0${type}\0`), i32(value.length), value]);

// single-part scanline exr, compression none, float B/G/R (openexr stores channels alphabetically)
const exr = (width: number, height: number, px: Uint8Array) => {
    const names = ['B', 'G', 'R'];
    const chlist = concat([...names.map(n => concat([Buffer.from(`${n}\0`), i32(2), Buffer.alloc(4), i32(1, 1)])), Buffer.alloc(1)]);
    const box = i32(0, 0, width - 1, height - 1);
    const header = concat([
        Buffer.from([0x76, 0x2f, 0x31, 0x01]),
        i32(2),
        attr('channels', 'chlist', chlist),
        attr('compression', 'compression', Buffer.alloc(1)),
        attr('dataWindow', 'box2i', box),
        attr('displayWindow', 'box2i', box),
        attr('lineOrder', 'lineOrder', Buffer.alloc(1)),
        attr('pixelAspectRatio', 'float', f32(1)),
        attr('screenWindowCenter', 'v2f', f32(0, 0)),
        attr('screenWindowWidth', 'float', f32(1)),
        Buffer.alloc(1)
    ]);
    const size = width * 4 * names.length;
    const table = Buffer.alloc(8 * height);
    const lines = Array.from({ length: height }, (_, y) => {
        table.writeBigUInt64LE(BigInt(header.length + table.length + y * (8 + size)), y * 8);
        const line = Buffer.alloc(8 + size);
        line.writeInt32LE(y, 0);
        line.writeInt32LE(size, 4);
        names.forEach((_n, c) => {
            for (let x = 0; x < width; x++) {
                line.writeFloatLE(float(px, (y * width + x) * 4 + 2 - c), 8 + (c * width + x) * 4);
            }
        });
        return line;
    });
    return concat([header, table, ...lines]);
};

const ENCODERS: Record<TextureFormat, (width: number, height: number, px: Uint8Array, alpha: boolean) => Buffer> = { png, jpeg, tga, bmp, hdr, exr };

/**
 * The RGBA a `texture()` call targets: red ramps with x, green with y, blue is an 8px checker,
 * alpha (when asked) falls from the top-left corner. `blocks`, forced on for jpeg, holds each
 * 8×8 block at its top-left texel.
 */
export const pixels = ({ width, height, alpha, format, blocks }: TextureOptions) => {
    const flat = format === 'jpeg' || !!blocks;
    const fx = Math.max(1, width - 1);
    const fy = Math.max(1, height - 1);
    const px = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const sx = flat ? x - x % BLOCK : x;
            const sy = flat ? y - y % BLOCK : y;
            px.set([
                Math.round(sx * 255 / fx),
                Math.round(sy * 255 / fy),
                ((sx >> 3) + (sy >> 3)) % 2 ? 200 : 40,
                alpha ? 255 - Math.round((sx + sy) * 255 / (fx + fy)) : 255
            ], (y * width + x) * 4);
        }
    }
    return px;
};

/** A deterministic texture in any format the server pipeline imports. */
export const texture = (opts: TextureOptions) => {
    if (opts.alpha && ['jpeg', 'hdr', 'exr'].includes(opts.format)) {
        throw new Error(`${opts.format} fixtures have no alpha`);
    }
    return ENCODERS[opts.format](opts.width, opts.height, pixels(opts), opts.alpha);
};

/** A tangent-space normal map: a gentle bump in red/green, blue near 255, as an opaque png. */
export const normalMap = ({ width, height }: { width: number; height: number }) => {
    const px = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const nx = 0.5 * Math.sin(2 * Math.PI * x / width);
            const ny = 0.5 * Math.cos(2 * Math.PI * y / height);
            const nz = Math.sqrt(1 - nx * nx - ny * ny);
            px.set([nx, ny, nz].map(n => Math.round((n * 0.5 + 0.5) * 255)).concat(255), (y * width + x) * 4);
        }
    }
    return png(width, height, px, false);
};

/**
 * Three classic scripts, `<tag>-a.js` to `<tag>-c.js`. Each pushes its file name onto
 * `window.__e2eOrder` when it loads and onto `window.__e2eInit` when an entity initializes it;
 * `<tag>-c.js` throws from `initialize` instead, at `CLASSIC_THROW_LINE`.
 */
export const classicScripts = (tag = 'fixture') => ['a', 'b', 'c'].map((s) => {
    const name = `${tag}-${s}.js`;
    const id = `${tag}_${s}`.replace(/\W/g, '_');
    const init = s === 'c' ? `    throw new Error('${name} failed');` : `    (window.__e2eInit = window.__e2eInit || []).push('${name}');`;
    const text = [
        `var ${id} = pc.createScript('${id}');`,
        `(window.__e2eOrder = window.__e2eOrder || []).push('${name}');`,
        `${id}.prototype.initialize = function () {`,
        init,
        '};',
        ''
    ].join('\n');
    return { name, mimeType: 'text/javascript', buffer: Buffer.from(text) };
});
