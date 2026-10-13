editor.once('load', () => {
    const schema = editor.api.globals.schema;

    /**
     * Gets the type of a path in the scene schema
     *
     * @param path - The path in the schema separated by dots
     * @returns The type
     */
    editor.method('schema:scene:getType', (path: string): string => {
        return editor.call('schema:getTypeForPath', schema.getDocument('scene'), path);
    });
});
