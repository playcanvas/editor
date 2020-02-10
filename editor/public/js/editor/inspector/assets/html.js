Object.assign(pcui, (function () {
    'use strict';

    class HtmlAssetInspector extends pcui.CodeBlockAssetInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.assetType = 'html';

            super(args);
        }
    }

    return {
        HtmlAssetInspector: HtmlAssetInspector
    };
})());
