editor.once('load', function () {
    'use strict';

    /**
     * Returns a JSON object that contains all of the default material data.
     * @param {Object} existingData If a field already exists in this object
     * then use that instead of the default value.
     */
    editor.method('schema:material:getDefaultData', function (existingData) {
        var result = {};
        var schema = config.schema.materialData;

        for (var key in schema) {
            if (key.startsWith('$')) continue;
            if (existingData && existingData[key] !== undefined) {
                result[key] = existingData[key];
            } else {
                var field = schema[key];
                if (field.hasOwnProperty('$default')) {
                    result[key] = utils.deepCopy(field.$default);
                }
            }
        }

        return result;
    });

    /**
     * Gets the default value of a specific field from the material schema
     * @param {String} fieldName The name of the field
     * @returns {*} The default value or undefined
     */
    editor.method('schema:material:getDefaultValueForField', function (fieldName) {
        var field = config.schema.materialData[fieldName];

        if (field && field.hasOwnProperty('$default')) {
            return utils.deepCopy(field.$default);
        }

        return undefined;
    });

    /**
     * Returns the type of a data field
     * @param {String} fieldName The name of the field
     */
    editor.method('schema:material:getType', function (fieldName) {
        return editor.call('schema:getTypeForPath', config.schema.materialData, fieldName);
    });
});
