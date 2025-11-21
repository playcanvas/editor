import { CodeBlockAssetInspector } from './code-block';

class CssAssetInspector extends CodeBlockAssetInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.assetType = 'css';

        super(args);
    }
}

export { CssAssetInspector };
