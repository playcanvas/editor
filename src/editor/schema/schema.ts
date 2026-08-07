editor.once('load', () => {
    editor.method('schema:getType', (field: object) => {
        return editor.api.globals.schema.getType(field);
    });

    editor.method('schema:getTypeForPath', (schema: object, path: string) => {
        const type = editor.api.globals.schema.getTypeForPath(schema, path, false);
        if (type) return type;

        console.warn(`Unknown type for ${path}`);
        return 'string';
    });

    editor.method('schema:getMergeMethodForPath', (schema: object, path: string) => {
        return editor.api.globals.schema.getMergeMethodForPath(schema, path, false);
    });
});
