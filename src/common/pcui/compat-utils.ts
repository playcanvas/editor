import type { TextInput } from '@playcanvas/pcui';

const WILDCARD_ASSET_TYPE = '*';

const toOptionValue = (value: any, type = 'string') => {
    if (value === '') {
        return '';
    }

    if (type === 'number') {
        return Number(value);
    }

    if (type === 'boolean') {
        return value === true || value === 'true';
    }

    return value;
};

const toOptions = (options: any = [], type = 'string') => {
    const entries = Array.isArray(options) ? options : Object.entries(options).map(([v, t]) => ({ v, t }));

    return entries.map((option: any) => ({
        v: toOptionValue(option.v, type),
        t: String(option.t)
    }));
};

const acceptsAssetDropType = (assetType: string | undefined, type: string) => {
    return !assetType || assetType === WILDCARD_ASSET_TYPE || type === `asset.${assetType}`;
};

const toLinkedFieldValue = (type: string | undefined, value: any, different: boolean) => {
    return type === 'entity' && different ? null : value;
};

/**
 * Calls fn when a text input's value changes. With `keyChange`, PCUI emits `change` on each keyup and again on
 * blur for the same value, so a list rebuilt on change would swap out the item a click is landing on.
 *
 * @param input - The text input.
 * @param fn - Called with the new value.
 */
const onTextChange = (input: TextInput, fn: (value: string) => void) => {
    let last = input.value;
    input.on('change', (value: string) => {
        if (value !== last) {
            last = value;
            fn(value);
        }
    });
};

export { acceptsAssetDropType, onTextChange, toLinkedFieldValue, toOptions, WILDCARD_ASSET_TYPE };
