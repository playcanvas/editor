editor.once('load', function () {
    'use strict';

    /**
     * Gets the type of a path in the scene schema
     * @param {String} path The path in the schema separated by dots
     * @returns {String} The type
     */
    editor.method('schema:scene:getType', function (path) {
        return editor.call('schema:getTypeForPath', config.schema.scene, path);
    });
});
