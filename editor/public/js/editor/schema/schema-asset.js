editor.once('load', function () {
    'use strict';

    /**
     * Gets the type of a path in the asset schema
     * @param {String} path The path in the schema separated by dots
     * @returns {String} The type
     */
    editor.method('schema:asset:getType', function (path) {
        return editor.call('schema:getTypeForPath', config.schema.asset, path);
    });
    editor.method('assets:list', () => {
        return config.schema.asset.type.$enum;
    });
});
