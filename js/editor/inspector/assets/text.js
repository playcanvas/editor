Object.assign(pcui, (function () {
    'use strict';

    class TextAssetInspector extends pcui.CodeBlockAssetInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.assetType = 'text';

            super(args);
        }
    }

    return {
        TextAssetInspector: TextAssetInspector
    };
})());
