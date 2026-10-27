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

export { acceptsAssetDropType, toLinkedFieldValue, toOptions, WILDCARD_ASSET_TYPE };
