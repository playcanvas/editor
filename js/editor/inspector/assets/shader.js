import { CodeBlockAssetInspector } from './code-block.js';

class ShaderAssetInspector extends CodeBlockAssetInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.assetType = 'shader';

        super(args);
    }
}

export { ShaderAssetInspector };
