/**
 * Browser-side replacement for the server's script concatenation job, used by the launch page
 * whenever it is opened with the existing `concatenateScripts=true` option and every joined
 * script downloads successfully.
 */

export type ScriptLike = { get: (path: string) => unknown };

export type ScriptFile = { id: number; url: string; name: string; text: string };

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// data.loadingType values the server leaves out of the join
const BEFORE_ENGINE = 1;
const AFTER_ENGINE = 2;

/**
 * Encodes an integer as a source map base64 VLQ.
 *
 * @param n - The integer to encode.
 * @returns The VLQ string.
 */
export const vlq = (n: number) => {
    let v = n < 0 ? (-n << 1) | 1 : n << 1;
    let s = '';
    do {
        let d = v & 31;
        v >>>= 5;
        if (v) {
            d |= 32;
        }
        s += B64[d];
    } while (v);
    return s;
};

// btoa only takes latin-1, so encode utf-8 bytes in chunks
const b64 = (s: string) => {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
};

/**
 * Picks the scripts to concatenate in project script order, as the server does for its
 * concatenated scripts hash and job: `.js` files with a file
 * hash that don't load before or after the engine. Neither type nor preload is checked, same as
 * the server. A repeated id is joined once, as terser keys its inputs by path.
 *
 * @param order - Project `scripts` setting.
 * @param get - Looks up an asset observer by id.
 * @returns The scripts to concatenate.
 */
export const selectScripts = <T extends ScriptLike>(order: number[], get: (id: number) => T | null | undefined) => {
    const seen = new Set<number>();
    return order.flatMap((id) => {
        const a = get(id);
        const name = a?.get('file.filename');
        const type = a?.get('data.loadingType');
        if (
            !a ||
            seen.has(id) ||
            !a.get('file.hash') ||
            type === BEFORE_ENGINE ||
            type === AFTER_ENGINE ||
            typeof name !== 'string' ||
            !name.endsWith('.js')
        ) {
            return [];
        }
        seen.add(id);
        return [a];
    });
};

/**
 * Joins scripts into one classic script with an inline line-level source map back to each
 * original file url.
 *
 * @param files - Downloaded scripts in execution order.
 * @returns The script and a resolver from a 1-based concatenated line to its original file line.
 */
export const concatenate = (files: ScriptFile[]) => {
    const rows: string[] = [];
    const ranges: { start: number; count: number }[] = [];
    let code = '';
    let src = 0;
    let prev = 0;

    files.forEach((f, i) => {
        const lines = f.text.split('\n');

        // header row
        rows.push('');
        ranges.push({ start: rows.length, count: lines.length });
        lines.forEach((_, l) => {
            rows.push(`A${vlq(i - src)}${vlq(l - prev)}A`);
            src = i;
            prev = l;
        });

        // asi guard row
        rows.push('');
        code += `// ${f.name}\n${f.text}\n;\n`;
    });

    const map = {
        version: 3,
        file: 'scripts.js',
        sources: files.map((f) => f.url),
        sourcesContent: files.map((f) => f.text),
        names: [],
        mappings: rows.join(';')
    };
    code += `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${b64(JSON.stringify(map))}\n`;

    const resolve = (line: number) => {
        const i = ranges.findIndex((r) => line - 1 >= r.start && line - 1 < r.start + r.count);
        return i === -1 ? null : { url: files[i].url, line: line - ranges[i].start };
    };

    return { code, resolve };
};

/**
 * Downloads the text of each script from its own launch file url.
 *
 * @param scripts - Each script's id, absolute file url and filename.
 * @param get - Fetch implementation.
 * @returns The files in the given order, or null if any download failed.
 */
export const fetchScripts = async (scripts: Omit<ScriptFile, 'text'>[], get: typeof fetch = fetch) => {
    const files = await Promise.all(
        scripts.map(async (s) => {
            const res = await get(s.url).catch(() => null);
            const text = res?.ok ? await res.text().catch(() => null) : null;
            return text === null ? null : { ...s, text };
        })
    );
    return files.includes(null) ? null : (files as ScriptFile[]);
};
