Object.assign(pcui, (function () {
    'use strict';

    class JsonAssetInspector extends pcui.CodeBlockAssetInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.assetType = 'json';
            args.dataFormatter = data => JSON.stringify(data, null, 4);

            super(args);
        }
    }

    return {
        JsonAssetInspector: JsonAssetInspector
    };
})());
