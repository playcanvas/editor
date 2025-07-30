editor.once('load', () => {
    /**
     * Gets the type of a path in the scene schema
     *
     * @param {string} path - The path in the schema separated by dots
     * @returns {string} The type
     */
    editor.method('schema:scene:getType', (path) => {
        return editor.call('schema:getTypeForPath', config.schema.scene, path);
    });
});
