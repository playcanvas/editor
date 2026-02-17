import { CodeBlockAssetInspector } from './code-block';

class TextAssetInspector extends CodeBlockAssetInspector {
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.assetType = 'text';

        super(args);
    }
}

export { TextAssetInspector };
