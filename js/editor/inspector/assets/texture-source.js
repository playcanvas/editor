Object.assign(pcui, (function () {
    'use strict';

    class TextureSourceAssetInspector extends pcui.RelatedAssetsInspector {
        constructor(args) {
            args = Object.assign({}, args);

            super(args);
        }
    }

    return {
        TextureSourceAssetInspector: TextureSourceAssetInspector
    };
})());
