const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LINE_DIFF_CELL_LIMIT = 120000;

// after this long, a still-loading diff shows a non-blocking "this can take a while" hint (#2099)
export const DIFF_SLOW_HINT_MS = 60000;
export const DIFF_SLOW_HINT_TEXT = 'Large diffs can take a few minutes — you can keep waiting or come back later.';

export type DiffStatus = 'added' | 'deleted' | 'modified';

export type DiffSummary = {
    total: number;
    // index points back into the source diff's conflicts array
    groups: { type: string; items: { name: string; status: DiffStatus; index: number }[] }[];
};

const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// relative time for same-day values, absolute date otherwise (builds panel convention)
export const formatRelativeDate = (value: string | Date, now = new Date()) => {
    const d = new Date(value);
    if (!sameDay(d, now)) {
        return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    const mins = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 60000));
    if (mins < 1) {
        return 'just now';
    }
    if (mins < 60) {
        return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
    }
    const hours = Math.floor(mins / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
};

export const formatDayGroup = (value: string | Date, now = new Date()) => {
    const d = new Date(value);
    if (sameDay(d, now)) {
        return 'Today';
    }
    return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// one network fetch per user/size per session, regardless of server cache headers;
// resolves to an object url, or '' on failure (callers skip assignment)
const thumbCache = new Map<string, Promise<string>>();
// resolved object urls kept for synchronous reuse, so re-created avatars don't flash empty
const thumbResolved = new Map<string, string>();
export const userThumbnail = (userId: string | number, size: number) => {
    const key = `${userId}:${size}`;
    if (!thumbCache.has(key)) {
        thumbCache.set(
            key,
            fetch(`/api/users/${userId}/thumbnail?size=${size}`)
                .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(`${res.status}`))))
                .then((blob) => URL.createObjectURL(blob))
                .then((url) => {
                    thumbResolved.set(key, url);
                    return url;
                })
                .catch(() => '')
        );
    }
    return thumbCache.get(key);
};

// assign the avatar src synchronously when cached, so a freshly created <img> paints
// the (already-loaded) blob immediately instead of flashing empty for a frame (#2098)
export const applyUserThumbnail = (img: HTMLImageElement, userId: string | number, size: number) => {
    const cached = thumbResolved.get(`${userId}:${size}`);
    if (cached) {
        img.src = cached;
        return;
    }
    userThumbnail(userId, size).then((src) => {
        if (src) {
            img.src = src;
        }
    });
};

// verbatim-styled short checkpoint hash
export const hashChip = (id: string) => {
    const el = document.createElement('span');
    el.classList.add('vc-hash');
    el.textContent = id.substring(0, 7);
    return el;
};

type DiffLike = {
    numConflicts?: number;
    conflicts?: {
        itemType: string;
        itemName: string;
        data?: { path?: string; missingInSrc?: boolean; missingInDst?: boolean }[];
    }[];
};

// group label for an item type; 'settings' is already plural
export const typeLabel = (type: string) => (type.endsWith('s') ? type : `${type}s`);

export const summarizeDiff = (diff: DiffLike): DiffSummary => {
    const groups = new Map<string, { name: string; status: DiffStatus; index: number }[]>();
    (diff.conflicts ?? []).forEach((c, index) => {
        const entry = c.data?.[0] ?? {};
        // whole-item adds/deletes carry no entry path; pathful missing flags are field-level
        const whole = !entry.path;
        // dst-missing wins if both flags are ever set: item exists in src only, so 'added'
        const status: DiffStatus =
            whole && entry.missingInDst ? 'added' : whole && entry.missingInSrc ? 'deleted' : 'modified';
        if (!groups.has(c.itemType)) {
            groups.set(c.itemType, []);
        }
        // settings items are documents with lowercase names ('project settings')
        const name = c.itemType === 'settings' ? c.itemName.replace(/\b[a-z]/g, (ch) => ch.toUpperCase()) : c.itemName;
        groups.get(c.itemType)!.push({ name, status, index });
    });
    return {
        total: diff.numConflicts ?? 0,
        groups: [...groups.entries()].map(([type, items]) => ({ type, items }))
    };
};

const splitLines = (v: unknown) => {
    if (typeof v !== 'string') {
        return null;
    }
    if (!v) {
        return [];
    }
    const s = v.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return (s.endsWith('\n') ? s.substring(0, s.length - 1) : s).split('\n');
};

const edgeCommonLines = (a: string[], b: string[]) => {
    let pre = 0;
    const len = Math.min(a.length, b.length);
    while (pre < len && a[pre] === b[pre]) {
        pre++;
    }
    let ai = a.length - 1;
    let bi = b.length - 1;
    let suf = 0;
    while (ai >= pre && bi >= pre && a[ai] === b[bi]) {
        ai--;
        bi--;
        suf++;
    }
    return pre + suf;
};

const commonLines = (a: string[], b: string[]) => {
    if (a.length * b.length > LINE_DIFF_CELL_LIMIT) {
        return edgeCommonLines(a, b);
    }
    let prev = new Uint32Array(b.length + 1);
    let cur = new Uint32Array(b.length + 1);
    for (const av of a) {
        for (let j = 0; j < b.length; j++) {
            cur[j + 1] = av === b[j] ? prev[j] + 1 : Math.max(prev[j + 1], cur[j]);
        }
        [prev, cur] = [cur, prev];
        cur.fill(0);
    }
    return prev[b.length];
};

