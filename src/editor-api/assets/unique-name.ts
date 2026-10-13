import type { Asset } from '../asset';

const SUFFIX_RE = /^(.*?)\s*\((\d+)\)$/;

// split a filename into base, parenthesised numeric suffix, and extension
// e.g. "foo (3).css" -> { base: "foo", n: 3, ext: ".css" }
//      "foo.css"    -> { base: "foo", n: 0, ext: ".css" }
//      "foo"        -> { base: "foo", n: 0, ext: "" }
function splitNameSuffix(name: string) {
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    const m = stem.match(SUFFIX_RE);
    if (m) {
        return { base: m[1], n: parseInt(m[2], 10), ext };
    }
    return { base: stem, n: 0, ext };
}

// returns the first free name by suffixing " (n)" before the extension.
// case-insensitive comparison so the result doesn't visually clash either.
function getUniqueName(desired: string, taken: Set<string>) {
    const lower = new Set<string>();
    for (const t of taken) {
        lower.add(t.toLowerCase());
    }
    if (!lower.has(desired.toLowerCase())) {
        return desired;
    }
    const { base, n, ext } = splitNameSuffix(desired);
    let i = n > 0 ? n + 1 : 1;
    while (true) {
        const candidate = `${base} (${i})${ext}`;
        if (!lower.has(candidate.toLowerCase())) {
            return candidate;
        }
        i++;
    }
}

// build a Set of names taken by siblings in the given folder.
// folder is null for the project root.
function siblingNames(assets: Asset[], folder: Asset | null) {
    const folderId = folder ? folder.get('id') : null;
    const out = new Set<string>();
    for (const a of assets) {
        const path = a.get('path');
        const parent = path && path.length ? path[path.length - 1] : null;
        if ((parent ?? null) !== (folderId ?? null)) {
            continue;
        }
        out.add(a.get('name'));
    }
    return out;
}

export { splitNameSuffix, getUniqueName, siblingNames };
