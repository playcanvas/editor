import { RelatedAssetsInspector } from './related-assets.js';

class TextureSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { TextureSourceAssetInspector };
