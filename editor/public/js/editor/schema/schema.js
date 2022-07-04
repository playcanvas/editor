editor.once('load', function () {
    'use strict';

    /**
     * Gets the schema object that corresponds to the specified dot separated
     * path from the specified schema object.
     *
     * @param {string} path - The path separated by dots
     * @param {object} schema - The schema object
     * @returns {object} The sub schema
     */
    var pathToSchema = function (path, schema) {
        if (typeof path === 'string') {
            path = path.split('.');
        }

        if (typeof path === 'number') {
            path = [path];
        }

        var result = schema;
        for (let i = 0, len = path.length; i < len; i++) {
            var p = path[i];
            if (result.$type === 'map' && result.$of) {
                result = result.$of;
            } else if (result[p] || (result.$type && result.$type[p])) {
                result = result[p] || result.$type[p];
            } else if (!isNaN(parseInt(p, 10)) && Array.isArray(result) || Array.isArray(result.$type)) {
                result = Array.isArray(result) ? result[0] : result.$type[0];
            } else {
                return null;
            }
        }

        return result;
    };

    /**
     * Converts the specified schema object to a type recursively.
     *
     * @param {object} schema - The schema object or field of a parent schema object.
     * @param {boolean} fixedLength - Whether the specified schema field has a fixed length if it's an array type.
     * @returns {string} The type
     */
    var schemaToType = function (schema, fixedLength) {
        if (typeof schema === 'string') {
            if (schema === 'map' || schema === 'mixed') {
                schema = 'object';
            }

            return schema.toLowerCase();
        }

        if (schema.$editorType) {
            return schema.$editorType;
        }

        if (Array.isArray(schema)) {
            if (schema[0] === 'number' && fixedLength) {
                if (fixedLength === 2) {
                    return 'vec2';
                } else if (fixedLength === 3) {
                    return 'vec3';
                } else if (fixedLength === 4) {
                    return 'vec4';
                }
            }

            return 'array:' + schemaToType(schema[0]);
        }

        if (schema.$type) {
            return schemaToType(schema.$type, schema.$length);
        }

        return 'object';
    };

    /**
     * Gets the type of the specified schema object,
     *
     * @param {object} schemaField - A field of the schema
     * @param {boolean} fixedLength - Whether this field has a fixed length if it's an array type
     * @returns {string} The type
     */
    editor.method('schema:getType', function (schemaField, fixedLength) {
        return schemaToType(schemaField, fixedLength);
    });

    /**
     * Gets the type of the specified path from the specified schema
     *
     * @param {object} schema - The schema object
     * @param {string} path - A path separated by dots
     * @param {string} The - type
     */
    editor.method('schema:getTypeForPath', function (schema, path) {
        var subSchema = pathToSchema(path, schema);
        var type = subSchema && schemaToType(subSchema);

        if (!type) {
            console.warn('Unknown type for ' + path);
            type = 'string';
        }

        return type;
    });

    editor.method('schema:getMergeMethodForPath', function (schema, path) {
        var h = pathToSchema(path, schema);

        return h && h.$mergeMethod;
    });
});
