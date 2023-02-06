Object.assign(pcui, (function () {
    class CssAssetInspector extends pcui.CodeBlockAssetInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.assetType = 'css';

            super(args);
        }
    }

    return {
        CssAssetInspector: CssAssetInspector
    };
})());
