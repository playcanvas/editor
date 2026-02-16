editor.once('load', () => {
    /**
     * Gets the type of a path in the settings schema
     *
     * @param path - The path in the schema separated by dots
     * @returns The type
     */
    editor.method('schema:settings:getType', (path: string): string => {
        return editor.call('schema:getTypeForPath', config.schema.settings, path);
    });
});
