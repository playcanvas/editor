import { CodeBlockAssetInspector } from './code-block.js';

class TextAssetInspector extends CodeBlockAssetInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.assetType = 'text';

        super(args);
    }
}

export { TextAssetInspector };
