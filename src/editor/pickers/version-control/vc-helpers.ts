const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type DiffStatus = 'added' | 'deleted' | 'modified';

export type DiffSummary = {
    total: number;
    groups: { type: string; items: { name: string; status: DiffStatus }[] }[];
};

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

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
export const userThumbnail = (userId: string | number, size: number) => {
    const key = `${userId}:${size}`;
    if (!thumbCache.has(key)) {
        thumbCache.set(key, fetch(`/api/users/${userId}/thumbnail?size=${size}`)
        .then(res => (res.ok ? res.blob() : Promise.reject(new Error(`${res.status}`))))
        .then(blob => URL.createObjectURL(blob))
        .catch(() => ''));
    }
    return thumbCache.get(key);
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
    conflicts?: { itemType: string; itemName: string; data?: { missingInSrc?: boolean; missingInDst?: boolean }[] }[];
};

export const summarizeDiff = (diff: DiffLike): DiffSummary => {
    const groups = new Map<string, { name: string; status: DiffStatus }[]>();
    for (const c of diff.conflicts ?? []) {
        const entry = c.data?.[0] ?? {};
        // dst-missing wins if both flags are ever set: item exists in src only, so 'added'
        const status: DiffStatus = entry.missingInDst ? 'added' : entry.missingInSrc ? 'deleted' : 'modified';
        if (!groups.has(c.itemType)) {
            groups.set(c.itemType, []);
        }
        groups.get(c.itemType)!.push({ name: c.itemName, status });
    }
    return {
        total: diff.numConflicts ?? 0,
        groups: [...groups.entries()].map(([type, items]) => ({ type, items }))
    };
};
