// the gsplat meta the server's meta job computes (with its schema defaults), reading only the ply
// header or the sog's meta.json instead of the whole file

export type GsplatMeta = {
    format: string;
    count: number;
    bands: number;
    bounds: { min: number[]; max: number[] };
    comments: string[];
    elements: Record<string, never>;
};

type Header = Omit<GsplatMeta, 'comments' | 'elements'>;

type Element = { count: number; properties: Record<string, true> };

const SIZES: Record<string, number> = { char: 1, uchar: 1, short: 2, ushort: 2, int: 4, uint: 4, float: 4, double: 8 };
const BAND_NAMES = Array.from({ length: 45 }, (_, i) => `f_rest_${i}`);
const BANDS: Record<string, number> = { 9: 1, 24: 2, '-1': 3 };
const END = '\nend_header\n';

// headers past this are not worth chasing; the server job reads the whole file instead
const HEADER_READS = [65536, 1 << 20];

// yauzl: the end of central directory record sits within the last 64k comment
const EOCD_SEARCH = 22 + 65535;
const UNKNOWN = 0xffffffff;

const zero = () => ({ min: [0, 0, 0], max: [0, 0, 0] });

// the server writes schema-complete meta, so the defaults travel with it
const complete = (header: Header): GsplatMeta => ({ ...header, comments: [], elements: {} });

const shBands = (props: Record<string, true>) => BANDS[BAND_NAMES.findIndex((name) => !Object.hasOwn(props, name))] ?? 0;

const plyHeader = (text: string): Header => {
    const els: Record<string, Element> = {};
    let last: Element;
    for (const line of text.split('\n').slice(1)) {
        const words = line.split(' ');
        switch (words[0]) {
            case 'comment':
            case 'format':
                break;
            case 'element':
                last = { count: parseInt(words[2], 10), properties: {} };
                els[words[1]] = last;
                break;
            case 'property':
                if (!SIZES[words[1]]) {
                    throw new Error(`Unrecognized ply data type '${words[1]}'`);
                }
                last.properties[words[2]] = true;
                break;
            default:
                throw new Error(`Unrecognized header value '${words[0]}' in ply header`);
        }
    }

    const compressed = els.chunk && els.vertex && els.sh;
    return {
        format: compressed ? 'COMPRESSED.PLY' : 'PLY',
        count: els.vertex.count,
        bands: shBands((compressed ? els.sh : els.vertex).properties),
        bounds: zero()
    };
};

const parse = (text: string) => {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const sogHeader = (text: string): Header => {
    const json = parse(text);
    if (!json) {
        return { format: '?', count: -1, bands: -1, bounds: zero() };
    }
    return {
        format: 'SOG',
        count: json.count,
        bands: json.shN?.bands ?? -1,
        bounds: { min: json.means?.mins ?? [0, 0, 0], max: json.means?.maxs ?? [0, 0, 0] }
    };
};

const view = async (file: Blob, start: number, end: number) => new DataView(await file.slice(start, end).arrayBuffer());

const latin1 = new TextDecoder('latin1');

// entries yauzl refuses (validateFileName, stored size mismatch, strong encryption, bad extra fields)
// fail the whole zip on the server, so they send it there, as do unicode path fields that rename one
const refused = (dir: DataView, p: number, name: string) => {
    const flags = dir.getUint16(p + 8, true);
    const stored = dir.getUint16(p + 10, true) === 0;
    const extra = dir.getUint16(p + 30, true);
    for (let i = 0, o = p + 46 + dir.getUint16(p + 28, true); i < extra - 3; ) {
        const end = i + 4 + dir.getUint16(o + i + 2, true);
        if (end > extra || dir.getUint16(o + i, true) === 0x7075) {
            return true;
        }
        i = end;
    }
    return (
        !!(flags & 0x40) ||
        (stored && dir.getUint32(p + 20, true) !== dir.getUint32(p + 24, true)) ||
        /^[a-zA-Z]:/.test(name) ||
        name.startsWith('/') ||
        name.split('/').includes('..')
    );
};

// meta.json, found the way yauzl finds it; zip64, multi-disk and anything yauzl rejects go to the server
const sogText = async (file: Blob) => {
    const from = Math.max(0, file.size - EOCD_SEARCH);
    const tail = await view(file, from, file.size);
    let eocd = -1;
    for (let i = tail.byteLength - 22; i >= 0 && eocd < 0; i--) {
        eocd = tail.getUint32(i, true) === 0x06054b50 ? i : -1;
    }
    if (eocd < 0 || tail.getUint16(eocd + 4, true) !== 0 || tail.getUint16(eocd + 20, true) !== tail.byteLength - eocd - 22) {
        return null;
    }
    if (eocd >= 20 && tail.getUint32(eocd - 20, true) === 0x07064b50) {
        return null;
    }
    const count = tail.getUint16(eocd + 10, true);
    const offset = tail.getUint32(eocd + 16, true);
    if (count === 0xffff || offset === UNKNOWN) {
        return null;
    }

    const dir = await view(file, offset, offset + tail.getUint32(eocd + 12, true));
    for (let p = 0, i = 0; i < count; i++) {
        if (dir.getUint32(p, true) !== 0x02014b50) {
            return null;
        }
        const nameLen = dir.getUint16(p + 28, true);
        const name = latin1.decode(new Uint8Array(dir.buffer, p + 46, nameLen)).replace(/\\/g, '/');
        if (refused(dir, p, name)) {
            return null;
        }
        if (name === 'meta.json') {
            const flags = dir.getUint16(p + 8, true);
            const method = dir.getUint16(p + 10, true);
            const size = dir.getUint32(p + 20, true);
            const raw = dir.getUint32(p + 24, true);
            const local = dir.getUint32(p + 42, true);
            if (flags & 1 || (method !== 0 && method !== 8) || [size, raw, local].includes(UNKNOWN)) {
                return null;
            }
            const head = await view(file, local, local + 30);
            if (head.getUint32(0, true) !== 0x04034b50) {
                return null;
            }
            const start = local + 30 + head.getUint16(26, true) + head.getUint16(28, true);
            if (start + size > file.size) {
                return null;
            }
            const data = file.slice(start, start + size);
            const stream = method === 8 ? data.stream().pipeThrough(new DecompressionStream('deflate-raw')) : data.stream();
            const bytes = new Uint8Array(await new Response(stream).arrayBuffer());

            // yauzl validates the entry's uncompressed size
            return bytes.byteLength === raw ? new TextDecoder().decode(bytes) : null;
        }
        p += 46 + nameLen + dir.getUint16(p + 30, true) + dir.getUint16(p + 32, true);
    }
    return null;
};

/**
 * The meta the server's gsplat meta job would write for a ply, compressed ply or sog file. Null when only
 * the server can tell; throws where the job would fail.
 *
 * @param file - the splat file
 * @param name - file name; the server reads a .sog file as a zip and anything else as a ply
 */
export const gsplatMeta = async (file: Blob, name = '') => {
    if (name.toLowerCase().endsWith('.sog')) {
        const text = await sogText(file);
        return text === null ? null : complete(sogHeader(text));
    }

    for (const size of HEADER_READS) {
        const text = new TextDecoder('ascii').decode(await file.slice(0, size).arrayBuffer());
        if (text.length <= 4 || !text.startsWith('ply\n')) {
            throw new Error('Invalid ply header');
        }
        const end = text.indexOf(END);
        if (end >= 0) {
            return complete(plyHeader(text.slice(0, end)));
        }
        if (size >= file.size) {
            break;
        }
    }
    return null;
};
