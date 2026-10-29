type Edit = { path: string; op: string; value?: unknown };

/**
 * Rewrite `set` edits whose parent does not exist yet into one `set` of the first missing
 * ancestor, since the realtime server rejects a leaf write under a missing parent.
 * Edits sharing a missing ancestor merge into a single value.
 *
 * @param has - Whether a path exists on the target observer.
 * @param edits - The prepared edits.
 * @returns The edits to apply.
 */
export const nestEdits = (has: (path: string) => boolean, edits: Edit[]) => {
    const out: Edit[] = [];
    const created = new Map<string, Record<string, unknown>>();
    edits.forEach((edit) => {
        const keys = edit.path.split('.');
        const i = edit.op === 'set' ? keys.findIndex((_, n) => n < keys.length - 1 && !has(keys.slice(0, n + 1).join('.'))) : -1;
        if (i === -1) {
            out.push(edit);
            return;
        }
        const path = keys.slice(0, i + 1).join('.');
        let value = created.get(path);
        if (!value) {
            value = {};
            created.set(path, value);
            out.push({ path, op: 'set', value });
        }
        const rest = keys.slice(i + 1);
        const last = rest.pop() as string;
        const node = rest.reduce((n, k) => (n[k] ??= {}) as Record<string, unknown>, value);
        node[last] = edit.value;
    });
    return out;
};
