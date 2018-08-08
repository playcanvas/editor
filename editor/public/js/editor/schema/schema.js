editor.once('load', function () {
    'use strict';

    var pathToSchema = function (schema, path) {
        if (typeof(path) === 'string') {
            path = path.split('.');
        }

        if (typeof(path) === 'number') {
            path = [path];
        }

        let currPath = schema;
        for (var i = 0, len = path.length; i < len; i++) {
            var p = path[i];
            if (currPath.type === 'Map' && currPath.of) {
                currPath = currPath.of;
            } else if (currPath[p] || (currPath.type && currPath.type[p])) {
                currPath = currPath[p] || currPath.type[p];
            } else if (!isNaN(parseInt(p, 10)) && Array.isArray(currPath) || Array.isArray(currPath.type)) {
                currPath = Array.isArray(currPath) ? currPath[0] : currPath.type[0];
            } else {
                return null;
            }
        }

        return currPath;
    };

    var schemaToType = function (schema, fixedLength) {
        if (typeof schema === 'string') {
            if (schema === 'Map' || schema === 'Mixed') {
                schema = 'object';
            }

            return schema.toLowerCase();
        }

        if (schema.__editorType) {
            return schema.__editorType;
        }

        if (Array.isArray(schema)) {
            if (schema[0] === 'Number' && fixedLength) {
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

        if (schema.type && !schema.type.type) {
            return schemaToType(schema.type, schema.__length);
        }

        return 'object';
    };

    var getType = function (schema, path) {
        var subSchema = pathToSchema(schema, path);
        var type = subSchema && schemaToType(subSchema);

        if (! type) {
            console.warn('Unknown type for ' + path);
            type = 'string';
        }

        return type;
    };

    editor.method('schema:scene:getType', function (path) {
        return getType(config.schema.scene, path);
    });

    editor.method('schema:asset:getType', function (path) {
        return getType(config.schema.asset, path);
    });

    editor.method('schema:settings:getType', function (path) {
        return getType(config.schema.settings, path);
    });
});
