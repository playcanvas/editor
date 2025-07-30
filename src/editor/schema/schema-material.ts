import { deepCopy } from '../../common/utils.ts';

editor.once('load', () => {
    /**
     * Returns a JSON object that contains all of the default material data.
     *
     * @param {object} existingData - If a field already exists in this object
     * then use that instead of the default value.
     */
    editor.method('schema:material:getDefaultData', (existingData) => {
        const result = {};
        const schema = config.schema.materialData;

        for (const key in schema) {
            if (key.startsWith('$')) continue;
            if (existingData && existingData[key] !== undefined) {
                result[key] = existingData[key];
            } else {
                const field = schema[key];
                if (field.hasOwnProperty('$default')) {
                    result[key] = deepCopy(field.$default);
                }
            }
        }

        return result;
    });

    /**
     * Gets the default value of a specific field from the material schema
     *
     * @param {string} fieldName - The name of the field
     * @returns {*} The default value or undefined
     */
    editor.method('schema:material:getDefaultValueForField', (fieldName) => {
        const field = config.schema.materialData[fieldName];

        if (field && field.hasOwnProperty('$default')) {
            return deepCopy(field.$default);
        }

        return undefined;
    });

    /**
     * Returns the type of a data field
     *
     * @param {string} fieldName - The name of the field
     */
    editor.method('schema:material:getType', (fieldName) => {
        return editor.call('schema:getTypeForPath', config.schema.materialData, fieldName);
    });
});
