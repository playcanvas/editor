import { CodeBlockAssetInspector } from './code-block';

class CssAssetInspector extends CodeBlockAssetInspector {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.assetType = 'css';

        super(args);
    }
}

export { CssAssetInspector };
