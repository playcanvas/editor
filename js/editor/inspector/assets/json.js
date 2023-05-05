import { CodeBlockAssetInspector } from './code-block.js';

class JsonAssetInspector extends CodeBlockAssetInspector {
    constructor(args) {
        args = Object.assign({}, args);
        args.assetType = 'json';
        args.dataFormatter = data => JSON.stringify(data, null, 4);

        super(args);
    }
}

export { JsonAssetInspector };
