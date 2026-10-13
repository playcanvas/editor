/**
 * An imported material carries its source index. An explicit null means the
 * material was created by hand, so "Re-import" does not apply.
 */
export const isImportedMaterial = (asset: any) => {
    const value = asset.get('meta.index');
    return value !== null && value !== undefined;
};

/**
 * texCoord1 is the legacy JSON-model key and is an explicit count (0 = in no
 * mesh). TEXCOORD_1 is the GLB-style key inside the free-form render meta map,
 * so it stays presence-based.
 */
export const hasUv1 = (asset: any) => {
    return (asset.get('meta.attributes.texCoord1') ?? 0) > 0 || asset.has('meta.attributes.TEXCOORD_1');
};
