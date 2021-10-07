editor.once('load', function () {
    'use strict';

    /**
     * Copies the specified entities into localStorage
     *
     * @param {Observer[]} entities - The entities to copy
     */
    editor.method('entities:copy', function (entities) {
        editor.entities.copyToClipboard(entities.map(e => e.apiEntity));
    });
});
