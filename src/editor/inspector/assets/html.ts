import { CodeBlockAssetInspector } from './code-block';

class HtmlAssetInspector extends CodeBlockAssetInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.assetType = 'html';

        super(args);
    }
}

export { HtmlAssetInspector };
