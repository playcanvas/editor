import type { Attribute } from '../attribute.type.d';
import { AttributesInspector } from '../attributes-inspector';

import { ComponentInspector } from './component';
import type { ComponentInspectorArgs } from './component';

const ATTRIBUTES: Attribute[] = [];

class AudiolistenerComponentInspector extends ComponentInspector {
    constructor(args: ComponentInspectorArgs) {
        args = Object.assign({}, args);
        args.component = 'audiolistener';

        super(args);

        this._attributesInspector = new AttributesInspector({
            assets: args.assets,
            history: args.history,
            attributes: ATTRIBUTES,
            templateOverridesInspector: this._templateOverridesInspector
        });
        this.append(this._attributesInspector);
    }
}

export { AudiolistenerComponentInspector };
