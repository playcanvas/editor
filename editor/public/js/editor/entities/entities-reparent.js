editor.once('load', function () {
    'use strict';

    /**
     * Reparent entities under new parent.
     *
     * @param {Array} data - An array of {entity, parent, index} entries where entity is the entity
     * being reparented, parent is the new parent and index is the new index under the parent's children
     */
    editor.method('entities:reparent', function (data, preserveTransform) {
        editor.entities.reparent(data.map((entry) => {
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
