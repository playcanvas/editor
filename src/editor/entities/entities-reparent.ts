import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    /**
     * Reparent entities under new parent.
     *
     * @param data - An array of {entity, parent, index} entries where entity is the entity
     * being reparented, parent is the new parent and index is the new index under the parent's children
     * @param preserveTransform - Whether to preserve the world transform when reparenting
     */
    editor.method('entities:reparent', (data: Array<{ entity: EntityObserver; parent: EntityObserver; index: number }>, preserveTransform?: boolean) => {
        editor.api.globals.entities.reparent(data.map((entry) => {
            return {
                entity: entry.entity.apiEntity,
                parent: entry.parent.apiEntity,
                index: entry.index
            };
        }), {
            preserveTransform: preserveTransform,
            history: true
        });
    });
});
