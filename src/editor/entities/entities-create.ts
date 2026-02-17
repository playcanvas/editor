import type { CreateEntityArguments, EntityObserver } from '@/editor-api';

/** Default entity data for entities:new, supporting postCreationCallback and recursive children. */
interface EntitiesNewDefaultData {
    parent?: { apiEntity: unknown } | string;
    noHistory?: boolean;
    noSelect?: boolean;
    postCreationCallback?: () => void;
    children?: EntitiesNewDefaultData[];
    [key: string]: unknown;
}

editor.once('load', () => {
    function replacePostCreationCallback(data: EntitiesNewDefaultData): void {
        if (data.postCreationCallback) {
            data.onCreate = data.postCreationCallback;
            delete data.postCreationCallback;
        }

        if (Array.isArray(data.children)) {
            data.children.forEach(child => replacePostCreationCallback(child));
        }
    }

    /**
     * Creates a new entity.
     *
     * @param defaultData - The default entity data. This can also define a postCreationCallback argument at each level, which is
     * designed for cases where composite entity hierarchies need some post-processing, and the
     * post processing needs to be done both in the case of initial creation and also the case
     * of undo/redo.
     * @returns The new entity
     */
    editor.method('entities:new', (defaultData: EntitiesNewDefaultData): EntityObserver => {
        if (defaultData.parent && typeof defaultData.parent !== 'string') {
            (defaultData as { parent: unknown }).parent = (defaultData.parent as EntityObserver).apiEntity;
        }

        // replace postCreationCallback with onCreate
        replacePostCreationCallback(defaultData);

        const entity = editor.api.globals.entities.create(defaultData as CreateEntityArguments, {
            history: !defaultData.noHistory,
            select: !defaultData.noSelect
        });

        return entity.observer;
    });
});
