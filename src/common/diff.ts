/**
 * Deep diff for JSON-compatible values.
 *
 * Reimplementation of the `json-diff` npm package (https://github.com/andreyvit/json-diff).
 * The original file was a minified webpack UMD bundle of that library; this is a clean
 * TypeScript replacement covering only the functionality actually used by the editor.
 *
 * Diff format:
 *  - Objects: `{ key__added: val, key__deleted: val, key: nestedDiff }`
 *  - Scalars: `{ __old: val, __new: val }`
 *  - Arrays:  `[op, value?][]` where op is `" "`, `"+"`, `"-"`
 *  - No difference: `undefined`
 */

type JsonValue = any;

interface DiffOptions {
    /** When true, only report structural changes (added/deleted keys), ignore value changes. */
    keysOnly?: boolean;
}

/**
 * Extended typeof that distinguishes arrays and null from plain objects.
 *
 * @param value - The value to inspect.
 */
function extendedTypeOf(value: JsonValue): string {
    if (value == null) {
        return 'null';
    }
    if (typeof value === 'object' && Array.isArray(value)) {
        return 'array';
    }
    return typeof value;
}

/**
 * Recursively diff two values. Returns `[score, diff]`.
 *
 * The score is used internally for ranking (e.g. during array element matching in the
 * original json-diff); only the diff portion is exposed to consumers.
 *
 * @param oldVal - The original value.
 * @param newVal - The new value.
 * @param options - Diff options.
 */
function diffValue(oldVal: JsonValue, newVal: JsonValue, options: DiffOptions): [number, JsonValue] {
    const oldType = extendedTypeOf(oldVal);
    const newType = extendedTypeOf(newVal);

    if (oldType === newType) {
        switch (oldType) {
            case 'object':
                return objectDiff(oldVal, newVal, options);
            case 'array':
                return arrayDiff(oldVal, newVal, options);
        }
    }

    // Scalar comparison or type mismatch
    if (options.keysOnly) {
        return [100, undefined];
    }
    if (oldVal !== newVal) {
        return [0, { __old: oldVal, __new: newVal }];
    }
    return [100, undefined];
}

/**
 * Diff two plain objects. Produces `key__added`, `key__deleted` entries for
 * structural changes and recursively diffs shared keys.
 *
 * @param oldObj - The original object.
 * @param newObj - The new object.
 * @param options - Diff options.
 */
function objectDiff(
    oldObj: Record<string, JsonValue>,
    newObj: Record<string, JsonValue>,
    options: DiffOptions
): [number, JsonValue] {
    const result: Record<string, JsonValue> = {};
    let score = 0;

    // Detect deleted keys (present in old, absent in new)
    for (const key of Object.keys(oldObj)) {
        if (!(key in newObj)) {
            result[`${key}__deleted`] = oldObj[key];
            score -= 30;
        }
    }

    // Detect added keys (present in new, absent in old)
    for (const key of Object.keys(newObj)) {
        if (!(key in oldObj)) {
            result[`${key}__added`] = newObj[key];
            score -= 30;
        }
    }

    // Recursively diff shared keys
    for (const key of Object.keys(oldObj)) {
        if (key in newObj) {
            score += 20;
            const [childScore, childDiff] = diffValue(oldObj[key], newObj[key], options);
            if (childDiff) {
                result[key] = childDiff;
            }
            score += Math.min(20, Math.max(-10, childScore / 5));
        }
    }

    if (Object.keys(result).length === 0) {
        // No changes detected
        return [100 * Math.max(Object.keys(oldObj).length, 0.5), undefined];
    }

    return [Math.max(0, score), result];
}

/**
 * Diff two arrays using index-based comparison.
 *
 * Note: the original json-diff used Python's SequenceMatcher (via the `difflib` port) for
 * optimal element alignment. This simplified version compares by index position, which is
 * sufficient for the editor's use case (object-keyed data, not reorderable arrays).
 *
 * Output format: array of `[op]` or `[op, value]` tuples where op is `" "`, `"+"`, or `"-"`.
 *
 * @param oldArr - The original array.
 * @param newArr - The new array.
 * @param options - Diff options.
 */
function arrayDiff(oldArr: JsonValue[], newArr: JsonValue[], options: DiffOptions): [number, JsonValue] {
    const result: [string, JsonValue?][] = [];
    let score = 0;
    let allEqual = true;

    const minLen = Math.min(oldArr.length, newArr.length);

    for (let i = 0; i < minLen; i++) {
        const [, childDiff] = diffValue(oldArr[i], newArr[i], options);
        if (childDiff) {
            if (options.keysOnly) {
                result.push(['~', childDiff]);
            } else {
                result.push(['-', oldArr[i]]);
                result.push(['+', newArr[i]]);
                score -= 10;
            }
            allEqual = false;
        } else {
            result.push([' ']);
            score += 10;
        }
    }

    // Extra elements in old array (deleted)
    for (let i = minLen; i < oldArr.length; i++) {
        result.push(['-', oldArr[i]]);
        score -= 5;
        allEqual = false;
    }

    // Extra elements in new array (added)
    for (let i = minLen; i < newArr.length; i++) {
        result.push(['+', newArr[i]]);
        score -= 5;
        allEqual = false;
    }

    if (allEqual) {
        return [100, undefined];
    }

    return [Math.max(0, score), result];
}

/**
 * Compute a deep diff between two JSON-compatible values.
 *
 * @param oldVal - The original value.
 * @param newVal - The new value.
 * @param options - Optional. Pass `{ keysOnly: true }` to ignore scalar value changes.
 * @returns A diff object describing the changes, or `undefined` if the values are equal.
 */
export function diff(oldVal: JsonValue, newVal: JsonValue, options: DiffOptions = {}): JsonValue {
    return diffValue(oldVal, newVal, options)[1];
}
