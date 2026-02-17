import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    const projectUserSettings = editor.call('settings:projectUser');

    /**
     * Duplicates the specified entities and adds them to the scene.
     *
     * @param entities - The entities to duplicate
     */
    editor.method('entities:duplicate', (entities: EntityObserver[]) => {

        editor.api.globals.entities.duplicate(entities.map(entity => entity.apiEntity), {
            select: true,
            history: true,
            rename: projectUserSettings.get('editor.renameDuplicatedEntities')
        });
    });
});
