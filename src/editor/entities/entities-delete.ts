editor.once('load', () => {
    /**
     * Deletes the specified entities
     *
     * @param {Observer[]} entities - The entities to delete
     */
    editor.method('entities:delete', (entities) => {
        editor.api.globals.entities.delete(entities.map(entity => entity.apiEntity));
    });
});
