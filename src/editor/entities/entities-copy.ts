editor.once('load', () => {
    /**
     * Copies the specified entities into localStorage
     *
     * @param {Observer[]} entities - The entities to copy
     */
    editor.method('entities:copy', (entities) => {
        editor.api.globals.entities.copyToClipboard(entities.map(e => e.apiEntity));
    });
});
