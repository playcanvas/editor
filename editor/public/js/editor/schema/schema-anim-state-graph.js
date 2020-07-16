editor.once('load', function () {
    'use strict';

    /**
     * Returns a JSON object that contains all of the default anim state graph data.
     * @param {Object} existingData If a field already exists in this object
     * then use that instead of the default value.
     */
    editor.method('schema:animstategraph:getDefaultData', function (existingData) {
        var result = {};
        var schema = config.schema.animStateGraphData;

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
});