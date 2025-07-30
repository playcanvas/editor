editor.once('load', () => {
    const projectUserSettings = editor.call('settings:projectUser');

    /**
     * Duplicates the specified entities and adds them to the scene.
     *
     * @param {Observer[]} entities - The entities to duplicate
     */
    editor.method('entities:duplicate', (entities) => {

        editor.api.globals.entities.duplicate(entities.map(entity => entity.apiEntity), {
            select: true,
            history: true,
            rename: projectUserSettings.get('editor.renameDuplicatedEntities')
        });
    });
});
