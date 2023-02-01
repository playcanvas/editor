editor.once('load', function () {
    'use strict';

    /**
     * Deletes the specified entities
     *
     * @param {Observer[]} entities - The entities to delete
     */
    editor.method('entities:delete', function (entities) {
        editor.entities.delete(entities.map(entity => entity.apiEntity));
    });
});
