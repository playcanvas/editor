import { RelatedAssetsInspector } from './related-assets';

class TextureSourceAssetInspector extends RelatedAssetsInspector {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);

        super(args);
    }
}

export { TextureSourceAssetInspector };
