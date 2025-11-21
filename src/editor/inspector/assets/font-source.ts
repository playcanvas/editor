import { RelatedAssetsInspector } from './related-assets';

class FontSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { FontSourceAssetInspector };
