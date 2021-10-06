editor.once('load', function () {
    'use strict';

    function replacePostCreationCallback(data) {
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
     * @param {object} defaultData - The default entity data. This can also define a postCreationCallback argument at each level, which is
     * designed for cases where composite entity hierarchies need some post-processing, and the
     * post processing needs to be done both in the case of initial creation and also the case
     * of undo/redo.
     * @returns {Observer} The new entity
     */
    editor.method('entities:new', function (defaultData) {
        if (typeof defaultData.parent !== 'string') {
            defaultData.parent = defaultData.parent.apiEntity;
        }

        // replace postCreationCallback with onCreate
        replacePostCreationCallback(defaultData);

        const entity = editor.entities.create(defaultData, {
            history: !defaultData.noHistory,
            select: !defaultData.noSelect
        });

        return entity._observer;
    });
});
