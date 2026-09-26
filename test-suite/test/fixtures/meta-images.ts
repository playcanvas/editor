import { crc32, deflateSync } from 'node:zlib';

import type { Page } from '@playwright/test';
import { strToU8, zipSync } from 'fflate';

// png colour types
export const GREY = 0;
export const RGB = 2;
export const GREY_ALPHA = 4;
export const RGBA = 6;

const CHANNELS: Record<number, number> = { [GREY]: 1, [RGB]: 3, [GREY_ALPHA]: 2, [RGBA]: 4 };
const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// fflate writes dos dates, which only cover 1980-2099; a fixed date keeps the bytes stable
const ZIP_MTIME = new Date(2020, 0, 1);

// these node types don't take a Buffer as a Uint8Array, so concat plain views
const concat = (parts: Buffer[]) => Buffer.concat(parts.map(b => new Uint8Array(b)));

const chunk = (type: string, data: Buffer) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(new Uint8Array(concat([head.subarray(4), data]))) >>> 0, 0);
    return concat([head, data, crc]);
};

/** A non-interlaced png of any colour type at 8 or 16 bits; `pixel` returns one sample per channel. */
export const png = ({ width, height, color, depth = 8, pixel }: {
    width: number;
    height: number;
    color: number;
    depth?: 8 | 16;
    pixel: (x: number, y: number) => number[];
}) => {
    const bytes = depth / 8;
    const stride = 1 + width * CHANNELS[color] * bytes;
    const raw = Buffer.alloc(stride * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            pixel(x, y).forEach((v, c) => {
                const at = y * stride + 1 + (x * CHANNELS[color] + c) * bytes;
                if (bytes === 2) {
                    raw.writeUInt16BE(v, at);
                } else {
                    raw[at] = v;
                }
            });
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = depth;
    ihdr[9] = color;
    return concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(new Uint8Array(raw))), chunk('IEND', Buffer.alloc(0))]);
};

/** The smallest sog gsplat-meta reads: a zip holding only meta.json, stored with a fixed date so its bytes are stable. */
export const sog = () => Buffer.from(zipSync({
    'meta.json': strToU8(JSON.stringify({ count: 9, shN: { bands: 0 }, means: { mins: [-1, 0, -1], maxs: [1, 0, 1] } }))
}, { mtime: ZIP_MTIME, level: 0 }));

/** A one-triangle model in the json format the uv unwrap uploads as type model. */
export const legacyModel = () => Buffer.from(JSON.stringify({
    model: {
        version: 3,
        nodes: [
            { name: 'root', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            { name: 'tri', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }
        ],
        parents: [-1, 0],
        skins: [],
        vertices: [{
            position: { type: 'float32', components: 3, data: [0, 0, 0, 1, 0, 0, 0, 1, 0] },
            normal: { type: 'float32', components: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1] }
        }],
        meshes: [{ aabb: { min: [0, 0, 0], max: [1, 1, 0] }, vertices: 0, indices: [0, 1, 2], type: 'triangles', base: 0, count: 3 }],
        meshInstances: [{ node: 1, mesh: 0 }]
    }
}));

/** Lossy webp with alpha, encoded by the browser (node has no webp encoder). */
export const webp = (page: Page) => page.evaluate(async () => {
    const canvas = new OffscreenCanvas(4, 4);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 4, 4);
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 });
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
}).then(bytes => Buffer.from(bytes));
