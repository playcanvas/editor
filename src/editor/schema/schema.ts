editor.once('load', () => {
    /**
     * Gets the schema object that corresponds to the specified dot separated
     * path from the specified schema object.
     *
     * @param path - The path separated by dots
     * @param schema - The schema object
     * @returns The sub schema
     */
    const pathToSchema = function (path: string | number, schema: object): object | null {
        if (typeof path === 'string') {
            path = path.split('.');
        }

        if (typeof path === 'number') {
            path = [path];
        }

        let result = schema;
        for (let i = 0, len = path.length; i < len; i++) {
            const p = path[i];
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
     * @param schema - The schema object or field of a parent schema object.
     * @param fixedLength - Whether the specified schema field has a fixed length if it's an array type.
     * @returns The type
     */
    const schemaToType = function (schema: object | string | unknown[], fixedLength?: number): string {
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
                }
                if (fixedLength === 3) {
                    return 'vec3';
                }
                if (fixedLength === 4) {
                    return 'vec4';
                }
            }

            return `array:${schemaToType(schema[0])}`;
        }

        if (schema.$type) {
            return schemaToType(schema.$type, schema.$length);
        }

        return 'object';
    };

    /**
     * Gets the type of the specified schema object,
     *
     * @param schemaField - A field of the schema
     * @param fixedLength - Whether this field has a fixed length if it's an array type
     * @returns The type
     */
    editor.method('schema:getType', (schemaField: object, fixedLength?: number): string => {
        return schemaToType(schemaField, fixedLength);
    });

    /**
     * Gets the type of the specified path from the specified schema
     *
     * @param schema - The schema object
     * @param path - A path separated by dots
     * @returns The type
     */
    editor.method('schema:getTypeForPath', (schema: object, path: string): string => {
        const subSchema = pathToSchema(path, schema);
        let type = subSchema && schemaToType(subSchema);

        if (!type) {
            console.warn(`Unknown type for ${path}`);
            type = 'string';
        }

        return type;
    });

    /**
     * Gets the merge method for the specified path from the specified schema
     *
     * @param schema - The schema object
     * @param path - A path separated by dots
     * @returns The merge method for the path, or undefined
     */
    editor.method('schema:getMergeMethodForPath', (schema: object, path: string): string | undefined => {
        const h = pathToSchema(path, schema);

        return h && (h as { $mergeMethod?: string }).$mergeMethod;
    });
});
