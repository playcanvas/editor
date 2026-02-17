import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    /**
     * Deletes the specified entities
     *
     * @param entities - The entities to delete
     */
    editor.method('entities:delete', (entities: EntityObserver[]) => {
        editor.api.globals.entities.delete(entities.map(entity => entity.apiEntity));
    });
});
