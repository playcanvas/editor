import { CodeBlockAssetInspector } from './code-block';

class ShaderAssetInspector extends CodeBlockAssetInspector {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.assetType = 'shader';

        super(args);
    }
}

export { ShaderAssetInspector };
