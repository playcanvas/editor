import { CodeBlockAssetInspector } from './code-block.js';

class CssAssetInspector extends CodeBlockAssetInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.assetType = 'css';

        super(args);
    }
}

export { CssAssetInspector };
