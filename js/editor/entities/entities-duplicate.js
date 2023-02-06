editor.once('load', function () {
    const projectUserSettings = editor.call('settings:projectUser');

    /**
     * Duplicates the specified entities and adds them to the scene.
     *
     * @param {Observer[]} entities - The entities to duplicate
     */
    editor.method('entities:duplicate', function (entities) {

        editor.entities.duplicate(entities.map(entity => entity.apiEntity), {
            select: true,
            history: true,
            rename: projectUserSettings.get('editor.renameDuplicatedEntities')
        });
    });
});
