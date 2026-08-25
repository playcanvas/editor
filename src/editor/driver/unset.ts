/**
 * `unset` deletes on dynamic paths, and resets a fixed field to its declared
 * default so a required key is never removed.
 */
export const resolveUnset = (resolved: { hasDefault: boolean; default: unknown; open: boolean }) => {
    if (resolved.open || !resolved.hasDefault) return { op: 'unset' as const };
    return { op: 'set' as const, value: resolved.default };
};
