import { RelatedAssetsInspector } from './related-assets.ts';

class FontSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { FontSourceAssetInspector };
