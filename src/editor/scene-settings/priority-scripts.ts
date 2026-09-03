/**
 * The stored document may omit the key or hold an explicit null; both mean the
 * scene has no priority scripts.
 */
export const isUnsetPriorityScripts = (value: unknown) => {
    return value === null || value === undefined;
};
