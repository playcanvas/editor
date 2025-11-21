import { RelatedAssetsInspector } from './related-assets';

class TextureSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { TextureSourceAssetInspector };
