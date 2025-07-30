import { Panel } from '@playcanvas/pcui';

import { AttributesInspector } from '../attributes-inspector.ts';

/**
 * @import { Attribute } from '../attribute.type.d.ts'
 */

/**
 * @type {Attribute[]}
 */
const ATTRIBUTES = [{
    label: 'Name',
    path: 'data.moduleName',
    type: 'string'
}, {
    label: 'Glue script',
    path: 'data.glueScriptId',
    type: 'asset'
}, {
    label: 'Fallback script',
    path: 'data.fallbackScriptId',
    type: 'asset'
}];

const DOM = parent => [
    {
        attributesInspector: new AttributesInspector({
            assets: parent._args.assets,
            history: parent._args.history,
            attributes: ATTRIBUTES
        })
    }
];

class WasmAssetInspector extends Panel {
    constructor(args) {
        args = Object.assign({}, args);
        args.headerText = 'WASM MODULE';

        super(args);
        this._args = args;
        this.buildDom(DOM(this));
    }

    link(assets) {
        this.unlink();
        this._attributesInspector.link(assets);
    }

    unlink() {
        this._attributesInspector.unlink();
    }
}

export { WasmAssetInspector };
