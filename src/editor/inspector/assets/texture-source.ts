import { RelatedAssetsInspector } from './related-assets.ts';

class TextureSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { TextureSourceAssetInspector };
