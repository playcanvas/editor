import { RelatedAssetsInspector } from "./related-assets.js";

class FontSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { FontSourceAssetInspector };
