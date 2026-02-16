import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    /**
     * Pastes entities in localStore under the specified parent
     *
     * @param parent - The parent entity
     */
    editor.method('entities:paste', (parent: EntityObserver | null) => {
        editor.api.globals.entities.pasteFromClipboard(parent ? parent.apiEntity : null);
    });
});
