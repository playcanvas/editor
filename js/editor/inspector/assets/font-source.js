Object.assign(pcui, (function () {
    class FontSourceAssetInspector extends pcui.RelatedAssetsInspector {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
        }
    }

    return {
        FontSourceAssetInspector: FontSourceAssetInspector
    };
})());
