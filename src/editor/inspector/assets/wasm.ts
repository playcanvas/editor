import { Panel } from '@playcanvas/pcui';

import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';


const ATTRIBUTES: Attribute[] = [{
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
    constructor(args: Record<string, unknown>) {
        args = Object.assign({}, args);
        args.headerText = 'WASM MODULE';

        super(args);
        this._args = args;
        this.buildDom(DOM(this));
    }

    link(assets: import('@playcanvas/observer').Observer[]) {
        this.unlink();
        this._attributesInspector.link(assets);
    }

    unlink() {
        this._attributesInspector.unlink();
    }
}

export { WasmAssetInspector };
