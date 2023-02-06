Object.assign(pcui, (function () {
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
