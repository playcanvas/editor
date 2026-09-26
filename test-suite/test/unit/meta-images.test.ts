import { inflateSync } from 'node:zlib';

import { expect, test } from '@playwright/test';

import { readZip } from '../../lib/parity';
import { GREY_ALPHA, png, RGB, sog } from '../fixtures/meta-images';
import { getField, setField } from '../ui/parity/asset-meta.cases';

const TYPE = 'multipart/form-data; boundary=XyZ';
const BODY = Buffer.from('--XyZ\r\nContent-Disposition: form-data; name="type"\r\n\r\ntexture\r\n--XyZ\r\nContent-Disposition: form-data; name="name"\r\n\r\na.png\r\n--XyZ--\r\n');

test.describe('meta image fixtures', () => {
    test('png writes the requested colour type, depth and samples', () => {
        const buf = png({ width: 2, height: 1, color: RGB, depth: 16, pixel: x => [x, 2, 65535] });
        expect([buf.readUInt32BE(16), buf.readUInt32BE(20), buf[24], buf[25]]).toEqual([2, 1, 16, RGB]);
        const idat = buf.subarray(8 + 25 + 8, buf.length - 12 - 4);
        const raw = inflateSync(new Uint8Array(idat));
        expect([...raw]).toEqual([0, 0, 0, 0, 2, 255, 255, 0, 1, 0, 2, 255, 255]);
        expect(png({ width: 1, height: 1, color: GREY_ALPHA, pixel: () => [1, 2] })[25]).toBe(GREY_ALPHA);
    });

    test('sog is a stable zip holding only meta.json', () => {
        expect(sog().equals(new Uint8Array(sog()))).toBe(true);
        const entries = readZip(sog());
        expect(Object.keys(entries)).toEqual(['meta.json']);
        expect(JSON.parse(entries['meta.json'].toString()).count).toBe(9);
    });

    test('multipart fields read and rewrite in place', () => {
        expect(getField(BODY, TYPE, 'name')).toBe('a.png');
        expect(getField(BODY, TYPE, 'meta')).toBeNull();
        const next = setField(BODY, TYPE, 'type', 'model');
        expect([getField(next, TYPE, 'type'), getField(next, TYPE, 'name')]).toEqual(['model', 'a.png']);
        expect(() => setField(BODY, TYPE, 'meta', '{}')).toThrow('the request has no meta field');
    });
});
