editor.once('load', function () {
    'use strict';

    /**
     * Gets the type of a path in the asset schema
     *
     * @param {string} path - The path in the schema separated by dots
     * @returns {string} The type
     */
    editor.method('schema:asset:getType', function (path) {
        return editor.call('schema:getTypeForPath', config.schema.asset, path);
    });
    editor.method('schema:assets:list', () => {
        return config.schema.asset.type.$enum;
    });
});
