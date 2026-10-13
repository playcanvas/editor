/**
 * `unset` deletes optional fields and dynamic entries, resets required fields
 * to their default, and rejects required fields without a default.
 */
export const resolveUnset = (resolved: { hasDefault: boolean; default: unknown; open: boolean; optional: boolean }) => {
    if (resolved.open || resolved.optional) return { op: 'unset' as const };
    if (resolved.hasDefault) return { op: 'set' as const, value: resolved.default };
    return null;
};
