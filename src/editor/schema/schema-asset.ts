editor.once('load', () => {
    /**
     * Gets the type of a path in the asset schema
     *
     * @param path - The path in the schema separated by dots
     * @returns The type
     */
    editor.method('schema:asset:getType', (path: string): string => {
        return editor.call('schema:getTypeForPath', config.schema.asset, path);
    });

    /**
     * Gets the type of a path in the asset data schema for the specified asset type
     *
     * @param assetType - The type of asset (e.g. 'material', 'texture')
     * @param path - The path in the schema separated by dots (e.g. 'data.x')
     * @returns The type
     */
    editor.method('schema:asset:getDataType', (assetType: string, path: string): string => {
        const schema = config.schema[`${assetType}Data`];
        if (schema) {
            // strip data.
            path = path.substring(5);
            return editor.call('schema:getTypeForPath', schema, path);
        }

        return editor.call('schema:asset:getType', path);
    });

    /**
     * Lists all asset types defined in the schema
     *
     * @returns Array of asset type names
     */
    editor.method('schema:assets:list', (): string[] => {
        const assetSchema = config.schema.asset as { type: { $enum: string[] } };
        return assetSchema.type.$enum;
    });
});