export const lineChangeCounts = (src: unknown, dst: unknown) => {
    const oldLines = splitLines(dst);
    const newLines = splitLines(src);
    if (!oldLines || !newLines) {
        return null;
    }
    const same = commonLines(oldLines, newLines);
    return {
        deleted: oldLines.length - same,
        added: newLines.length - same
    };
};

export const diffTextChangeCounts = (text: unknown) => {
    if (typeof text !== 'string') {
        return null;
    }
    let added = 0;
    let deleted = 0;
    for (const line of text.split(/\r\n|\n|\r/)) {
        if (line.startsWith('+++') || line.startsWith('---')) {
            continue;
        }
        if (line.startsWith('+')) {
            added++;
        } else if (line.startsWith('-')) {
            deleted++;
        }
    }
    return { deleted, added };
};

export const splitDiffPath = (path: string) => path.split('.').filter(Boolean);

const prettyPart = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (ch) => ch.toUpperCase());

const settingLabel = (s: string) =>
    ({
        render: 'Rendering',
        batchGroups: 'Batch groups',
        layerOrder: 'Layer order',
        scripts: 'Script loading order'
    })[s] ?? prettyPart(s);

// internal version-control plumbing (file backup refs etc.) that never appears
// in the inspector — keep it out of the diff entirely
const HIDDEN_DIFF_FIELDS = new Set(['immutable_backup']);
export const isHiddenDiffField = (path: string) => HIDDEN_DIFF_FIELDS.has(splitDiffPath(path ?? '').pop() ?? '');

// generic asset property diff (material, texture, ...): inspector fields live
// under data.; strip it and prettify the path so a row reads like the inspector
// (data.opacityDither -> "Opacity Dither") grouped under the asset-type panel
export const assetDiffField = (assetType: string, path: string) => {
    const inner = path.startsWith('data.') ? path.slice('data.'.length) : path;
    const info = formatDiffPath(inner, 'asset');
    const section = prettyPart(assetType || 'asset');
    const field = info.labels.length ? `${info.labels.map((l) => l.text).join(' / ')} / ${info.field}` : info.field;
    return { section, field, title: `${section} / ${field}` };
};

export const formatDiffPath = (path: string, type: string, entityName?: string) => {
    const parts = splitDiffPath(path);
    if (type === 'scene' && parts[0] === 'entities' && parts[1]) {
        const labels: { text: string; title?: string }[] = [
            { text: entityName ? `Entity: ${entityName}` : `Entity: ${parts[1]}`, title: parts[1] }
        ];
        let i = 2;
        if (parts[i] === 'components' && parts[i + 1]) {
            const comp = parts[i + 1];
            labels.push({ text: `${prettyPart(comp)} component` });
            i += 2;
            if (comp === 'script' && parts[i] === 'scripts' && parts[i + 1]) {
                labels.push({ text: `Script: ${parts[i + 1]}` });
                i += 2;
                if (parts[i] === 'attributes') {
                    i++;
                }
            } else if (comp === 'sound' && parts[i] === 'slots' && parts[i + 1]) {
                labels.push({ text: `Sound slot: ${parts[i + 1]}` });
                i += 2;
            } else if (comp === 'sprite' && parts[i] === 'clips' && parts[i + 1]) {
                labels.push({ text: `Clip: ${parts[i + 1]}` });
                i += 2;
            }
        }
        for (; i < parts.length - 1; i++) {
            labels.push({ text: prettyPart(parts[i]) });
        }
        return { labels, field: prettyPart(parts[parts.length - 1] ?? path) };
    }
    if (type === 'scene' && parts[0] === 'settings') {
        return {
            labels: [{ text: 'Scene settings' }, ...parts.slice(1, -1).map((text) => ({ text: settingLabel(text) }))],
            field: prettyPart(parts[parts.length - 1] ?? path)
        };
    }
    if (type === 'settings') {
        const first = parts[0];
        if (first === 'layers' && parts[1]) {
            return {
                labels: [{ text: 'Layers' }, { text: `Layer: ${parts[1]}` }],
                field: prettyPart(parts[parts.length - 1] ?? path)
            };
        }
        if (first === 'batchGroups' && parts[1]) {
            return {
                labels: [{ text: 'Batch groups' }, { text: `Batch group: ${parts[1]}` }],
                field: prettyPart(parts[parts.length - 1] ?? path)
            };
        }
        return {
            labels: parts.slice(0, -1).map((text) => ({ text: settingLabel(text) })),
            field: prettyPart(parts[parts.length - 1] ?? path)
        };
    }
    return {
        labels: parts.slice(0, -1).map((text) => ({ text: prettyPart(text) })),
        field: prettyPart(parts[parts.length - 1] ?? path)
    };
};

// grouped change rows (shared by the detail card and the changes summary card)
export const diffListEl = (summary: DiffSummary) => {
    const list = document.createElement('div');
    list.classList.add('vc-diff-list');
    for (const g of summary.groups) {
        const head = document.createElement('div');
        head.classList.add('vc-group');
        head.textContent = `${typeLabel(g.type)} · ${g.items.length}`;
        list.appendChild(head);
        for (const item of g.items) {
            const row = document.createElement('div');
            row.classList.add('vc-item');
            const name = document.createElement('span');
            name.classList.add('name');
            name.textContent = item.name;
            name.title = item.name;
            row.appendChild(name);
            const badge = document.createElement('span');
            badge.classList.add('status', item.status);
            badge.textContent = item.status;
            row.appendChild(badge);
            list.appendChild(row);
        }
    }
    return list;
};
