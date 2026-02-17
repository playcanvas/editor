import { RelatedAssetsInspector } from './related-assets';

class FontSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { FontSourceAssetInspector };
