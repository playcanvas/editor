import { deepCopy } from '@/common/utils';

editor.once('load', () => {
    const schema = editor.api.globals.schema;

    /**
     * Returns a JSON object that contains all of the default material data.
     *
     * @param existingData - If a field already exists in this object
     * then use that instead of the default value.
     */
    editor.method('schema:material:getDefaultData', (existingData?: object) => {
        const result = {};
        const defaults = schema.assets.getDefaultData('material') || {};

        for (const key in schema.getFields(schema.getAssetData('material'))) {
            if (existingData && existingData[key] !== undefined) {
                result[key] = existingData[key];
            } else if (Object.hasOwn(defaults, key)) {
                result[key] = deepCopy(defaults[key]);
            }
        }

        return result;
    });

    /**
     * Gets the default value of a specific field from the material schema
     *
     * @param fieldName - The name of the field
     * @returns The default value or undefined
     */
    editor.method('schema:material:getDefaultValueForField', (fieldName: string): unknown => {
        const field = schema.assets.resolvePath('material', fieldName);
        return field?.hasDefault ? deepCopy(field.default) : undefined;
    });

    /**
     * Returns the type of a data field
     *
     * @param fieldName - The name of the field
     * @returns The type of the field
     */
    editor.method('schema:material:getType', (fieldName: string): string => {
        const resolved = schema.assets.resolvePath('material', fieldName);
        if (!resolved?.field) {
            console.warn(`Unknown type for ${fieldName}`);
            return 'string';
        }
        return schema.getType(resolved.field);
    });
});
