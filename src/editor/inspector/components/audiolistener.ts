import { ComponentInspector } from './component.ts';
import type { Attribute } from '../attribute.type.d.ts';
import { AttributesInspector } from '../attributes-inspector.ts';


const ATTRIBUTES: Attribute[] = [];

class AudiolistenerComponentInspector extends ComponentInspector {
    constructor(args) {
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

    link(entities) {
        super.link(entities);
        this._attributesInspector.link(entities);
    }

    unlink() {
        super.unlink();
        this._attributesInspector.unlink();
    }
}

export { AudiolistenerComponentInspector };
