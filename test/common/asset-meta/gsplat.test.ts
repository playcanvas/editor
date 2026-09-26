import { deflateRawSync } from 'node:zlib';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import { gsplatMeta } from '../../../src/common/asset-meta/gsplat';

const ply = (elements: [string, number, string[]][], extra = '') => {
    const lines = ['ply', 'format binary_little_endian 1.0', 'comment made in a test'];
    for (const [name, count, props] of elements) {
        lines.push(`element ${name} ${count}`, ...props.map((p) => `property float ${p}`));
    }
    return new Blob([`${lines.join('\n')}${extra}\nend_header\n`, new Uint8Array(64)]);
};
const rest = (n: number) => Array.from({ length: n }, (_, i) => `f_rest_${i}`);

type Entry = { name: string; content: string; deflate?: boolean; raw?: number };

// zip of the given entries, stored or deflated; raw overrides the recorded uncompressed size
const zip = (entries: Entry[]) => {
    const locals: Buffer[] = [];
    const centrals: Buffer[] = [];
    let offset = 0;
    for (const { name, content, deflate = true, raw } of entries) {
        const data = deflate ? deflateRawSync(Buffer.from(content)) : Buffer.from(content);
        const n = Buffer.from(name);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(deflate ? 8 : 0, 8);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(raw ?? content.length, 22);
        local.writeUInt16LE(n.length, 26);
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(deflate ? 8 : 0, 10);
        central.writeUInt32LE(data.length, 20);
        central.writeUInt32LE(raw ?? content.length, 24);
        central.writeUInt16LE(n.length, 28);
        central.writeUInt32LE(offset, 42);
        locals.push(local, n, data);
        centrals.push(central, n);
        offset += 30 + n.length + data.length;
    }
    const size = centrals.reduce((s, b) => s + b.length, 0);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(size, 12);
    end.writeUInt32LE(offset, 16);
    return new Blob([...locals, ...centrals, end].map((b) => new Uint8Array(b)));
};

const META = JSON.stringify({ count: 5, shN: { bands: 2 }, means: { mins: [-1, -2, -3], maxs: [1, 2, 3] } });
const ZERO = { min: [0, 0, 0], max: [0, 0, 0] };

describe('gsplatMeta', () => {
    it('reads a ply header with one sh band', async () => {
        expect(await gsplatMeta(ply([['vertex', 10, ['x', 'y', 'z', ...rest(9)]]]), 'a.ply')).to.deep.equal({
            format: 'PLY',
            count: 10,
            bands: 1,
            bounds: ZERO,
            comments: [],
            elements: {}
        });
    });

    it('reads compressed ply', async () => {
        const meta = await gsplatMeta(ply([['chunk', 1, ['min_x']], ['vertex', 256, ['packed_position']], ['sh', 256, rest(24)]]), 'a.compressed.ply');
        expect(meta).to.include({ format: 'COMPRESSED.PLY', count: 256, bands: 2 });
    });

    it('maps all 45 coefficients to 3 bands', async () => {
        expect((await gsplatMeta(ply([['vertex', 1, rest(45)]]), 'a.ply'))?.bands).to.equal(3);
    });

    it('rejects headers the server rejects', async () => {
        for (const file of [ply([['vertex', 1, ['x']]], '\nobj_info nope'), new Blob(['nope\nend_header\n'])]) {
            let caught: unknown;
            await gsplatMeta(file, 'a.ply').catch((e) => {
                caught = e;
            });
            expect(caught).to.be.instanceOf(Error);
        }
    });

    for (const deflate of [true, false]) {
        it(`reads meta.json from a ${deflate ? 'deflated' : 'stored'} sog`, async () => {
            expect(await gsplatMeta(zip([{ name: 'means_l.webp', content: 'x' }, { name: 'meta.json', content: META, deflate }]), 'a.sog')).to.deep.equal({
                format: 'SOG',
                count: 5,
                bands: 2,
                bounds: { min: [-1, -2, -3], max: [1, 2, 3] },
                comments: [],
                elements: {}
            });
        });
    }

    it('returns the server placeholder for unparseable sog meta', async () => {
        expect(await gsplatMeta(zip([{ name: 'meta.json', content: '{' }]), 'a.sog')).to.include({ format: '?', count: -1, bands: -1 });
    });

    it('leaves zips yauzl refuses, or without meta.json, to the server', async () => {
        for (const entries of [
            [{ name: 'other.json', content: '{}' }],
            [{ name: '../evil', content: 'x' }, { name: 'meta.json', content: META }],
            [{ name: 'C:/evil', content: 'x' }, { name: 'meta.json', content: META }],
            [{ name: 'x', content: 'x', deflate: false, raw: 7 }, { name: 'meta.json', content: META }],
            [{ name: 'meta.json', content: META, raw: 3 }]
        ]) {
            expect(await gsplatMeta(zip(entries), 'a.sog')).to.equal(null);
        }

        // bytes after the end record make yauzl reject the comment length
        expect(await gsplatMeta(new Blob([zip([{ name: 'meta.json', content: META }]), 'junk']), 'a.sog')).to.equal(null);
    });

    it('picks the reader by name like the server', async () => {
        let caught: unknown;
        await gsplatMeta(zip([{ name: 'meta.json', content: META }]), 'a.ply').catch((e) => {
            caught = e;
        });
        expect(caught).to.be.instanceOf(Error);
    });
});
