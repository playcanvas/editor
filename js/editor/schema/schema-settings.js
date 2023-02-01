editor.once('load', function () {
    'use strict';

    /**
     * Gets the type of a path in the settings schema
     *
     * @param {string} path - The path in the schema separated by dots
     * @returns {string} The type
     */
    editor.method('schema:settings:getType', function (path) {
        return editor.call('schema:getTypeForPath', config.schema.settings, path);
    });
});
