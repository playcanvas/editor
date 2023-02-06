Object.assign(pcui, (function () {
    class ShaderAssetInspector extends pcui.CodeBlockAssetInspector {
        constructor(args) {
            args = Object.assign({}, args);
            args.assetType = 'shader';

            super(args);
        }
    }

    return {
        ShaderAssetInspector: ShaderAssetInspector
    };
})());
