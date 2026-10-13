/**
 * A referenced font carries a json asset id. An explicit null means the legacy
 * embedded form, matching an absent key.
 */
export const isReferencedFont = (asset: any) => {
    const value = asset.get('data.jsonAsset');
    return value !== null && value !== undefined;
};
